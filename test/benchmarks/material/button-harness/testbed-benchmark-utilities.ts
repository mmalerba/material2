/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

 /**
  * Records the performance of the given function.
  * @param id A unique identifier.
  * @param callback A function whose performance will be recorded.
  * @param runs The number of times to run the callback.
  */
export async function benchmark(id: string, callback: () => Promise<unknown>, runs = 5) {
  const t0 = performance.now();
  for (let i = 0; i < runs; i++) {
    await callback();
  }
  const t1 = performance.now();
  console.warn(`${id}: ${((t1 - t0) / runs).toFixed(2)}ms (avg over ${runs} runs)`);
}
