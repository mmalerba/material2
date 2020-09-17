/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BehaviorSubject, Subscription} from 'rxjs';

/** Represents the status of auto change detection. */
export interface AutoChangeDetectionStatus {
  /** Whether auto change detection is disabled. */
  isDisabled: boolean;
  /**
   * An optional callback, if present it indicates that change detection should be run immediately,
   * while handling the status change. The callback should then be called as soon as change
   * detection is done.
   */
  onDetectChangesNow?: () => void;
}

/** Subject used to dispatch and listen for changes to the auto change detection status . */
const autoChangeDetectionSubject = new BehaviorSubject<AutoChangeDetectionStatus>({
  isDisabled: false
});

/** The current subscription to `autoChangeDetectionSubject`. */
let autoChangeDetectionSubscription: Subscription | null;

/**
 * The default handler for auto change detection status changes. This handler will be used if the
 * specific environment does not install its own.
 * @param status The new auto change detection status.
 */
function defaultAutoChangeDetectionHandler(status: AutoChangeDetectionStatus) {
  status.onDetectChangesNow?.();
}

/**
 * Allows a test `HarnessEnvironment` to install its own handler for auto change detection status
 * changes.
 * @param handler The handler for the auto change detection status.
 */
export function handleAutoChangeDetectionStatus(
    handler: (status: AutoChangeDetectionStatus) => void) {
  stopHandlingAutoChangeDetectionStatus();
  autoChangeDetectionSubscription = autoChangeDetectionSubject.subscribe(handler);
}

/** Allows a `HarnessEnvironment` to stop handling auto change detection status changes. */
export function stopHandlingAutoChangeDetectionStatus() {
  autoChangeDetectionSubscription?.unsubscribe();
  autoChangeDetectionSubscription = null;
}

/**
 * Batches together triggering of change detection over the duration of the given function.
 * @param fn The function to call with batched change detection.
 * @param triggerBeforeAndAfter Optionally trigger change detection once before and after the batch
 *   operation. If false, change detection will not be triggered.
 * @return The result of the given function.
 */
async function batchChangeDetection<T>(fn: () => Promise<T>, triggerBeforeAndAfter: boolean) {
  // If change detection batching is already in progress, just run the function.
  if (autoChangeDetectionSubject.getValue().isDisabled) {
    return await fn();
  }

  // If nothing is handling change detection batching, install the default handler.
  if (!autoChangeDetectionSubscription) {
    autoChangeDetectionSubject.subscribe(defaultAutoChangeDetectionHandler);
  }

  if (triggerBeforeAndAfter) {
    await new Promise(resolve => autoChangeDetectionSubject.next({
      isDisabled: true,
      onDetectChangesNow: resolve,
    }));
    const result = await fn();
    await new Promise(resolve => autoChangeDetectionSubject.next({
      isDisabled: false,
      onDetectChangesNow: resolve,
    }));
    return result;
  } else {
    autoChangeDetectionSubject.next({isDisabled: true});
    const result = await fn();
    autoChangeDetectionSubject.next({isDisabled: false});
    return result;
  }
}

/**
 * Disables the harness system's auto change detection for the duration of the given function.
 * @param fn The function to disable auto change detection for.
 * @return The result of the given function.
 */
export async function manualChangeDetection<T>(fn: () => Promise<T>) {
  return batchChangeDetection(fn, false);
}

/**
 * Resolves the given list of async values in parallel (i.e. via Promise.all) while batching change
 * detection over the entire operation such that change detection occurs exactly once before
 * resolving the values and once after.
 * @param values A getter for the async values to resolve in parallel with batched change detection.
 * @return The resolved values.
 */
export async function parallel<T>(values: () => Iterable<T | PromiseLike<T>>) {
  return batchChangeDetection(() => Promise.all(values()), true);
}
