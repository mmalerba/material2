import {ProtractorHarnessEnvironment} from '@angular/cdk/testing/protractor';
import {MyComponentHarness} from './my-component-harness';
import {browser} from 'protractor';

fit('should wait for task outside zone', async () => {
  await browser.waitForAngularEnabled(true);
  await browser.get('./button');
  const loader = ProtractorHarnessEnvironment.loader();

  const harness = await loader.getHarness(MyComponentHarness);
  await harness.click();
  expect(await harness.isDone()).toBe(true);
});
