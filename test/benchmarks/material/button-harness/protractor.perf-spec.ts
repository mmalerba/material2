/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessLoader} from '@angular/cdk/testing';
import {MatButtonHarness} from '@angular/material/button/testing/button-harness';
import {runBenchmark} from '@angular/dev-infra-private/benchmark/driver-utilities';
import {ProtractorHarnessEnvironment} from '@angular/cdk/testing/protractor';
import {$$, element, by} from 'protractor';

describe('performance baseline for the protractor harness', () => {
  it('should retrieve all of the buttons', async () => {
    await runBenchmark({
      id: 'get-all-buttons',
      url: '',
      ignoreBrowserSynchronization: true,
      params: [],
      work: async () => $$('.mat-button'),
    });
  });

  it('should click the first button', async () => {
    await runBenchmark({
      id: 'click-first-button',
      url: '',
      ignoreBrowserSynchronization: true,
      params: [],
      setup: () => { loader = ProtractorHarnessEnvironment.loader(); },
      work: async () => await element(by.buttonText('0')).click(),
    });
  });

  it('should click the middle button', async () => {
    await runBenchmark({
      id: 'click-middle-button',
      url: '',
      ignoreBrowserSynchronization: true,
      params: [],
      setup: () => { loader = ProtractorHarnessEnvironment.loader(); },
      work: async () => await element(by.buttonText('12')).click(),
    });
  });

  it('should click the last button', async () => {
    await runBenchmark({
      id: 'click-last-button',
      url: '',
      ignoreBrowserSynchronization: true,
      params: [],
      setup: () => { loader = ProtractorHarnessEnvironment.loader(); },
      work: async () => await element(by.buttonText('24')).click(),
    });
  });

  it('should click all of the buttons', async () => {
    await runBenchmark({
      id: 'click-every-button',
      url: '',
      ignoreBrowserSynchronization: true,
      params: [],
      setup: () => { loader = ProtractorHarnessEnvironment.loader(); },
      work: async () => {
        const buttons = $$('.mat-button');
        await buttons.each(async (button) => await button!.click());
      }
    });
  });
});

let loader: HarnessLoader;

describe('performance overhead of the protractor harness', () => {
  it('should load the protractor harness environment', async () => {
    await runBenchmark({
      id: 'initial-harness-load',
      url: '',
      ignoreBrowserSynchronization: true,
      params: [],
      work: () => { loader = ProtractorHarnessEnvironment.loader(); },
    });
  });

  it('should retrieve all of the buttons', async () => {
    await runBenchmark({
      id: 'get-all-buttons',
      url: '',
      ignoreBrowserSynchronization: true,
      params: [],
      setup: () => { loader = ProtractorHarnessEnvironment.loader(); },
      work: async () => await loader.getAllHarnesses(MatButtonHarness),
    });
  });

  it('should click the first button', async () => {
    await runBenchmark({
      id: 'click-first-button',
      url: '',
      ignoreBrowserSynchronization: true,
      params: [],
      setup: () => { loader = ProtractorHarnessEnvironment.loader(); },
      work: async () => await (await loader.getHarness(MatButtonHarness.with({text: '0'}))).click(),
    });
  });

  it('should click the middle button', async () => {
    await runBenchmark({
      id: 'click-middle-button',
      url: '',
      ignoreBrowserSynchronization: true,
      params: [],
      setup: () => { loader = ProtractorHarnessEnvironment.loader(); },
      work: async () => await (await loader.getHarness(MatButtonHarness.with({text: '12'}))).click(),
    });
  });

  it('should click the last button', async () => {
    await runBenchmark({
      id: 'click-last-button',
      url: '',
      ignoreBrowserSynchronization: true,
      params: [],
      setup: () => { loader = ProtractorHarnessEnvironment.loader(); },
      work: async () => await (await loader.getHarness(MatButtonHarness.with({text: '24'}))).click(),
    });
  });

  it('should click all of the buttons', async () => {
    await runBenchmark({
      id: 'click-every-button',
      url: '',
      ignoreBrowserSynchronization: true,
      params: [],
      setup: () => { loader = ProtractorHarnessEnvironment.loader(); },
      work: async () => {
        const buttons = await loader.getAllHarnesses(MatButtonHarness);
        buttons.forEach(async (button) => await button.click());
      }
    });
  });
});
