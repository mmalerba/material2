/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';

import { Observable } from 'rxjs';
import {
  BreakpointObserver,
  Breakpoints,
  BreakpointState
} from '@angular/cdk/layout';
import { map } from 'rxjs/operators';

@Component({
  moduleId: module.id,
  selector: 'sidenav-demo',
  templateUrl: 'sidenav-demo.html',
  styleUrls: ['sidenav-demo.css'],

})
export class SidenavDemo {
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
    this.isHandset$.subscribe(isHandset => console.log(isHandset));
  }
}
