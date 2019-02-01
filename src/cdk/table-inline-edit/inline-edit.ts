import {Directive, ElementRef, HostListener, Input, OnDestroy, NgZone, TemplateRef} from '@angular/core';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {BehaviorSubject, fromEvent, Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {audit, debounceTime, filter, first, mapTo, takeUntil, throttle} from 'rxjs/operators';

const HOVER_DELAY_MS = 50;

export const CDK_INLINE_EDIT_OPENED = new InjectionToken<Subject<boolean>>('cdk_ieo');

@Directive({
  selector: '[cdkInlineEdit]',
  host: {
    'tabIndex': 0,
    // TODO: aria something?
  }
  providers: [
    {
      provide: CDK_INLINE_EDIT_OPENED,
      useFactory: () => new BehaviorSubject<boolean>(false),
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

@Directive({selector: '[cdkCellOverlay]'})
export class CdkTableCellOverlay implements OnDestroy {
  @Input() cdkCellOverlay: TemplateRef<any>|null = null;
  
  protected readonly opened = new Subject<boolean>();
  protected readonly activity = new Subject<void>();
  protected readonly destroyed = new ReplaySubject<void>();
  
  protected overlayRef?: OverlayRef;
  
  constructor(
      protected readonly elementRef: ElementRef,
      protected readonly overlay: Overlay,
      ngZone: NgZone) {
    
    ngZone.runOutsideAngular(() => {
      const opened = this.opened.pipe(takeUntil(this.destroyed));
      opened.subscribe(this.activity);
      
      opened.pipe(
          audit(() => this.activity.pipe(
              takeUntil(this.destroyed),
              debounceTime(HOVER_DELAY_MS),)),
          distinctUntilChanged(),)
          .subscribe((open) => {
            ngZone.run(() => {
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
          });
      
      this.connectEvents(elementRef);
    });
  }
  
  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }
  
  protected connectEvents(elementRef: ElementRef) {
    const enter = fromEvent(elementRef.nativeElement!, 'mouseenter')
        .pipe(mapTo(true));
    enter.subscribe(this.opened);
    
    // Optimization: Defer registration of other mouse events until first enter.
    enter
        .pipe(
            takeUntil(this.destroyed),
            first(),)
        .subscribe(() => {
          fromEvent(elementRef.nativeElement!, 'mouseleave')
              .pipe(mapTo(false))
              .subscribe(this.opened);
          fromEvent(elementRef.nativeElement!, 'mousemove')
              .subscribe(this.activity);
        });
  }
}

// TODO: move to a separate file
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
