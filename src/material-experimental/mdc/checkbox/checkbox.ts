/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {DOCUMENT} from '@angular/common';
import {
  AfterViewInit,
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {getCorrectEventName} from '@material/animation';
import {MDCCheckboxAdapter, MDCCheckboxFoundation} from '@material/checkbox';
import {MDCFormFieldAdapter, MDCFormFieldFoundation} from '@material/form-field';
import {
  MDCRipple,
  MDCRippleAdapter,
  MDCRippleFoundation,
  util as rippleUtil
} from '@material/ripple';
import {MDCSelectionControl} from '@material/selection-control';

let nextUniqueId = 0;

@Component({
  moduleId: module.id,
  selector: 'mat-mdc-checkbox',
  templateUrl: 'checkbox.html',
  styleUrls: ['checkbox.css'],
  host: {
    '[id]': 'id',
    '[attr.tabindex]': 'null',
  },
  exportAs: 'matCheckbox',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatMdcCheckbox implements AfterViewInit, OnDestroy, MDCSelectionControl {
  @ViewChild('formField') formField: ElementRef<HTMLElement>;
  @ViewChild('checkbox') checkbox: ElementRef<HTMLElement>;
  @ViewChild('nativeCheckbox') nativeCheckbox: ElementRef<HTMLInputElement>;
  @ViewChild('label') label: ElementRef<HTMLLabelElement>;

  private _checkboxFoundation: MDCCheckboxFoundation;
  private _formFieldFoundation: MDCFormFieldFoundation;
  private _ripple: MDCRipple;
  private _handleChange: EventListener;
  private _handleAnimationEnd: EventListener;

  private _checkboxAdapter: MDCCheckboxAdapter & {
    // Type is missing some properties
    isIndeterminate: () => boolean,
    isChecked: () => boolean,
    hasNativeControl: () => boolean,
    setNativeControlDisabled: (disabled: boolean) => void,
  } = {
    addClass: (className) => this.checkbox.nativeElement.classList.add(className),
    removeClass: (className) => this.checkbox.nativeElement.classList.remove(className),
    setNativeControlAttr: (attr, value) =>
        this.nativeCheckbox.nativeElement.setAttribute(attr, value),
    removeNativeControlAttr: (attr) => this.nativeCheckbox.nativeElement.removeAttribute(attr),
    getNativeControl: () => this.nativeCheckbox.nativeElement,
    isIndeterminate: () => this.indeterminate,
    isChecked: () => this.checked,
    hasNativeControl: () => !!this.nativeCheckbox.nativeElement,
    setNativeControlDisabled:
        (disabled: boolean) => this.nativeCheckbox.nativeElement.disabled = disabled,
    forceLayout: () => this.checkbox.nativeElement.offsetWidth,
    isAttachedToDOM: () => !!this.checkbox.nativeElement.parentNode,
    // .d.ts lists some properties that are no longer needed
    registerAnimationEndHandler: undefined as any,
    deregisterAnimationEndHandler: undefined as any,
    registerChangeHandler: undefined as any,
    deregisterChangeHandler: undefined as any,
  };

  private _formFieldAdapter: MDCFormFieldAdapter = {
    registerInteractionHandler: (type, handler) =>
        this.label.nativeElement.addEventListener(type, handler),
    deregisterInteractionHandler: (type, handler) =>
        this.label.nativeElement.removeEventListener(type, handler),
    activateInputRipple: () => {
      if (this.ripple) {
        this.ripple.activate();
      }
    },
    deactivateInputRipple: () => {
      if (this.ripple) {
        this.ripple.deactivate();
      }
    },
  };

  @Input('aria-label') ariaLabel: string = '';

  @Input('aria-labelledby') ariaLabelledby: string | null = null;

  private _uniqueId: string = `mat-mdc-checkbox-${++nextUniqueId}`;
  @Input() id: string = this._uniqueId;
  get inputId(): string { return `${this.id || this._uniqueId}-input`; }

  @Input()
  get required(): boolean { return this._required; }
  set required(value: boolean) { this._required = coerceBooleanProperty(value); }
  private _required: boolean;

  @Input() labelPosition: 'before' | 'after' = 'after';

  @Input() name: string | null = null;

  @Input() value: string;

  @Input()
  get checked() {
    return this._checked;
  }
  set checked(checked) {
    if (this._checked != checked) {
      this._checked = checked;
      this._cdr.markForCheck();
    }
  }
  private _checked: boolean;

  @Input()
  get disabled() {
    return this._disabled;
  }
  set disabled(disabled) {
    const newValue = coerceBooleanProperty(disabled);
    if (newValue != this._disabled) {
      this._disabled = newValue;
      this._cdr.markForCheck();
    }
  }
  private _disabled = false;

  @Input()
  get indeterminate(): boolean {
    return this._indeterminate;
  }
  set indeterminate(indeterminate: boolean) {
    const newValue = coerceBooleanProperty(indeterminate);
    if (newValue != this._indeterminate) {
      this._indeterminate = newValue;
      this._cdr.markForCheck();
    }
  }
  private _indeterminate = false;

  tabIndex = 0;

  constructor(@Inject(DOCUMENT) private _doc: any,
              @Attribute('tabindex') tabIndex: string,
              private _cdr: ChangeDetectorRef) {
    this.tabIndex = parseInt(tabIndex) || 0;
  }

  ngAfterViewInit() {
    this._checkboxFoundation = new MDCCheckboxFoundation(this._checkboxAdapter);
    this._formFieldFoundation = new MDCFormFieldFoundation(this._formFieldAdapter);
    this._checkboxFoundation.init();
    this._formFieldFoundation.init();

    this._ripple = this._initRipple();

    // Initial sync with DOM
    this._handleChange = () => this._checkboxFoundation.handleChange();
    this._handleAnimationEnd = () => this._checkboxFoundation.handleAnimationEnd();
    this.nativeCheckbox.nativeElement.addEventListener('change', this._handleChange);
    this.checkbox.nativeElement.addEventListener(
        getCorrectEventName(window, 'animationend'), this._handleAnimationEnd);
  }

  ngOnDestroy() {
    this._ripple.destroy();
    this.nativeCheckbox.nativeElement.removeEventListener('change', this._handleChange);
    this.checkbox.nativeElement.removeEventListener(
        getCorrectEventName(window, 'animationend'), this._handleAnimationEnd);
    this._checkboxFoundation.destroy();
    this._formFieldFoundation.destroy();
  }

  get ripple() {
    return this._ripple;
  }

  private _initRipple() {
    const MATCHES = rippleUtil.getMatchesProperty(HTMLElement.prototype) as any as 'matches';
    const rippleAdapter: MDCRippleAdapter = {
      browserSupportsCssVars: () => !!rippleUtil.supportsCssVariables(window),
      isSurfaceDisabled: () => this.disabled,
      addClass: (className) => this.checkbox.nativeElement.classList.add(className),
      removeClass: (className) => this.checkbox.nativeElement.classList.remove(className),
      containsEventTarget: (target: Node) => this.checkbox.nativeElement.contains(target),
      registerDocumentInteractionHandler: (evtType, handler) =>
          this._doc.documentElement.addEventListener(evtType, handler, rippleUtil.applyPassive()),
      deregisterDocumentInteractionHandler: (evtType, handler) =>
          this._doc.documentElement.removeEventListener(evtType, handler,
              rippleUtil.applyPassive() as EventListenerOptions),
      registerResizeHandler: (handler: EventListener) => window.addEventListener('resize', handler),
      deregisterResizeHandler: (handler: EventListener) =>
          window.removeEventListener('resize', handler),
      updateCssVariable: (varName: string, value: string | null) =>
          this.checkbox.nativeElement.style.setProperty(varName, value),
      computeBoundingRect: () => this.checkbox.nativeElement.getBoundingClientRect(),
      getWindowPageOffset: () => ({x: window.pageXOffset, y: window.pageYOffset}),
      isUnbounded: () => true,
      isSurfaceActive: () => this.nativeCheckbox.nativeElement[MATCHES](':active'),
      registerInteractionHandler: (type: string, handler: EventListener) =>
          this.nativeCheckbox.nativeElement.addEventListener(type, handler),
      deregisterInteractionHandler: (type: string, handler: EventListener) =>
          this.nativeCheckbox.nativeElement.removeEventListener(type, handler),
    };
    const foundation = new MDCRippleFoundation(rippleAdapter);
    return new MDCRipple(this.checkbox.nativeElement, foundation);
  }
}
