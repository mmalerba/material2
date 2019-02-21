/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {Platform} from '@angular/cdk/platform';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatCheckboxChange, ThemePalette} from '@angular/material';
import {getCorrectEventName} from '@material/animation';
import {MDCCheckboxAdapter, MDCCheckboxFoundation} from '@material/checkbox';
import {MDCFormFieldFoundation} from '@material/form-field';
import {MDCFormFieldAdapter} from '@material/form-field/adapter';
import {MDCSelectionControl} from '@material/selection-control';

import {MatMdcRippleRenderer} from '../ripple/ripple';

let nextUniqueId = 0;

export const MAT_MDC_CHECKBOX_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MatMdcCheckbox),
  multi: true
};

@Component({
  moduleId: module.id,
  selector: 'mat-mdc-checkbox',
  templateUrl: 'checkbox.html',
  styleUrls: ['checkbox.css'],
  host: {
    '[attr.id]': 'id || null',
    '[class.mat-primary]': 'color == "primary"',
    '[class.mat-accent]': 'color == "accent"',
    '[class.mat-warn]': 'color == "warn"',
  },
  providers: [MAT_MDC_CHECKBOX_CONTROL_VALUE_ACCESSOR],
  exportAs: 'matCheckbox',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatMdcCheckbox implements AfterViewInit, OnDestroy, MDCSelectionControl,
    ControlValueAccessor {
  @ViewChild('formField') formField: ElementRef<HTMLElement>;
  @ViewChild('checkbox', {read: ElementRef}) checkbox: ElementRef<HTMLElement>;
  @ViewChild('nativeCheckbox') nativeCheckbox: ElementRef<HTMLInputElement>;
  @ViewChild('label') label: ElementRef<HTMLLabelElement>;
  // TODO: fix type once it no longer has to be MDCRipple.
  ripple: any;

  private _checkboxFoundation: MDCCheckboxFoundation;
  private _formFieldFoundation: MDCFormFieldFoundation;
  private _handleChange: EventListener;
  private _handleAnimationEnd: EventListener;

  _classes: {[key: string]: boolean} = {'mdc-checkbox__native-control': true};

  private _setClass(cssClass: string, active: boolean) {
    this._classes = {...this._classes, [cssClass]: active};
    this._cdr.markForCheck();
  }

  private _checkboxAdapter: MDCCheckboxAdapter = {
    addClass: (className) => this._setClass(className, true),
    removeClass: (className) => this._setClass(className, false),
    setNativeControlAttr: (attr, value) =>
        this.nativeCheckbox.nativeElement.setAttribute(attr, value),
    removeNativeControlAttr: (attr) => this.nativeCheckbox.nativeElement.removeAttribute(attr),
    isIndeterminate: () => this.indeterminate,
    isChecked: () => this.checked,
    hasNativeControl: () => !!this.nativeCheckbox.nativeElement,
    setNativeControlDisabled: (disabled: boolean) => this.disabled = disabled,
    forceLayout: () => this.checkbox.nativeElement.offsetWidth,
    isAttachedToDOM: () => !!this.checkbox.nativeElement.parentNode,
  };

  private _formFieldAdapter: MDCFormFieldAdapter = {
    registerInteractionHandler: (type, handler) =>
        this.label.nativeElement.addEventListener(type, handler),
    deregisterInteractionHandler: (type, handler) =>
        this.label.nativeElement.removeEventListener(type, handler),
    activateInputRipple: () => this.ripple.activate(),
    deactivateInputRipple: () => this.ripple.deactivate()
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
      this.indeterminateChange.next(newValue);
    }
  }
  private _indeterminate = false;

  @Input() tabIndex = 0;

  @Input() color: ThemePalette = 'primary';

  @Input() disableRipple: boolean = false;

  @Output() readonly change: EventEmitter<MatCheckboxChange> =
      new EventEmitter<MatCheckboxChange>();

  @Output() readonly indeterminateChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  private _cvaOnChange = (_: boolean) => {};
  private _cvaOnTouch = () => {};

  constructor(
      private _platform: Platform, private _cdr: ChangeDetectorRef,
      private _rippleRenderer: MatMdcRippleRenderer) {}

  ngAfterViewInit() {
    this.ripple = this._rippleRenderer.createRipple(
        this.checkbox.nativeElement, this.nativeCheckbox.nativeElement, () => this.disableRipple);
    this._checkboxFoundation = new MDCCheckboxFoundation(this._checkboxAdapter);
    this._formFieldFoundation = new MDCFormFieldFoundation(this._formFieldAdapter);
    this._checkboxFoundation.init();
    this._formFieldFoundation.init();

    // Initial sync with DOM
    this._handleChange = () => this._checkboxFoundation.handleChange();
    this._handleAnimationEnd = () => this._checkboxFoundation.handleAnimationEnd();
    this.nativeCheckbox.nativeElement.addEventListener('change', this._handleChange);
    this.checkbox.nativeElement.addEventListener(
        this._platform.isBrowser ? getCorrectEventName(window, 'animationend') : 'animationend',
        this._handleAnimationEnd);
  }

  ngOnDestroy() {
    this.nativeCheckbox.nativeElement.removeEventListener('change', this._handleChange);
    this.checkbox.nativeElement.removeEventListener(
        this._platform.isBrowser ? getCorrectEventName(window, 'animationend') : 'animationend',
        this._handleAnimationEnd);
    this._checkboxFoundation.destroy();
    this._formFieldFoundation.destroy();
    this.ripple.destroy();
  }

  _onNativeChange(event: Event) {
    this._checked = this.nativeCheckbox.nativeElement.checked;
    this._indeterminate = this.nativeCheckbox.nativeElement.indeterminate;

    // Prevent the native change event from escaping the component boundary
    event.stopPropagation();
    // Dispatch our own event instead
    const newEvent = new MatCheckboxChange();
    newEvent.source = this as any;
    newEvent.checked = this.checked;
    this.change.next(newEvent);
    this._cvaOnChange(this.checked);
    this.indeterminateChange.next(false);
  }

  registerOnChange(fn: (checked: boolean) => void): void {
    this._cvaOnChange = fn;
  }

  registerOnTouched(fn: () => {}): void {
    this._cvaOnTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(value: any): void {
    this.checked = !!value;
  }

  _onNativeBlur() {
    Promise.resolve().then(() => this._cvaOnTouch());
  }

  toggle() {
    this.checked = !this.checked;
  }

  focus() {
    this.nativeCheckbox.nativeElement.focus();
  }
}
