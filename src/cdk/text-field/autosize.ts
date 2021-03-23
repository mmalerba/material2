/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  BooleanInput,
  coerceBooleanProperty,
  coerceNumberProperty,
  NumberInput
} from '@angular/cdk/coercion';
import {
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
  DoCheck,
  OnDestroy,
  NgZone,
  HostListener,
  Optional,
  Inject,
} from '@angular/core';
import {Platform} from '@angular/cdk/platform';
import {auditTime, takeUntil} from 'rxjs/operators';
import {fromEvent, Subject} from 'rxjs';
import {DOCUMENT} from '@angular/common';

/** Directive to automatically resize a textarea to fit its content. */
@Directive({
  selector: 'textarea[cdkTextareaAutosize]',
  exportAs: 'cdkTextareaAutosize',
  host: {
    'class': 'cdk-textarea-autosize',
    // Textarea elements that have the directive applied should have a single row by default.
    // Browsers normally show two rows by default and therefore this limits the minRows binding.
    'rows': '1',
  },
})
export class CdkTextareaAutosize implements AfterViewInit, DoCheck, OnDestroy {
  /** Keep track of the previous textarea value to avoid resizing when the value hasn't changed. */
  private _previousValue?: string;
  private _initialHeight: string | undefined;
  private readonly _destroyed = new Subject<void>();

  private _minRows: number;
  private _maxRows: number;
  private _enabled: boolean = true;

  /**
   * Value of minRows as of last resize. If the minRows has decreased, the
   * height of the textarea needs to be recomputed to reflect the new minimum. The maxHeight
   * does not have the same problem because it does not affect the textarea's scrollHeight.
   */
  private _previousMinRows: number = -1;

  private _textareaElement: HTMLTextAreaElement;

  /** Minimum amount of rows in the textarea. */
  @Input('cdkAutosizeMinRows')
  get minRows(): number { return this._minRows; }
  set minRows(value: number) {
    this._minRows = coerceNumberProperty(value);
    this._setMinHeight();
  }

  /** Maximum amount of rows in the textarea. */
  @Input('cdkAutosizeMaxRows')
  get maxRows(): number { return this._maxRows; }
  set maxRows(value: number) {
    this._maxRows = coerceNumberProperty(value);
    this._setMaxHeight();
  }

  /** Whether autosizing is enabled or not */
  @Input('cdkTextareaAutosize')
  get enabled(): boolean { return this._enabled; }
  set enabled(value: boolean) {
    value = coerceBooleanProperty(value);

    // Only act if the actual value changed. This specifically helps to not run
    // resizeToFitContent too early (i.e. before ngAfterViewInit)
    if (this._enabled !== value) {
      (this._enabled = value) ? this.resizeToFitContent(true) : this.reset();
    }
  }

  @Input()
  get placeholder(): string { return this._textareaElement.placeholder; }
  set placeholder(value: string) {
    this._cachedPlaceholderHeight = undefined;
    this._textareaElement.placeholder = value;
    this._cacheTextareaPlaceholderHeight();
  }


  /** Cached height of a textarea with a single row. */
  private _cachedLineHeight: number;
  /** Cached height of a textarea with only the placeholder. */
  private _cachedPlaceholderHeight?: number;

  /** Used to reference correct document/window */
  protected _document?: Document;

  /** Class that should be applied to the textarea while it's being measured. */
  private _measuringClass: string;

  private _isViewInited = false;

  constructor(private _elementRef: ElementRef<HTMLElement>,
              private _platform: Platform,
              private _ngZone: NgZone,
              /** @breaking-change 11.0.0 make document required */
              @Optional() @Inject(DOCUMENT) document?: any) {
    this._document = document;

    this._textareaElement = this._elementRef.nativeElement as HTMLTextAreaElement;
    this._measuringClass = _platform.FIREFOX ?
      'cdk-textarea-autosize-measuring-firefox' :
      'cdk-textarea-autosize-measuring';
  }

  /** Sets the minimum height of the textarea as determined by minRows. */
  _setMinHeight(): void {
    const minHeight = this.minRows && this._cachedLineHeight ?
        `${this.minRows * this._cachedLineHeight}px` : null;

    if (minHeight)  {
      this._textareaElement.style.minHeight = minHeight;
    }
  }

  /** Sets the maximum height of the textarea as determined by maxRows. */
  _setMaxHeight(): void {
    const maxHeight = this.maxRows && this._cachedLineHeight ?
        `${this.maxRows * this._cachedLineHeight}px` : null;

    if (maxHeight) {
      this._textareaElement.style.maxHeight = maxHeight;
    }
  }

  ngAfterViewInit() {
    if (this._platform.isBrowser) {
      // Remember the height which we started with in case autosizing is disabled
      this._initialHeight = this._textareaElement.style.height;

      this.resizeToFitContent();

      this._ngZone.runOutsideAngular(() => {
        const window = this._getWindow();

        fromEvent(window, 'resize')
          .pipe(auditTime(16), takeUntil(this._destroyed))
          .subscribe(() => this.resizeToFitContent(true));
      });

      this._isViewInited = true;
      this.resizeToFitContent(true);
    }
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }

  /**
   * Cache the height of a single-row textarea if it has not already been cached.
   *
   * We need to know how large a single "row" of a textarea is in order to apply minRows and
   * maxRows. For the initial version, we will assume that the height of a single line in the
   * textarea does not ever change.
   */
  private _cacheTextareaLineHeight(): void {
    if (this._cachedLineHeight) {
      return;
    }

    // Use a clone element because we have to override some styles.
    let textareaClone = this._textareaElement.cloneNode(false) as HTMLTextAreaElement;
    textareaClone.rows = 1;

    // Use `position: absolute` so that this doesn't cause a browser layout and use
    // `visibility: hidden` so that nothing is rendered. Clear any other styles that
    // would affect the height.
    textareaClone.style.position = 'absolute';
    textareaClone.style.visibility = 'hidden';
    textareaClone.style.border = 'none';
    textareaClone.style.padding = '0';
    textareaClone.style.height = '';
    textareaClone.style.minHeight = '';
    textareaClone.style.maxHeight = '';

    // In Firefox it happens that textarea elements are always bigger than the specified amount
    // of rows. This is because Firefox tries to add extra space for the horizontal scrollbar.
    // As a workaround that removes the extra space for the scrollbar, we can just set overflow
    // to hidden. This ensures that there is no invalid calculation of the line height.
    // See Firefox bug report: https://bugzilla.mozilla.org/show_bug.cgi?id=33654
    textareaClone.style.overflow = 'hidden';

    this._textareaElement.parentNode!.appendChild(textareaClone);
    this._cachedLineHeight = textareaClone.clientHeight;
    this._textareaElement.parentNode!.removeChild(textareaClone);

    // Min and max heights have to be re-calculated if the cached line height changes
    this._setMinHeight();
    this._setMaxHeight();
  }

  private _measureScrollHeight(): number {
    // Reset the textarea height to auto in order to shrink back to its default size.
    // Also temporarily force overflow:hidden, so scroll bars do not interfere with calculations.
    this._textareaElement.classList.add(this._measuringClass);
    // The measuring class includes a 2px padding to workaround an issue with Chrome,
    // so we account for that extra space here by subtracting 4 (2px top + 2px bottom).
    const scrollHeight = this._textareaElement.scrollHeight - 4;
    this._textareaElement.classList.remove(this._measuringClass);

    return scrollHeight;
  }

  private _cacheTextareaPlaceholderHeight(): void {
    if (!this._isViewInited || this._cachedPlaceholderHeight != undefined) {
      return;
    }
    if (!this.placeholder) {
      this._cachedPlaceholderHeight = 0;
      return;
    }

    const value = this._textareaElement.value;

    this._textareaElement.value = this._textareaElement.placeholder;
    this._cachedPlaceholderHeight = this._measureScrollHeight();
    this._textareaElement.value = value;
  }

  ngDoCheck() {
    if (this._platform.isBrowser) {
      this.resizeToFitContent();
    }
  }

  /**
   * Resize the textarea to fit its content.
   * @param force Whether to force a height recalculation. By default the height will be
   *    recalculated only if the value changed since the last call.
   */
  resizeToFitContent(force: boolean = false) {
    // If autosizing is disabled, just skip everything else
    if (!this._enabled) {
      return;
    }

    this._cacheTextareaLineHeight();
    this._cacheTextareaPlaceholderHeight();

    // If we haven't determined the line-height yet, we know we're still hidden and there's no point
    // in checking the height of the textarea.
    if (!this._cachedLineHeight) {
      return;
    }

    const textarea = this._elementRef.nativeElement as HTMLTextAreaElement;
    const value = textarea.value;

    // Only resize if the value or minRows have changed since these calculations can be expensive.
    if (!force && this._minRows === this._previousMinRows && value === this._previousValue) {
      return;
    }

    const scrollHeight = this._measureScrollHeight();

    // The measuring class includes a 2px padding to workaround an issue with Chrome,
    // so we account for that extra space here by subtracting 4 (2px top + 2px bottom).
    const height = Math.max(scrollHeight, this._cachedPlaceholderHeight || 0);

    // Use the scrollHeight to know how large the textarea *would* be if fit its entire value.
    textarea.style.height = `${height}px`;

    this._ngZone.runOutsideAngular(() => {
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => this._scrollToCaretPosition(textarea));
      } else {
        setTimeout(() => this._scrollToCaretPosition(textarea));
      }
    });

    this._previousValue = value;
    this._previousMinRows = this._minRows;
  }

  /**
   * Resets the textarea to its original size
   */
  reset() {
    // Do not try to change the textarea, if the initialHeight has not been determined yet
    // This might potentially remove styles when reset() is called before ngAfterViewInit
    if (this._initialHeight !== undefined) {
      this._textareaElement.style.height = this._initialHeight;
    }
  }

  // In Ivy the `host` metadata will be merged, whereas in ViewEngine it is overridden. In order
  // to avoid double event listeners, we need to use `HostListener`. Once Ivy is the default, we
  // can move this back into `host`.
  // tslint:disable:no-host-decorator-in-concrete
  @HostListener('input')
  _noopInputHandler() {
    // no-op handler that ensures we're running change detection on input events.
  }

  /** Access injected document if available or fallback to global document reference */
  private _getDocument(): Document {
    return this._document || document;
  }

  /** Use defaultView of injected document if available or fallback to global window reference */
  private _getWindow(): Window {
    const doc = this._getDocument();
    return doc.defaultView || window;
  }

  /**
   * Scrolls a textarea to the caret position. On Firefox resizing the textarea will
   * prevent it from scrolling to the caret position. We need to re-set the selection
   * in order for it to scroll to the proper position.
   */
  private _scrollToCaretPosition(textarea: HTMLTextAreaElement) {
    const {selectionStart, selectionEnd} = textarea;
    const document = this._getDocument();

    // IE will throw an "Unspecified error" if we try to set the selection range after the
    // element has been removed from the DOM. Assert that the directive hasn't been destroyed
    // between the time we requested the animation frame and when it was executed.
    // Also note that we have to assert that the textarea is focused before we set the
    // selection range. Setting the selection range on a non-focused textarea will cause
    // it to receive focus on IE and Edge.
    if (!this._destroyed.isStopped && document.activeElement === textarea) {
      textarea.setSelectionRange(selectionStart, selectionEnd);
    }
  }

  static ngAcceptInputType_minRows: NumberInput;
  static ngAcceptInputType_maxRows: NumberInput;
  static ngAcceptInputType_enabled: BooleanInput;
}
