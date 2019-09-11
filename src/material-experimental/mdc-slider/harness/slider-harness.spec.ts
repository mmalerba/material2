import {HarnessLoader} from '@angular/cdk-experimental/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk-experimental/testing/testbed';
import {Component, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, fakeAsync, flush, TestBed, tick} from '@angular/core/testing';
import {MatSliderModule} from '@angular/material/slider';
import {MatSliderModule as MatMdcSliderModule} from '../module';
import {MatSliderHarness as MatMdcSliderHarness} from './mdc-slider-harness';
import {MatSliderHarness} from './slider-harness';

let fixture: ComponentFixture<SliderHarnessTest>;
let loader: HarnessLoader;
let sliderHarness: typeof MatSliderHarness;

declare const Zone: any;

describe('MatSliderHarness', () => {
  describe('non-MDC-based', () => {
    beforeEach(async () => {
      await TestBed
          .configureTestingModule({
            imports: [MatSliderModule],
            declarations: [SliderHarnessTest],
          })
          .compileComponents();

      fixture = TestBed.createComponent(SliderHarnessTest);
      fixture.detectChanges();
      loader = TestbedHarnessEnvironment.loader(fixture);
      sliderHarness = MatSliderHarness;
    });

    // Standard slider supports vertical and inverted sliders.
    createTests(true, true);
  });

  describe(
      'MDC-based',
      () => {
        beforeEach(async () => {
          await TestBed
            .configureTestingModule({
              imports: [MatMdcSliderModule],
              declarations: [SliderHarnessTest],
              schemas: [CUSTOM_ELEMENTS_SCHEMA]
            })
            .compileComponents();

          fixture = TestBed.createComponent(SliderHarnessTest);
          fixture.detectChanges();
          loader = TestbedHarnessEnvironment.loader(fixture);
          // Public APIs are the same as "MatSliderHarness", but cast is necessary because
          // of different private fields.
          sliderHarness = MatMdcSliderHarness as any;
        });

        // MDC slider does not support vertical or inverted sliders.
        createTests(false, false);
      });
});

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

describe('zone checks', () => {
  it('default', async () => expect(getTestMode()).toBe('default'));
  it('async', async(async () => expect(getTestMode()).toBe('async')));
  it('fake async', fakeAsync(async () => expect(getTestMode()).toBe('fakeAsync')));
});

/** Shared tests to run on both the original and MDC-based sliders. */
function createTests(supportsVertical: boolean, supportsInvert: boolean) {
  it('should load all slider harnesses', async () => {
    const sliders = await loader.getAllHarnesses(sliderHarness);
    expect(sliders.length).toBe(3);
  });

  it('should load slider harness by id', async () => {
    const sliders = await loader.getAllHarnesses(sliderHarness.with({selector: '#my-slider'}));
    expect(sliders.length).toBe(1);
  });

  it('should get id of slider', async () => {
    const sliders = await loader.getAllHarnesses(sliderHarness);
    expect(await sliders[0].getId()).toBe(null);
    expect(await sliders[1].getId()).toBe('my-slider');
    expect(await sliders[2].getId()).toBe(null);
  });

  it('should get value of slider', async () => {
    const sliders = await loader.getAllHarnesses(sliderHarness);
    expect(await sliders[0].getValue()).toBe(50);
    expect(await sliders[1].getValue()).toBe(0);
    expect(await sliders[2].getValue()).toBe(225);
  });

  it('should get percentage of slider', async () => {
    const sliders = await loader.getAllHarnesses(sliderHarness);
    expect(await sliders[0].getPercentage()).toBe(0.5);
    expect(await sliders[1].getPercentage()).toBe(0);
    expect(await sliders[2].getPercentage()).toBe(0.5);
  });

  it('should get max value of slider', async () => {
    const sliders = await loader.getAllHarnesses(sliderHarness);
    expect(await sliders[0].getMaxValue()).toBe(100);
    expect(await sliders[1].getMaxValue()).toBe(100);
    expect(await sliders[2].getMaxValue()).toBe(250);
  });

  it('should get min value of slider', async () => {
    const sliders = await loader.getAllHarnesses(sliderHarness);
    expect(await sliders[0].getMinValue()).toBe(0);
    expect(await sliders[1].getMinValue()).toBe(0);
    expect(await sliders[2].getMinValue()).toBe(200);
  });

  it('should get display value of slider', async () => {
    const sliders = await loader.getAllHarnesses(sliderHarness);
    expect(await sliders[0].getDisplayValue()).toBe(null);
    expect(await sliders[1].getDisplayValue()).toBe('Null');
    expect(await sliders[2].getDisplayValue()).toBe('#225');
  });

  it('should get orientation of slider', async () => {
    const sliders = await loader.getAllHarnesses(sliderHarness);
    expect(await sliders[0].getOrientation()).toBe('horizontal');
    expect(await sliders[1].getOrientation()).toBe('horizontal');
    expect(await sliders[2].getOrientation()).toBe(supportsVertical ? 'vertical' : 'horizontal');
  });

  it('should be able to focus slider', async () => {
    // the first slider is disabled.
    const slider = (await loader.getAllHarnesses(sliderHarness))[1];
    expect(getActiveElementTagName()).not.toBe('mat-slider');
    await slider.focus();
    expect(getActiveElementTagName()).toBe('mat-slider');
  });

  it('should be able to blur slider', async () => {
    // the first slider is disabled.
    const slider = (await loader.getAllHarnesses(sliderHarness))[1];
    expect(getActiveElementTagName()).not.toBe('mat-slider');
    await slider.focus();
    expect(getActiveElementTagName()).toBe('mat-slider');
    await slider.blur();
    expect(getActiveElementTagName()).not.toBe('mat-slider');
  });

  it('should be able to set value of slider', async () => {
    const sliders = await loader.getAllHarnesses(sliderHarness);
    expect(await sliders[1].getValue()).toBe(0);
    expect(await sliders[2].getValue()).toBe(225);

    await sliders[1].setValue(33);
    await sliders[2].setValue(300);

    expect(await sliders[1].getValue()).toBe(33);
    // value should be clamped to the maximum.
    expect(await sliders[2].getValue()).toBe(250);
  });

  fit('should be able to set value of slider in rtl', async () => {
    const sliders = await loader.getAllHarnesses(sliderHarness);
    expect(await sliders[1].getValue()).toBe(0);
    expect(await sliders[2].getValue()).toBe(225);

    // should not retrieve incorrect values in case slider is inverted
    // due to RTL page layout.
    fixture.componentInstance.dir = 'rtl';
    fixture.detectChanges();

    await sliders[1].setValue(80);
    expect(await sliders[1].getValue()).toBe(80);
  });

  it('should get disabled state of slider', async () => {
    const sliders = await loader.getAllHarnesses(sliderHarness);
    expect(await sliders[0].isDisabled()).toBe(true);
    expect(await sliders[1].isDisabled()).toBe(false);
    expect(await sliders[2].isDisabled()).toBe(false);
  });

  if (supportsInvert) {
    it('should be able to set value of inverted slider', async () => {
      const sliders = await loader.getAllHarnesses(sliderHarness);
      expect(await sliders[1].getValue()).toBe(0);
      expect(await sliders[2].getValue()).toBe(225);

      fixture.componentInstance.invertSliders = true;
      fixture.detectChanges();

      await sliders[1].setValue(75);
      await sliders[2].setValue(210);

      expect(await sliders[1].getValue()).toBe(75);
      expect(await sliders[2].getValue()).toBe(210);
    });

    it('should be able to set value of inverted slider in rtl', async () => {
      const sliders = await loader.getAllHarnesses(sliderHarness);
      expect(await sliders[1].getValue()).toBe(0);
      expect(await sliders[2].getValue()).toBe(225);

      fixture.componentInstance.invertSliders = true;
      fixture.componentInstance.dir = 'rtl';
      fixture.detectChanges();

      await sliders[1].setValue(75);
      await sliders[2].setValue(210);

      expect(await sliders[1].getValue()).toBe(75);
      expect(await sliders[2].getValue()).toBe(210);
    });
  }
}

function getActiveElementTagName() {
  return document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
}

@Component({
  template: `
    <mat-slider value="50" disabled></mat-slider>
    <div [dir]="dir">
      <mat-slider [id]="sliderId" [displayWith]="displayFn"
                  [invert]="invertSliders" thumbLabel></mat-slider>
    </div>
    <mat-slider min="200" max="250" value="225" [displayWith]="displayFn" vertical
                [invert]="invertSliders" thumbLabel>
    </mat-slider>
    `,
})
class SliderHarnessTest {
  sliderId = 'my-slider';
  invertSliders = false;
  dir = 'ltr';

  displayFn(value: number|null) {
    if (!value) {
      return 'Null';
    }
    return `#${value}`;
  }
}
