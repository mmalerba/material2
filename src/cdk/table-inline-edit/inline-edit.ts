import {Directive, ElementRef, HostListener, Inject, Injectable, Input, OnDestroy, Optional, NgZone, TemplateRef} from '@angular/core';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {BehaviorSubject, fromEvent, Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {audit, debounceTime, filter, first, mapTo, takeUntil, throttle} from 'rxjs/operators';

const HOVER_DELAY_MS = 50;

export const CDK_INLINE_EDIT_OPENED = new InjectionToken<Subject<boolean>>('cdk_ieo');
export const CDK_ROW_HOVER = new InjectionToken<HoverState>('cdk_rh');

@Injectable()
export class HoverState {
  readonly hovered = new BehaviorSubject(false);
  
  readonly activities = new Subject<void>();
  readonly hoverEvents = new Subject<boolean>();
}

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
            // TODO: this should be configurable
            positionStrategy: overlay.position().flexibleConnectedTo(elementRef)
                .withGrowAfterOpen()
                .withPush()
                .withPositions([{
                  originX: 'start',
                  originY: 'top',
                  overlayX: 'start',
                  overlayY: 'top',
                }]),
            scrollStrategy: overlay.scrollStrategies.reposition({autoClose: true}),
          });
          
          this.overlayRef.detachments().pipe(mapTo(false)).subscribe(this.opened);
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
      provide: CDK_ROW_HOVER,
      useClass: HoverState,
    }
  ]
})
export class CdkTableRowHover extends Destroyable {
  constructor(
      elementRef: ElementRef,
      @Inject(CDK_HOVER) protected readonly hoverState: HoverState,
      ngZone: NgZone) {
    connectHoverEvents(elementRef, this.destroyed, ngZone, hoverState);
  }
}

@Directive({selector: '[cdkCellOverlay]'})
export class CdkTableCellOverlay extends Destroyable {
  @Input() cdkCellOverlay: TemplateRef<any>|null = null;
  
  protected readonly hoverState: HoverState;

  protected overlayRef?: OverlayRef;
  
  constructor(
      elementRef: ElementRef,
      @Optional() @Inject(CDK_ROW_HOVER) rowHoverState: HoverState,
      overlay: Overlay,
      ngZone: NgZone) {
    if (rowHoverState) {
      this.hoverState = rowHoverState;
    } else {
      this.hoverState = new HoverState();
      connectHoverEvents(elementRef, this.destroyed, ngZone, hoverState);
    }
    
    this.hoverState.hovered
        .subscribe((isHovered) => {
            if (isHovered) {
              if (!this.overlayRef) {
                // TODO: work out details of positioning over cell.
                this.overlayRef = overlay.create({
                  positionStrategy: overlay.position().flexibleConnectedTo(elementRef)
                      .withGrowAfterOpen()
                      .withPositions([{
                        originX: 'end',
                        originY: 'center',
                        overlayX: 'end',
                        overlayY: 'center',
                      }]),
                  scrollStrategy: overlay.scrollStrategies.reposition({autoClose: true}),
                });
                
                connectHoverEvents(this.overlayRef.overlayElement(), this.destroyed, ngZone, hoverState);
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
    hoverState: HoverState) {
      ngZone.runOutsideAngular(() => {
        const hoverEventsUntilDestroyed = hoverState.hoverEvents.pipe(takeUntil(destroyed));
        hoverEventsUntilDestroyed.subscribe(hoverState.activities);
    
        hoverEventsUntilDestroyed.pipe(
            audit(() => hoverState.activities.pipe(
                takeUntil(destroyed),
                debounceTime(HOVER_DELAY_MS),)),
            distinctUntilChanged(),)
            .subscribe((isHovered) => {
              ngZone.run(() => {
                hoverState.hovered.next(isHovered);
              });
            });
      });
      
      const enter = fromEvent(elementRef.nativeElement!, 'mouseenter')
          .pipe(mapTo(true));
      enter.subscribe(hoverState.hoverEvents);
  
      // Optimization: Defer registration of other mouse events until first enter.
      enter
          .pipe(
              takeUntil(destroyed),
              first(),)
          .subscribe(() => {
            fromEvent(elementRef.nativeElement!, 'mouseleave')
                .pipe(mapTo(false))
                .subscribe(hoverState.hoverEvents);
            fromEvent(elementRef.nativeElement!, 'mousemove')
                .subscribe(hoverState.activities);
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
