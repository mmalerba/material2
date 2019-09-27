import {Component, ElementRef, NgZone} from '@angular/core';
import {async, fakeAsync, flush, TestBed} from '@angular/core/testing';
import {detectTestZoneType, proxyZoneStable} from './test-zone-helpers';

describe('detectTestZoneType', () => {
  it('should detect normal test', () => {
    expect(detectTestZoneType()).toBe('none');
  });

  it('should detect normal test with async function', async () => {
    expect(detectTestZoneType()).toBe('none');
  });

  it('should detect normal test with done callback', done => {
    expect(detectTestZoneType()).toBe('none');
    done();
  });

  it('should detect async test', async(() => {
    expect(detectTestZoneType()).toBe('async');
  }));

  it('should detect fakeAsync test', fakeAsync(() => {
    expect(detectTestZoneType()).toBe('fakeAsync');
  }));
});

describe('proxyZoneStable', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InsideNgZoneTest, OutsideNgZoneTest]
    }).compileComponents();
  }));

  it('should return immediately resolved promise when no tasks created', async () => {
    let isComplete = false;
    await Promise.all([
      // Mark `isComplete` when we get the stable signal
      proxyZoneStable().then(() => isComplete = true),
      // Create an immediately resolved Promise to check the `isComplete` state.
      // The only way it will be true is if the stable promise was also immediately resolved.
      Promise.resolve().then(() => expect(isComplete).toBe(true))
    ]);
  });

  it('should return immediately resolved promise after all tasks finished', async () => {
    let isComplete = false;
    const fixture = TestBed.createComponent(InsideNgZoneTest);
    fixture.detectChanges();
    await proxyZoneStable();
    await Promise.all([
      // Mark `isComplete` when we get the stable signal
      proxyZoneStable().then(() => isComplete = true),
      // Create an immediately resolved Promise to check the `isComplete` state.
      // The only way it will be true is if the stable promise was also immediately resolved.
      Promise.resolve().then(() => expect(isComplete).toBe(true))
    ]);
  });

  it('should wait for async task inside NgZone in normal test', async () => {
    const fixture = TestBed.createComponent(InsideNgZoneTest);
    fixture.detectChanges();
    const el = fixture.debugElement.nativeElement;
    expect(el.classList.contains('timeout-done')).toBe(false);
    await proxyZoneStable();
    expect(el.classList.contains('timeout-done')).toBe(true);
  });

  it('should wait for async task outside NgZone in normal test', async () => {
    const fixture = TestBed.createComponent(OutsideNgZoneTest);
    fixture.detectChanges();
    const el = fixture.debugElement.nativeElement;
    expect(el.classList.contains('timeout-done')).toBe(false);
    await proxyZoneStable();
    expect(el.classList.contains('timeout-done')).toBe(true);
  });

  it('should wait for async task inside NgZone in async test', async(async () => {
    const fixture = TestBed.createComponent(InsideNgZoneTest);
    fixture.detectChanges();
    const el = fixture.debugElement.nativeElement;
    expect(el.classList.contains('timeout-done')).toBe(false);
    await proxyZoneStable();
    expect(el.classList.contains('timeout-done')).toBe(true);
  }));

  it('should wait for async task outside NgZone in async test', async(async () => {
    const fixture = TestBed.createComponent(OutsideNgZoneTest);
    fixture.detectChanges();
    const el = fixture.debugElement.nativeElement;
    expect(el.classList.contains('timeout-done')).toBe(false);
    await proxyZoneStable();
    expect(el.classList.contains('timeout-done')).toBe(true);
  }));
});

fdescribe('repro', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OutsideNgZoneTest]
    }).compileComponents();
  });

  it('done should not wait for task outside of zone', done => {
    const fixture = TestBed.createComponent(OutsideNgZoneTest);
    const el = fixture.debugElement.nativeElement;
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(el.classList.contains('timeout-done')).toBe(false);
      done();
    });
  });

  it('fakeAsync should wait for task outside of zone', fakeAsync(() => {
    const fixture = TestBed.createComponent(OutsideNgZoneTest);
    const el = fixture.debugElement.nativeElement;
    fixture.detectChanges();
    flush();
    expect(el.classList.contains('timeout-done')).toBe(true);
  }));

  it('async should wait for task outside of zone', async(() => {
    const fixture = TestBed.createComponent(OutsideNgZoneTest);
    const el = fixture.debugElement.nativeElement;
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(el.classList.contains('timeout-done')).toBe(true);
    });
  }));
});

@Component({template: ''})
export class InsideNgZoneTest {
  constructor(el: ElementRef) {
    setTimeout(() => el.nativeElement.classList.add('timeout-done'));
  }
}

@Component({template: ''})
export class OutsideNgZoneTest {
  constructor(el: ElementRef, ngZone: NgZone) {
    ngZone.runOutsideAngular(() =>
        Promise.resolve().then(() => el.nativeElement.classList.add('timeout-done')));
  }
}
