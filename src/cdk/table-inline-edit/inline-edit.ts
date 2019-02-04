import {Directive, ElementRef, HostListener, Input, OnDestroy, NgZone, TemplateRef} from '@angular/core';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {BehaviorSubject, fromEvent, Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {audit, debounceTime, filter, first, mapTo, takeUntil, throttle} from 'rxjs/operators';

const HOVER_DELAY_MS = 50;

export const CDK_INLINE_EDIT_OPENED = new InjectionToken<Subject<boolean>>('cdk_ieo');
export const CDK_HOVER = new InjectionToken<Subject<boolean>>('cdk_h');

const booleanSubjectFactory = () => new BehaviorSubject<boolean>(false);

@Directive({
  selector: '[cdkInlineEdit]',
  host: {
    'tabIndex': 0,
    // TODO: aria something?
  }
  providers: [
    {
      provide: CDK_INLINE_EDIT_OPENED,
      useFactory: booleanSubjectFactory,
    }
  ]
})
export class CdkTableInlineEdit<T> implements OnDestroy {
  @Input() cdkInlineEdit: TemplateRef<T>|null = null;

  protected overlayRef?: OverlayRef;

  constructor(
      readonly elementRef: ElementRef,
      overlay: Overlay
      @Inject(CDK_INLINE_EDIT_OPENED) protected readonly opened: Subject<boolean>) {
    this.opened.pipe(distinctUntilChanged()).subscribe((open) => {
      if (open) {
        if (!this.overlayRef) {
          // TODO: work out details of positioning relative to cell.
          this.overlayRef = overlay.create({
            positionStrategy: overlay.position().flexibleConnectedTo(elementRef),
            scrollStrategy: overlay.scrollStrategies.reposition({autoClose: true}),
          });
        }

        // For now, using a template portal but we should support a component
        // version also.
        
        // TODO: Is it better to create a portal once and reuse it?
        this.overlayRef.attach(new TemplatePortal(this.cdkInlineEdit));
      } else if (this.overlayRef) {
        this.overlayRef.detach();
        
        // TODO: Return focus to this cell?
        // Depends on how the popup was closed (return vs click on different
        // cell).
      }
    });
  }
  
  ngOnDestroy() {
    this.opened.complete();
    
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  @HostListener('keypress.enter')
  onEnter() {
    this.opened.next(true);
  }
}

export abstract class Destroyable implements OnDestroy {
  protected readonly destroyed = new ReplaySubject<void>();
  
  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }
}

@Directive({
  selector: '[cdkRowHover]',
  providers: providers: [
    {
      provide: CDK_HOVER,
      useFactory: booleanSubjectFactory,
    }
  ]
})
export class CdkTableRowHover extends Destroyable {
  constructor(
      elementRef: ElementRef,
      @Inject(CDK_HOVER) protected readonly hoverSubject,
      ngZone: NgZone) {
    connectHoverEvents(elementRef, this.destroyed, ngZone, hoverSubject);
  }
}

@Directive({selector: '[cdkCellOverlay]'})
export class CdkTableCellOverlay extends Destroyable {
  @Input() cdkCellOverlay: TemplateRef<any>|null = null;
  
  protected readonly hoverSubject: Subject<boolean>;

  protected overlayRef?: OverlayRef;
  
  constructor(
      elementRef: ElementRef,
      @Optional() @Inject(CDK_HOVER) rowHoverSubject: Subject<boolean>,
      overlay: Overlay,
      ngZone: NgZone) {
    if (rowHoverSubject) {
      this.hoverSubject = rowHoverSubject;
    } else {
      this.hoverSubject = new Subject<boolean>();
      connectHoverEvents(elementRef, this.destroyed, ngZone, hoverSubject);
    }
    
    this.hoverSubject
        .subscribe((open) => {
            if (open) {
              if (!this.overlayRef) {
                // TODO: work out details of positioning over cell.
                this.overlayRef = overlay.create({
                  positionStrategy: overlay.position().flexibleConnectedTo(elementRef),
                  scrollStrategy: overlay.scrollStrategies.reposition({autoClose: true}),
                });
                
                ngZone.runOutsideAngular(() => {
                  this.connectEvents(this.overlayRef.overlayElement());
                });
              }
      
              // TODO: Is it better to create a portal once and reuse it?
              this.overlayRef.attach(new TemplatePortal(this.cdkInlineEditCellOverlay));
            } else if (this.overlayRef) {
              this.overlayRef.detach();
            }
        });
  }
}

function connectHoverEvents(
    elementRef: ElementRef,
    destroyed: Observable<void>,
    ngZone: ngZone,
    outputSubject: Subject<boolean>) {
      ngZone.runOutsideAngular(() => {
        const activity = new Subject<boolean>();
        const opened = new BehaviorSubject(false);

        const openedUntilDestroyed = opened.pipe(takeUntil(destroyed));
        openedUntilDestroyed.subscribe(activity);
    
        openedUntilDestroyed.pipe(
            audit(() => activity.pipe(
                takeUntil(destroyed),
                debounceTime(HOVER_DELAY_MS),)),
            distinctUntilChanged(),)
            .subscribe((open) => {
              ngZone.run(() => {
                outputSubject.next(open);
              });
            });
      });
      
      const enter = fromEvent(elementRef.nativeElement!, 'mouseenter')
          .pipe(mapTo(true));
      enter.subscribe(opened);
  
      // Optimization: Defer registration of other mouse events until first enter.
      enter
          .pipe(
              takeUntil(destroyed),
              first(),)
          .subscribe(() => {
            fromEvent(elementRef.nativeElement!, 'mouseleave')
                .pipe(mapTo(false))
                .subscribe(opened);
            fromEvent(elementRef.nativeElement!, 'mousemove')
                .subscribe(activity);
          });
}

// TODO: move to a separate file
// TODO: will this work from inside the popup? probably need to come up with something
// akin to getClosestDialog to find the opened subject
@Directive({
  selector: 'button[cdkInlineEditOpen]',
  host: {
    '(click)': 'inlineEditOpened.next(true)',
    'type': 'button', // Prevents accidental form submits.
  }
})
export class CdkTableInlineEditOpen {
  constructor(@Inject(CDK_INLINE_EDIT_OPENED) readonly inlineEditOpened: Subject<boolean>) {}
}
