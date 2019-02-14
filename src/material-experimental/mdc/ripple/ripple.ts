import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {Platform} from '@angular/cdk/platform';
import {DOCUMENT} from '@angular/common';
import {AfterViewInit, Directive, ElementRef, Inject, Input} from '@angular/core';
import {RippleAnimationConfig, RippleConfig, RippleRef, RippleState} from '@angular/material';
import {EventType} from '@material/base';
import {MDCRippleFoundation, util as rippleUtil} from '@material/ripple';
import {MDCRippleAdapter} from '@material/ripple/adapter';

const MATCHES = rippleUtil.getMatchesProperty(HTMLElement.prototype) as 'matches';

// NOTES:
// - `color` only accepts `primary` / `accent` / `warn`
// - `radius` is not supported
// - `animation` is not supported
// - `centered` is not supported

@Directive({
  selector: '[mat-mdc-ripple], [matMdcRipple]',
  exportAs: 'matMdcRipple',
  host: {
    'class': 'mat-mdc-ripple',
  }
})
export class MatMdcRipple implements AfterViewInit {
  @Input('matRippleColor') color: string;

  @Input('matRippleUnbounded')
  get unbounded(): boolean {
    return this._unbounded;
  }
  set unbounded(value: boolean) {
    this._unbounded = coerceBooleanProperty(value);
    this._foundation.setUnbounded(this._unbounded);
  }
  private _unbounded = false;

  /** @deprecated not supported by MatMdcRipple */
  @Input('matRippleRadius') radius: number = 0;

  /** @deprecated not supported by MatMdcRipple */
  @Input('matRippleAnimation') animation: RippleAnimationConfig;

  /** @deprecated not supported by MatMdcRipple */
  @Input('matRippleCentered') centered: boolean = true;

  // TODO: implement
  @Input('matRippleDisabled') disabled: boolean = false;

  // TODO: implement
  @Input('matRippleTrigger')
  get trigger(): HTMLElement {
    return this._trigger || this.root_;
  }
  set trigger(value: HTMLElement) {
    const oldListeners = this._listeners;
    this._listeners = [];

    for (const {type, handler} of oldListeners) {
      this._adapter.deregisterInteractionHandler(type, handler);
    }

    this._trigger = value;

    for (const {type, handler} of oldListeners) {
      this._adapter.registerInteractionHandler(type, handler);
    }
  }
  private _trigger: HTMLElement;

  root_: HTMLElement;

  get rippleConfig(): RippleConfig {
    return {
      centered: true,
      radius: 0,
      color: this.color,
      animation: {enterDuration: 0, exitDuration: 0},
      terminateOnPointerUp: false,
    };
  }

  get rippleDisabled(): boolean {
    return this.disabled;
  }

  private _foundation: MDCRippleFoundation;

  private _listeners: {type: EventType, handler: EventListener}[] = [];

  private _adapter: MDCRippleAdapter = {
    browserSupportsCssVars: () =>
        this._platform.isBrowser && rippleUtil.supportsCssVariables(window),
    isSurfaceDisabled: () => this.disabled,
    addClass: (className) => this.root_.classList.add(className),
    removeClass: (className) => this.root_.classList.remove(className),
    containsEventTarget: (target: Node) => this.root_.contains(target),
    registerDocumentInteractionHandler: (evtType, handler) =>
        this._doc.documentElement!.addEventListener(evtType, handler, rippleUtil.applyPassive()),
    deregisterDocumentInteractionHandler: (evtType, handler) =>
        this._doc.documentElement!.removeEventListener(
            evtType, handler, rippleUtil.applyPassive() as EventListenerOptions),
    registerResizeHandler: (handler) => window.addEventListener('resize', handler),
    deregisterResizeHandler: (handler) => window.removeEventListener('resize', handler),
    updateCssVariable: (varName: string, value: string|null) =>
        this.root_.style.setProperty(varName, value),
    computeBoundingRect: () => this.root_.getBoundingClientRect(),
    getWindowPageOffset: () => ({x: window.pageXOffset, y: window.pageYOffset}),
    isUnbounded: () => true,
    isSurfaceActive: () => this.trigger[MATCHES](':active'),
    registerInteractionHandler:
        (type, handler: EventListener) => {
          this._listeners.push({type, handler});
          this.trigger.addEventListener(type, handler);
        },
    deregisterInteractionHandler: (type, handler: EventListener) =>
        this.trigger.removeEventListener(type, handler),
  };

  constructor(
      private _platform: Platform, @Inject(DOCUMENT) private _doc: any,
      root: ElementRef<HTMLElement>) {
    this.root_ = root.nativeElement;
    this._foundation = new MDCRippleFoundation(this._adapter);
  }

  ngAfterViewInit() {
    this._foundation.setUnbounded(this.unbounded);
  }

  /** @deprecated Use deactivate */
  fadeOutAll() {
    this.deactivate();
  }

  /** @deprecated Use activate */
  launch(config: RippleConfig): RippleRef;
  launch(x: number, y: number, config?: RippleConfig): RippleRef;
  launch(): RippleRef {
    this.activate();
    return {state: RippleState.HIDDEN, fadeOut: () => this.deactivate()} as any;
  }

  activate() {
    this._foundation.activate();
  }

  deactivate() {
    this._foundation.deactivate();
  }

  layout() {
    this._foundation.layout();
  }
}
