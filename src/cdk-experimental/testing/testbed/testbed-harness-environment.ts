/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentFixture, flush} from '@angular/core/testing';
import {ComponentHarness, ComponentHarnessConstructor, HarnessLoader} from '../component-harness';
import {HarnessEnvironment} from '../harness-environment';
import {TestElement} from '../test-element';
import {UnitTestElement} from './unit-test-element';

declare const Zone: any;

function getTestMode() {
  const _Zone: any = typeof Zone !== 'undefined' ? Zone : null;
  const ProxyZoneSpec = _Zone && _Zone['ProxyZoneSpec'];
  const FakeAsyncTestZoneSpec = _Zone && _Zone['FakeAsyncTestZoneSpec'];
  const AsyncTestZoneSpec = _Zone && _Zone['AsyncTestZoneSpec'];
  const proxyZoneSpec = ProxyZoneSpec.assertPresent();
  const delegate = proxyZoneSpec.getDelegate();
  return delegate instanceof FakeAsyncTestZoneSpec ? 'fakeAsync' :
      delegate instanceof AsyncTestZoneSpec ? 'async' : 'default';
}

/** A `HarnessEnvironment` implementation for Angular's Testbed. */
export class TestbedHarnessEnvironment extends HarnessEnvironment<Element> {
  constructor(rawRootElement: Element, private _fixture: ComponentFixture<unknown>) {
    super(rawRootElement);
  }

  /** Creates a `HarnessLoader` rooted at the given fixture's root element. */
  static loader(fixture: ComponentFixture<unknown>): HarnessLoader {
    return new TestbedHarnessEnvironment(fixture.nativeElement, fixture);
  }

  /**
   * Creates an instance of the given harness type, using the fixture's root element as the
   * harness's host element. This method should be used when creating a harness for the root element
   * of a fixture, as components do not have the correct selector when they are created as the root
   * of the fixture.
   */
  static async harnessForFixture<T extends ComponentHarness>(
      fixture: ComponentFixture<unknown>, harnessType: ComponentHarnessConstructor<T>): Promise<T> {
    const environment = new TestbedHarnessEnvironment(fixture.nativeElement, fixture);
    await environment._stabilize();
    return environment.createComponentHarness(harnessType, fixture.nativeElement);
  }

  protected getDocumentRoot(): Element {
    return document.body;
  }

  protected createTestElement(element: Element): TestElement {
    return new UnitTestElement(element, this._stabilize.bind(this));
  }

  protected createEnvironment(element: Element): HarnessEnvironment<Element> {
    return new TestbedHarnessEnvironment(element, this._fixture);
  }

  protected async getAllRawElements(selector: string): Promise<Element[]> {
    await this._stabilize();
    return Array.from(this.rawRootElement.querySelectorAll(selector));
  }

  private async _stabilize(): Promise<void> {
    this._fixture.detectChanges();
    if (getTestMode() === 'default') {
      await this._fixture.whenStable();
    } else if (getTestMode() === 'fakeAsync') {
      flush();
    } else {
      let onStableFn: () => void;
      let zoneStable = new Promise(res => onStableFn = res);

      if ((window as any).Zone) {
        const targetZone = (window as any).Zone.current;
        const org = (window as any).Zone.current._zoneDelegate.hasTask;
        (window as any).Zone.current._zoneDelegate.hasTask = function(currentZone: any, data: any) {
          if (currentZone === targetZone) {
            if (!data.macroTask && !data.microTask) {
              onStableFn();
              // Reset interception.
              (window as any).Zone.current._zoneDelegate.hasTask = org;
            }
          }
          org.apply(this, arguments);
        };
      }

      await zoneStable;
    }
  }
}
