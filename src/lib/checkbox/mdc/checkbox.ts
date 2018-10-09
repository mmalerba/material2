/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component, ElementRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';

import {MDCCheckbox} from '@material/checkbox';
import {MDCFormField} from '@material/form-field';

@Component({
  moduleId: module.id,
  selector: 'mat-mdc-checkbox',
  templateUrl: 'checkbox.html',
  exportAs: 'matCheckbox',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatMdcCheckbox implements AfterViewInit {
  @ViewChild('formField') formField: ElementRef<HTMLElement>;
  @ViewChild('checkbox') checkbox: ElementRef<HTMLInputElement>;

  private _mdcFormField: MDCFormField;
  private _mdcCheckbox: MDCCheckbox;

  ngAfterViewInit() {
    this._mdcFormField = new MDCFormField(this.formField.nativeElement);
    this._mdcCheckbox = new MDCCheckbox(this.checkbox.nativeElement);
    this._mdcFormField.input = this._mdcCheckbox;
  }
}
