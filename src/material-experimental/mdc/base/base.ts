/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {normalizePassiveListenerOptions} from '@angular/cdk/platform';
import {ElementRef, OnDestroy} from '@angular/core';
import {Constructor} from '@angular/material/core/common-behaviors/constructor';

export interface MdcWrapperBase extends OnDestroy {
  listen(el: Element | ElementRef<Element>,
         event: string,
         listener: EventListener,
         options?: boolean | AddEventListenerOptions): number;
  unlisten(id: number): void;
}

export function mixinMdcWrapper<T extends Constructor<{}>>(base: T):
    T & Constructor<MdcWrapperBase> {
  return class extends base implements MdcWrapperBase {
    private _nextId = 0;

    private _listeners =
        new Map<number, [Element, string, EventListener, boolean | AddEventListenerOptions]>();

    constructor(...args: any[]) { super(...args); }

    listen(el: Element | ElementRef<Element>, event: string, listener: EventListener,
           options: boolean | AddEventListenerOptions = {}): number {
      el = el instanceof ElementRef ? el.nativeElement : el;
      options = typeof options == 'boolean' ? options : normalizePassiveListenerOptions(options);
      el.addEventListener(event, listener, options);
      this._listeners.set(this._nextId, [el, event, listener, options]);
      return this._nextId++;
    }

    unlisten(id: number) {
      const entry = this._listeners.get(id);
      if (entry) {
        const [el, event, listener, options] = entry;
        el.removeEventListener(event, listener, options);
        this._listeners.delete(id);
      }
    }

    ngOnDestroy() {
      for (let id of this._listeners.keys()) {
        this.unlisten(id);
      }
      // Note(mmalerba): We can't use `super` here because typescript complains that `ngOnDestroy`
      // is not defined on the super class.
      if (base.prototype.ngOnDestroy) {
        base.prototype.ngOnDestroy.call(this);
      }
    }
  };
}
