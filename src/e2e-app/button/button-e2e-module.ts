/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {MatButtonModule, MyComponentModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {ButtonE2E} from './button-e2e';

@NgModule({
  imports: [
    MatButtonModule,
    MatIconModule,
    MyComponentModule,
  ],
  declarations: [ButtonE2E],
})
export class ButtonE2eModule {
}
