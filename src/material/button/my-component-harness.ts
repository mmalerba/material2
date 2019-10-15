/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness} from '@angular/cdk/testing';

export class MyComponentHarness extends ComponentHarness {
  static hostSelector = 'my-component';

  async click() {
    return (await this.host()).click();
  }

  async isDone() {
    return (await this.host()).hasClass('done');
  }
}
