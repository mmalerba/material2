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
  NgModule,
  NgZone,
  ViewEncapsulation
} from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'my-component',
  template: '',
  host: {'(click)': 'click()'},
  // tslint:disable-next-line:validate-decorators
  styles: ['my-component {display: block; width: 100px; height: 100px;}'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MyComponent {
  constructor(public el: ElementRef, public ngZone: NgZone) {}

  click() {
    this.ngZone.runOutsideAngular(() =>
        setTimeout(() => this.el.nativeElement.classList.add('done'), 1000));
  }
}

@NgModule({
  declarations: [MyComponent],
  exports: [MyComponent]
})
export class MyComponentModule {}
