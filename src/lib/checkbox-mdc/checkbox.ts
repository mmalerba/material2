/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Provider,
  Input,
  Output,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {MDCCheckboxFoundation, MDCCheckboxAdapter} from '@material/checkbox';

// A shared input id count to increment and create unique id for each checkbox.
let INPUT_ID = 0;

/**
 * Provider Expression that allows mat-checkbox to register as a
 * ControlValueAccessor. This allows it to support [(ngModel)].
 * @docs-private
 */
export const MDC_CHECKBOX_CONTROL_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MdcCheckbox),
  multi: true
};


export interface MdcCheckboxChange {
  /** The source MatCheckbox of the event. */
  source: MdcCheckbox;
  /** The new `checked` value of the checkbox. */
  checked: boolean;
}

@Component({
  moduleId: module.id,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mdc-checkbox',
  templateUrl: './checkbox-mdc.html',
  styleUrls: ['./checkbox-mdc.css'],
  exportAs: 'mdcCheckbox',
  providers: [MDC_CHECKBOX_CONTROL_VALUE_ACCESSOR],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.accent]': `color == 'accent'`,
    '[class.primary]': `color == 'primary'`,
    '[class.warn]': `color == 'warn'`,
  }
})
export class MdcCheckbox implements ControlValueAccessor, OnInit, OnDestroy {

  private readonly _uniqueId: string = `mdc-checkbox-${++INPUT_ID}`;
  /**
   * The id of the checkbox, for associating the checkbox label with the
   * checkbox.
   */
  @Input() id = this._uniqueId;
  /** Returns the unique id for the visual hidden input. */
  get inputId(): string {return `${this.id || this._uniqueId}-input`;}
  /** The theme color to use. */
  @Input() color: 'primary' | 'accent' | 'warn' = 'accent';
  /** The aria label describing the checkbox. */
  @Input('aria-label') ariaLabel = '';
  /** The id of the element which labels the checkbox. */
  @Input('aria-labelledby') ariaLabelledby: string | null = null;
  /** Name value will be applied to the input element if present */
  @Input() name: string | null = null;
  /** Whether the checkbox is required. */
  @Input()
  get required(): boolean {return this._required;}
  set required(value: boolean) {this._required = coerceBooleanProperty(value);}
  private _required: boolean;
  /** The value of the checkbox */
  @Input() value = '';
  /** The label position relative to the checkbox. */
  @Input() labelPosition: 'before' | 'after' = 'after';
  /** Whether the checkbox is checked. */
  @Input()
  get checked() {
    return this.foundation.isChecked();
  }
  set checked(checked: boolean) {
    this.foundation.setChecked(checked);
    this._changeDetectorRef.markForCheck();
  }
  /** Whether the checkbox is disabled. */
  @Input()
  get disabled() {
    return this.foundation.isDisabled();
  }
  set disabled(disabled: boolean) {
    this.foundation.setDisabled(disabled);
  }
  /** Whether the checkbox is set to indeterminate. */
  @Input()
  get indeterminate() {
    return this.foundation.isIndeterminate();
  }
  set indeterminate(indeterminate: boolean) {
    this.foundation.setIndeterminate(indeterminate);
  }

  @Input() tabIndex = 0;

  /** An emitter notifying of ever time the checkbox changes value. */
  @Output() readonly change = new EventEmitter<MdcCheckboxChange>();
  /**
   * An emitter notifying of ever time the checkbox's indeterminate state
   * changes.
   */
  @Output() readonly indeterminateChange = new EventEmitter<boolean>();

  /** The checkbox input element. */
  @ViewChild('input') _inputElement!: ElementRef<HTMLInputElement>;
  /** The div element for the form field. */
  @ViewChild('formField') formFieldEl!: ElementRef<HTMLDivElement>;

  /** Set of adapter functions for MDC Checkbox. */
  adapter: MDCCheckboxAdapter = {
    /**
     * Use the Angular Renderer to add a class to the component host element.
     */
    addClass: (className: string) => {
      this.renderer.addClass(this.getHostElement(), className);
    },
    /**
     * Use the Angular Renderer to remove a class to the component host element.
     */
    removeClass:
      (className: string) => {
        this.renderer.removeClass(this.getHostElement(), className);
      },
    /** Use the Angular Renderer to set an attribute on the input element. */
    setNativeControlAttr:
      (attr: string, value: string) => {
        this.renderer.setAttribute(this.getInputElement(), attr, value);
      },
    /** Use the Angular Renderer to remove an attribute on the input element. */
    removeNativeControlAttr:
      (attr: string) => {
        this.renderer.removeAttribute(this.getInputElement(), attr);
      },
    /**
     * Register callbacks for both animationEnd and webkitAnimationEnd on the
     * root element.
     */
    registerAnimationEndHandler:
      (handler: EventListener) => {
        this.getHostElement().addEventListener('animationEnd', handler);
        this.getHostElement().addEventListener('webkitAnimationEnd', handler);
      },
    /**
     * Deregister callbacks for both animationEnd and webkitAnimationEnd on the
     * root element.
     */
    deregisterAnimationEndHandler:
      (handler: EventListener) => {
        this.getHostElement().removeEventListener('animationEnd', handler);
        this.getHostElement().removeEventListener(
          'webkitAnimationEnd', handler);
      },
    /** Register callback for change events on the checkbox input. */
    registerChangeHandler:
      (handler: EventListener) => {
        this.getInputElement().addEventListener('change', (e: Event) => {
          e.stopPropagation();
          handler(e);
          this.indeterminateChange.emit(this.indeterminate);
          this._controlValueAccessorChangeFn(this.checked);
          this.change.emit({source: this, checked: this.checked});
        });
      },
    /** Deregister callback for change events on the checkbox input. */
    deregisterChangeHandler:
      (handler: EventListener) => {
        this.getInputElement().removeEventListener('change', handler);
      },
    /** The input element retrieved from the Angular ViewChild query. */
    getNativeControl:
      () => {
        return this.getInputElement();
      },
    /**
     * Since the input element will be available once angular has rendered the
     * viewed, returning the truthy-ness is analagous to it being in the dom.
     */
    isAttachedToDOM:
      () => {
        return !!this.getInputElement();
      },
    /**
     * As noted in the documentation, this will restart animations.  But until
     * we have evidence that animations are not working correctly, we won't
     * include this to prevent layout thrashing.
     */
    forceLayout: () => {},
  };

  /** The MDC Checkbox foundation instance for the component. */
  foundation = new MDCCheckboxFoundation(
    this.adapter,
  );

  constructor(private element: ElementRef, private renderer: Renderer2, private _changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.foundation.init();
  }

  ngOnDestroy() {
    this.foundation.destroy();
  }

  /** Set browser focus to the input element. */
  focus() {
    this.getInputElement().focus();
  }

  /** Toggle the checked state of the checkbox. */
  toggle() {
    this.checked = !this.checked;
  }

  /** Retrieves the DOM element of the component host. */
  private getHostElement() {
    return this.element.nativeElement;
  }

  /** Retrieves the DOM element of the input element. */
  private getInputElement() {
    return this._inputElement.nativeElement;
  }

  _getAriaChecked(): 'true' | 'false' | 'mixed' {
    return this.checked ? 'true' : (this.indeterminate ? 'mixed' : 'false');
  }


  // Implemented as part of ControlValueAccessor.
  private _controlValueAccessorChangeFn: (value: any) => void = () => {};

  private _onTouched: (event: Event) => void = () => {};

  // Implemented as part of ControlValueAccessor.
  writeValue(value: boolean) {
    this.checked = !!value;
  }

  // Implemented as part of ControlValueAccessor.
  registerOnChange(fn: (value: boolean) => void) {
    this._controlValueAccessorChangeFn = fn;
  }

  // Implemented as part of ControlValueAccessor.
  registerOnTouched(fn: (event: Event) => void) {
    this._onTouched = fn;
  }

  // Implemented as part of ControlValueAccessor.
  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }
}
