/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AfterViewInit, Directive, ElementRef, Inject, Injectable, InjectionToken, Input, OnDestroy, Optional, NgZone, TemplateRef, ViewContainerRef} from '@angular/core';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {TemplatePortal} from '@angular/cdk/portal';
import {BehaviorSubject, fromEvent, Observable, ReplaySubject, Subject} from 'rxjs';
import {audit, debounceTime, distinctUntilChanged, first, mapTo, takeUntil} from 'rxjs/operators';

const HOVER_DELAY_MS = 50;

export const CDK_INLINE_EDIT_OPENED = new InjectionToken<Subject<boolean>>('cdk_ieo');
export const CDK_ROW_HOVER = new InjectionToken<HoverState>('cdk_rh');

export function booleanSubjectFactory() {
  return new BehaviorSubject(false);
}

@Injectable()
export class HoverState {
  readonly hovered = new BehaviorSubject(false);
  
  readonly activities = new Subject<unknown>();
  readonly hoverEvents = new Subject<boolean>();
}

@Directive({
  selector: '[cdkInlineEdit]',
  host: {
    'tabIndex': '0',
    '(keypress.enter)': 'opened.next(true)',
    // TODO: aria something?
  },
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
      overlay: Overlay,
      @Inject(CDK_INLINE_EDIT_OPENED) readonly opened: Subject<boolean>,
      viewContainerRef: ViewContainerRef,) {
    this.opened.pipe(distinctUntilChanged()).subscribe((open) => {
      if (open && this.cdkInlineEdit) {
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
        this.overlayRef.attach(new TemplatePortal(this.cdkInlineEdit, viewContainerRef));
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
  providers: [
    {
      provide: CDK_ROW_HOVER,
      useClass: HoverState,
    }
  ]
})
export class CdkTableRowHover extends Destroyable implements AfterViewInit {
  constructor(
      protected readonly elementRef: ElementRef,
      @Inject(CDK_ROW_HOVER) protected readonly hoverState: HoverState,
      protected readonly ngZone: NgZone) {
    super();
  }
  
  ngAfterViewInit() {
    connectHoverEvents(this.elementRef.nativeElement!, this.destroyed, this.ngZone, this.hoverState);
  }
}

@Directive({selector: '[cdkCellOverlay]'})
export class CdkTableCellOverlay extends Destroyable implements AfterViewInit {
  @Input() cdkCellOverlay: TemplateRef<any>|null = null;

  protected overlayRef?: OverlayRef;
  
  constructor(
      protected readonly elementRef: ElementRef,
      @Optional() @Inject(CDK_ROW_HOVER) protected hoverState: HoverState,
      protected readonly overlay: Overlay,
      protected readonly viewContainerRef: ViewContainerRef,
      protected readonly ngZone: NgZone) {
    super();
  }
  
  ngAfterViewInit() {
    if (!this.hoverState) {
      this.hoverState = new HoverState();
      connectHoverEvents(this.elementRef.nativeElement!, this.destroyed, this.ngZone, this.hoverState);
    }
    
    this.hoverState.hovered
        .subscribe((isHovered) => {
            if (isHovered && this.cdkCellOverlay) {
              if (!this.overlayRef) {
                // TODO: work out details of positioning over cell.
                this.overlayRef = this.overlay.create({
                  positionStrategy: this.overlay.position().flexibleConnectedTo(this.elementRef)
                      .withGrowAfterOpen()
                      .withPositions([{
                        originX: 'end',
                        originY: 'center',
                        overlayX: 'end',
                        overlayY: 'center',
                      }]),
                  scrollStrategy: this.overlay.scrollStrategies.reposition({autoClose: true}),
                });
                
                connectHoverEvents(this.overlayRef.overlayElement, this.destroyed, this.ngZone, this.hoverState);
              }
      
              // TODO: handle unrelated detachments? Or maybe this wont need auto close.
      
              // TODO: Is it better to create a portal once and reuse it?
              this.overlayRef.attach(new TemplatePortal(this.cdkCellOverlay, this.viewContainerRef));
            } else if (this.overlayRef) {
              this.overlayRef.detach();
            }
        });
  }
}

function connectHoverEvents(
    element: HTMLElement,
    destroyed: Observable<void>,
    ngZone: NgZone,
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
      
      const enter = fromEvent(element, 'mouseenter')
          .pipe(mapTo(true));
      enter.subscribe(hoverState.hoverEvents);
  
      // Optimization: Defer registration of other mouse events until first enter.
      enter
          .pipe(
              takeUntil(destroyed),
              first(),)
          .subscribe(() => {
            fromEvent(element, 'mouseleave')
                .pipe(mapTo(false))
                .subscribe(hoverState.hoverEvents);
            fromEvent(element, 'mousemove')
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
