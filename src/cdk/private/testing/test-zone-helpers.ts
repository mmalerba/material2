/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Observable} from 'rxjs';
import {take} from 'rxjs/operators';

// Create local aliases for zone.js classes.
// tslint:disable:variable-name
const Zone = (window as any).Zone;
const ProxyZoneSpec = Zone && Zone['ProxyZoneSpec'];
const FakeAsyncTestZoneSpec = Zone && Zone['FakeAsyncTestZoneSpec'];
const AsyncTestZoneSpec = Zone && Zone['AsyncTestZoneSpec'];
// tslint:enable:variable-name

const patchedZones = new WeakMap<{}, Observable<void>>();

export type TestZoneType = 'fakeAsync' | 'async' | 'none';

export function detectTestZoneType(): TestZoneType {
  const proxyZone = getProxyZone();
  const delegate = proxyZone.getDelegate();
  return delegate instanceof FakeAsyncTestZoneSpec ? 'fakeAsync' :
      delegate instanceof AsyncTestZoneSpec ? 'async' : 'none';
}

export async function proxyZoneStable() {
  const lastState = getProxyZone().lastTaskState;
  if (lastState && (lastState.macroTask || lastState.microTask)) {
    await nextStable();
  }
}

async function nextStable() {
  const proxyZone = getProxyZone();
  if (!patchedZones.has(proxyZone)) {
    patchedZones.set(proxyZone, new Observable<void>(subscriber => {
      const originalOnHasTask = proxyZone.onHasTask;
      proxyZone.onHasTask = (...args: any[]) => {
        const [delegate, current, target, hasTaskState] = args;
        if (target === current) {
          if (!hasTaskState.macroTask && !hasTaskState.microTask) {
            subscriber.next();
          }
        }
        return originalOnHasTask.apply(proxyZone, args);
      };
    }));
  }
  return new Promise(resolve => {
    patchedZones.get(proxyZone)!.pipe(take(1)).subscribe(resolve);
  });
}

function getProxyZone() {
  if (!ProxyZoneSpec) {
    throw Error('Expected ProxyZoneSpec to be present');
  }
  return ProxyZoneSpec.assertPresent();
}
