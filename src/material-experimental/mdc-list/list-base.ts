/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Platform} from '@angular/cdk/platform';
import {
  AfterContentInit,
  Directive,
  ElementRef,
  HostBinding,
  NgZone,
  OnDestroy,
  QueryList
} from '@angular/core';
import {RippleConfig, RippleRenderer, RippleTarget, setLines} from '@angular/material/core';
import {Subscription} from 'rxjs';
import {startWith} from 'rxjs/operators';

@Directive()
export class MatListBase {
  @HostBinding('class.mdc-list--non-interactive')
  _isNonInteractive: boolean;
}

@Directive()
export abstract class MatListItemBase implements AfterContentInit, OnDestroy, RippleTarget {
  lines: QueryList<ElementRef<Element>>;

  rippleConfig: RippleConfig = {};

  rippleDisabled: boolean;

  private _subscriptions = new Subscription();

  private _rippleRenderer: RippleRenderer;

  constructor(protected _element: ElementRef, protected _ngZone: NgZone, listBase: MatListBase,
              platform: Platform) {
    this.rippleDisabled = listBase._isNonInteractive;
    if (!listBase._isNonInteractive) {
      this._element.nativeElement.classList.add('mat-mdc-list-item-interactive');
    }
    this._rippleRenderer =
        new RippleRenderer(this, this._ngZone, this._element.nativeElement, platform);
    this._rippleRenderer.setupTriggerEvents(this._element.nativeElement);
  }

  ngAfterContentInit() {
    this._monitorLines();
  }

  /**
   * Subscribes to changes in `MatLine` content children and annotates them appropriately when they
   * change.
   */
  private _monitorLines() {
    this._ngZone.runOutsideAngular(() => {
      this._subscriptions.add(this.lines.changes.pipe(startWith(this.lines))
          .subscribe((lines: QueryList<ElementRef<Element>>) => {
            lines.forEach((line: ElementRef<Element>, index: number) => {
              line.nativeElement.classList.toggle('mdc-list-item__primary-text', index === 0);
              line.nativeElement.classList.toggle('mdc-list-item__secondary-text', index !== 0);
            });
            setLines(lines, this._element, 'mat-mdc');
          }));
    });
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
    this._rippleRenderer._removeTriggerEvents();
  }
}
