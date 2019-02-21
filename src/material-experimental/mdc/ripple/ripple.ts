import {Platform} from '@angular/cdk/platform';
import {DOCUMENT} from '@angular/common';
import {Inject, Injectable} from '@angular/core';
import {ponyfill} from '@material/dom';
import {MDCRippleFoundation, util as rippleUtil} from '@material/ripple';
import {MDCRippleAdapter} from '@material/ripple/adapter';

export interface MatMdcRippleAdapter extends MDCRippleAdapter {
  changeTrigger(trigger: HTMLElement): void;
}

// NOTES:
// - `color` only accepts `primary` / `accent` / `warn`
// - `radius` is not supported
// - `animation` is not supported
// - `centered` is not supported
// - `RippleRef` and `RippleConfig` are mostly useless
// - `fadeOutAll` and `launch` are replaced with `activate` and `deactivate`
// - `disabled` is not hooked up to anything yet

@Injectable({providedIn: 'root'})
export class MatMdcRippleRenderer {
  constructor(private _platform: Platform, @Inject(DOCUMENT) private _doc: any) {}

  createAdapter(
      surfaceEl: HTMLElement, triggerEl: HTMLElement = surfaceEl,
      getDisabled = () => false): MatMdcRippleAdapter {
    let listeners: {type: string, handler: EventListenerOrEventListenerObject}[] = [];
    return {
      browserSupportsCssVars: () =>
          this._platform.isBrowser && rippleUtil.supportsCssVariables(window),
      isSurfaceDisabled: getDisabled,
      addClass: (className) => surfaceEl.classList.add(className),
      removeClass: (className) => surfaceEl.classList.remove(className),
      containsEventTarget: (target: Node) => surfaceEl.contains(target),
      registerDocumentInteractionHandler: (evtType, handler) =>
          this._doc.documentElement!.addEventListener(evtType, handler, rippleUtil.applyPassive()),
      deregisterDocumentInteractionHandler: (evtType, handler) =>
          this._doc.documentElement!.removeEventListener(
              evtType, handler, rippleUtil.applyPassive() as EventListenerOptions),
      registerResizeHandler: (handler) => window.addEventListener('resize', handler),
      deregisterResizeHandler: (handler) => window.removeEventListener('resize', handler),
      updateCssVariable: (varName, value) => surfaceEl.style.setProperty(varName, value),
      computeBoundingRect: () => surfaceEl.getBoundingClientRect(),
      getWindowPageOffset: () => ({x: window.pageXOffset, y: window.pageYOffset}),
      isUnbounded: () => true,
      isSurfaceActive: () => ponyfill.matches(triggerEl, ':active'),
      registerInteractionHandler: (type, handler) => {
        listeners.push({type, handler});
        triggerEl.addEventListener(type, handler);
      },
      deregisterInteractionHandler: (type, handler) => {
        const removeIndex =
            listeners.findIndex(saved => type == saved.type && handler == saved.handler);
        listeners.splice(removeIndex, 1);
        triggerEl.removeEventListener(type, handler);
      },
      changeTrigger: (newTriggerEl) => {
        for (const {type, handler} of listeners) {
          triggerEl.removeEventListener(type, handler);
          newTriggerEl.addEventListener(type, handler);
        }
      }
    };
  }

  createRipple(adapter: MDCRippleAdapter, skipInit?: boolean): MDCRippleFoundation;
  createRipple(
      surfaceEl: HTMLElement, triggerEl?: HTMLElement, getDisabled?: () => boolean,
      skipInit?: boolean): MDCRippleFoundation;
  createRipple(adapterOrSurfaceEl: any, initOrTriggerEl?: any, getDisabled?: any, skipInit?: any) {
    let ripple: MDCRippleFoundation;
    if (initOrTriggerEl instanceof HTMLElement) {
      ripple = new MDCRippleFoundation(
          this.createAdapter(adapterOrSurfaceEl, initOrTriggerEl, getDisabled));
    } else {
      ripple = new MDCRippleFoundation(adapterOrSurfaceEl);
      skipInit = initOrTriggerEl;
    }
    if (skipInit) {
      ripple.init();
    }
    return ripple;
  }
}

// @Directive({
//   selector: '[mat-mdc-ripple], [matMdcRipple]',
//   exportAs: 'matMdcRipple',
//   host: {
//     'class': 'mat-mdc-ripple',
//   }
// })
// export class MatMdcRipple implements AfterViewInit, OnDestroy {
//   @Input('matRippleColor') color: string;
//
//   @Input('matRippleUnbounded')
//   get unbounded(): boolean {
//     return this._unbounded;
//   }
//   set unbounded(value: boolean) {
//     this._unbounded = coerceBooleanProperty(value);
//     this._foundation.setUnbounded(this._unbounded);
//   }
//   private _unbounded = false;
//
//   /** @deprecated not supported by MatMdcRipple */
//   @Input('matRippleRadius') radius: number = 0;
//
//   /** @deprecated not supported by MatMdcRipple */
//   @Input('matRippleAnimation') animation: RippleAnimationConfig;
//
//   /** @deprecated not supported by MatMdcRipple */
//   @Input('matRippleCentered') centered: boolean = true;
//
//   // TODO: implement
//   @Input('matRippleDisabled') disabled: boolean = false;
//
//   @Input('matRippleTrigger')
//   get trigger(): HTMLElement {
//     return this._trigger || this.root_;
//   }
//   set trigger(value: HTMLElement) {
//     this._trigger = value;
//     this._adapter.changeTrigger(this._trigger);
//   }
//   private _trigger: HTMLElement;
//
//   root_: HTMLElement;
//
//   get rippleConfig(): RippleConfig {
//     return {
//       centered: true,
//       radius: 0,
//       color: this.color,
//       animation: {enterDuration: 0, exitDuration: 0},
//       terminateOnPointerUp: false,
//     };
//   }
//
//   get rippleDisabled(): boolean {
//     return this.disabled;
//   }
//
//   private _foundation: MDCRippleFoundation;
//
//   private _adapter: MatMdcRippleAdapter =
//       this._rippleRenderer.createAdapter(this.root_, this.trigger, () => this.disabled);
//
//   constructor(private _rippleRenderer: MatMdcRippleRenderer, root: ElementRef<HTMLElement>) {
//     this.root_ = root.nativeElement;
//     this._foundation = this._rippleRenderer.createRipple(this._adapter, true);
//   }
//
//   ngAfterViewInit() {
//     this._foundation.init();
//   }
//
//   ngOnDestroy() {
//     this._foundation.destroy();
//   }
//
//   /** @deprecated Use deactivate */
//   fadeOutAll() {
//     this.deactivate();
//   }
//
//   /** @deprecated Use activate */
//   launch(config: RippleConfig): RippleRef;
//   launch(x: number, y: number, config?: RippleConfig): RippleRef;
//   launch(): RippleRef {
//     this.activate();
//     return {state: RippleState.HIDDEN, fadeOut: () => this.deactivate()} as any;
//   }
//
//   activate() {
//     this._foundation.activate();
//   }
//
//   deactivate() {
//     this._foundation.deactivate();
//   }
//
//   layout() {
//     this._foundation.layout();
//   }
// }
