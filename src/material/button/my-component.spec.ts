import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MyComponentModule} from '@angular/material/button/my-component';
import {MyComponentHarness} from '@angular/material/button/my-component-harness';

fit('should wait for task outside zone', async () => {
  TestBed.configureTestingModule({
    imports: [MyComponentModule],
    declarations: [MyComponentTest],
  });

  await TestBed.compileComponents();

  const fixture = TestBed.createComponent(MyComponentTest);
  const loader = TestbedHarnessEnvironment.loader(fixture);

  const harness = await loader.getHarness(MyComponentHarness);
  await harness.click();
  expect(await harness.isDone()).toBe(true);
});

@Component({template: '<my-component></my-component>'})
export class MyComponentTest {}
