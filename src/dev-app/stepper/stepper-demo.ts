/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';


@Component({
  moduleId: module.id,
  selector: 'stepper-demo',
  templateUrl: 'stepper-demo.html',
})
export class StepperDemo {
  shouldShowStep2 = false;
}
