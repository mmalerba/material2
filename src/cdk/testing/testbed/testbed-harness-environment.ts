/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ComponentHarness,
  ComponentHarnessConstructor,
  handleChangeDetectionBatching,
  HarnessEnvironment,
  HarnessLoader,
  stopHandlingChangeDetectionBatching,
  TestElement
} from '@angular/cdk/testing';
import {ComponentFixture, flush} from '@angular/core/testing';
import {Observable} from 'rxjs';
import {takeWhile} from 'rxjs/operators';
import {TaskState, TaskStateZoneInterceptor} from './task-state-zone-interceptor';
import {UnitTestElement} from './unit-test-element';

/** Options to configure the environment. */
export interface TestbedHarnessEnvironmentOptions {
  /** The query function used to find DOM elements. */
  queryFn: (selector: string, root: Element) => Iterable<Element> | ArrayLike<Element>;
}

/** The default environment options. */
const defaultEnvironmentOptions: TestbedHarnessEnvironmentOptions = {
  queryFn: (selector: string, root: Element) => root.querySelectorAll(selector)
};

/** Whether auto change detection is currently disabled. */
let disableAutoChangeDetection = false;

/**
 * The set of non-destroyed fixtures currently being used by `TestbedHarnessEnvironment` instances.
 */
const activeFixtures = new Set<ComponentFixture<unknown>>();

/**
 * Installs a handler for change detection batching status changes for a specific fixture.
 * @param fixture The fixture to handle change detection batching for.
 */
function installChangeDetectionBatchingHandler(fixture: ComponentFixture<unknown>) {
  if (!activeFixtures.size) {
    handleChangeDetectionBatching(({isBatching, onDetectChangesNow}) => {
      disableAutoChangeDetection = isBatching;
      if (onDetectChangesNow) {
        Promise.all([...activeFixtures].map(detectChanges)).then(onDetectChangesNow);
      }
    });
  }
  activeFixtures.add(fixture);
}

/**
 * Uninstalls a handler for change detection batching status changes for a specific fixture.
 * @param fixture The fixture to stop handling change detection batching for.
 */
function uninstallChangeDetectionBatchingHandler(fixture: ComponentFixture<unknown>) {
  activeFixtures.delete(fixture);
  if (!activeFixtures.size) {
    stopHandlingChangeDetectionBatching();
  }
}

/**
 * Triggers change detection for a specific fixture.
 * @param fixture The fixture to trigger change detection for.
 */
async function detectChanges(fixture: ComponentFixture<unknown>) {
  fixture.detectChanges();
  await fixture.whenStable();
}

/** A `HarnessEnvironment` implementation for Angular's Testbed. */
export class TestbedHarnessEnvironment extends HarnessEnvironment<Element> {
  /** Whether the environment has been destroyed. */
  private _destroyed = false;

  /** Observable that emits whenever the test task state changes. */
  private _taskState: Observable<TaskState>;

  /** The options for this environment. */
  private _options: TestbedHarnessEnvironmentOptions;

  protected constructor(rawRootElement: Element, private _fixture: ComponentFixture<unknown>,
      options?: TestbedHarnessEnvironmentOptions) {
    super(rawRootElement);
    this._options = {...defaultEnvironmentOptions, ...options};
    this._taskState = TaskStateZoneInterceptor.setup();
    installChangeDetectionBatchingHandler(_fixture);
    _fixture.componentRef.onDestroy(() => {
      uninstallChangeDetectionBatchingHandler(_fixture);
      this._destroyed = true;
    });
  }

  /** Creates a `HarnessLoader` rooted at the given fixture's root element. */
  static loader(fixture: ComponentFixture<unknown>, options?: TestbedHarnessEnvironmentOptions):
      HarnessLoader {
    return new TestbedHarnessEnvironment(fixture.nativeElement, fixture, options);
  }

  /**
   * Creates a `HarnessLoader` at the document root. This can be used if harnesses are
   * located outside of a fixture (e.g. overlays appended to the document body).
   */
  static documentRootLoader(fixture: ComponentFixture<unknown>,
      options?: TestbedHarnessEnvironmentOptions): HarnessLoader {
    return new TestbedHarnessEnvironment(document.body, fixture, options);
  }

  /** Gets the native DOM element corresponding to the given TestElement. */
  static getNativeElement(el: TestElement): Element {
    if (el instanceof UnitTestElement) {
      return el.element;
    }
    throw Error('This TestElement was not created by the TestbedHarnessEnvironment');
  }

  /**
   * Creates an instance of the given harness type, using the fixture's root element as the
   * harness's host element. This method should be used when creating a harness for the root element
   * of a fixture, as components do not have the correct selector when they are created as the root
   * of the fixture.
   */
  static async harnessForFixture<T extends ComponentHarness>(
      fixture: ComponentFixture<unknown>, harnessType: ComponentHarnessConstructor<T>,
      options?: TestbedHarnessEnvironmentOptions): Promise<T> {
    const environment = new TestbedHarnessEnvironment(fixture.nativeElement, fixture, options);
    await environment.forceStabilize();
    return environment.createComponentHarness(harnessType, fixture.nativeElement);
  }

  async forceStabilize(): Promise<void> {
    if (!disableAutoChangeDetection) {
      if (this._destroyed) {
        throw Error('Harness is attempting to use a fixture that has already been destroyed.');
      }

      await detectChanges(this._fixture);
    }
  }

  async waitForTasksOutsideAngular(): Promise<void> {
    // If we run in the fake async zone, we run "flush" to run any scheduled tasks. This
    // ensures that the harnesses behave inside of the FakeAsyncTestZone similar to the
    // "AsyncTestZone" and the root zone (i.e. neither fakeAsync or async). Note that we
    // cannot just rely on the task state observable to become stable because the state will
    // never change. This is because the task queue will be only drained if the fake async
    // zone is being flushed.
    if (Zone!.current.get('FakeAsyncTestZoneSpec')) {
      flush();
    }

    // Wait until the task queue has been drained and the zone is stable. Note that
    // we cannot rely on "fixture.whenStable" since it does not catch tasks scheduled
    // outside of the Angular zone. For test harnesses, we want to ensure that the
    // app is fully stabilized and therefore need to use our own zone interceptor.
    await this._taskState.pipe(takeWhile(state => !state.stable)).toPromise();
  }

  protected getDocumentRoot(): Element {
    return document.body;
  }

  protected createTestElement(element: Element): TestElement {
    return new UnitTestElement(element, () => this.forceStabilize());
  }

  protected createEnvironment(element: Element): HarnessEnvironment<Element> {
    return new TestbedHarnessEnvironment(element, this._fixture, this._options);
  }

  protected async getAllRawElements(selector: string): Promise<Element[]> {
    await this.forceStabilize();
    return Array.from(this._options.queryFn(selector, this.rawRootElement));
  }
}
