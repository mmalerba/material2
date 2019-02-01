/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FactoryProvider, Injectable, OnDestroy, Optional, SkipSelf} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {distinctUntilChanged, filter} from 'rxjs/operators';
import {DateAdapter} from './date-adapter';


/** The source of a `DateSelectionChangeEvent`. */
export enum DateSelectionChangeSource {
  /** Event originated from user typing in input field. */
  USER_INPUT,
  /** Event originated from user clicking a calendar date. */
  USER_CALENDAR,
  /** Event originated from programmatic update of the selection model. */
  PROGRAM
}

const {PROGRAM} = DateSelectionChangeSource;

export interface DateSelectionChangeEvent<S> {
  value: S | null;
  source: DateSelectionChangeSource;
}

/** Represents a date range. */
export interface DateRange<D> {
  /** The start of the range. */
  start: D | null;

  /** The end of the range. */
  end: D | null;
}

/** A selection model used to represent the currently selected value in a date picker. */
export abstract class MatDateSelectionModel<D, S = unknown> implements OnDestroy {
  /** Subject used to emit when the selected value has changed. */
  protected selectionSubject: Subject<DateSelectionChangeEvent<S>> =
      new Subject<DateSelectionChangeEvent<S>>();

  /** Emits when the selected value has changed (de-duped). */
  // TODO: update call site
  selectionChange: Observable<DateSelectionChangeEvent<S>> = this.selectionSubject.pipe(
      distinctUntilChanged((e1, e2) => this.isSameSelection(e1.value, e2.value)));

  /** Emits when the selected value has changed due to user interaction (de-duped). */
  userSelectionChange: Observable<DateSelectionChangeEvent<S>> = this.selectionSubject.pipe(
      filter(e => e.source != PROGRAM),
      distinctUntilChanged((e1, e2) => this.isSameSelection(e1.value, e2.value)));

  protected selection: S | null = null;

  protected constructor(protected readonly adapter: DateAdapter<D>) {}

  ngOnDestroy() {
    this.selectionSubject.complete();
  }

  /** Adds a date to the current selection. */
  abstract add(date: D, source?: DateSelectionChangeSource): void;

  /** Clones this selection model. */
  abstract clone(): MatDateSelectionModel<D, S>;

  /** Gets the first date in the current selection. */
  abstract getFirstSelectedDate(): D | null;

  /** Gets the last date in the current selection. */
  abstract getLastSelectedDate(): D | null;

  /** Whether the selection is complete for this selection model. */
  abstract isComplete(): boolean;

  /** Whether the selection model contains the same selection as the given selection model. */
  abstract isSame(other: MatDateSelectionModel<D>): boolean;

  /** Whether the current selection is valid. */
  abstract isValid(): boolean;

  /** Whether the given date is contained in the current selection. */
  abstract contains(value: D): boolean;

  /** Whether the given date range overlaps the current selection in any way. */
  abstract overlaps(range: DateRange<D>): boolean;

  /** Whether the given selection values are the same. */
  protected abstract isSameSelection(first: S | null, second: S | null): boolean;
}

/** A concrete implementation of a `MatDateSelectionModel` that holds a single date. */
@Injectable()
export class MatSingleDateSelectionModel<D> extends MatDateSelectionModel<D, D> {
  constructor(adapter: DateAdapter<D>) {
    super(adapter);
  }

  /** Sets the current selection. */
  setSelection(date: D | null, source: DateSelectionChangeSource = PROGRAM) {
    this.selection = date;
    this.selectionSubject.next({value: this.selection, source});
  }

  /** Gets the current selection. */
  getSelection(): D | null {
    return this.isValid() ? this.selection : null;
  }

  /**
   * Adds the given date to the selection model. For a `MatSingleDateSelectionModel` this means
   * simply replacing the current selection with the given selection.
   */
  add(date: D, source: DateSelectionChangeSource = PROGRAM) {
    this.setSelection(date, source);
  }

  clone(): MatSingleDateSelectionModel<D> {
    const cloned = new MatSingleDateSelectionModel<D>(this.adapter);
    cloned.setSelection(this.selection);
    return cloned;
  }

  getFirstSelectedDate() { return this.selection; }

  getLastSelectedDate() { return this.selection; }

  isComplete() { return !!this.selection; }

  isSame(other: MatDateSelectionModel<D, unknown>): boolean {
    return other instanceof MatSingleDateSelectionModel &&
        this.isSameSelection(this.selection, other.selection);
  }

  isValid(): boolean {
    return !this.selection || this.adapter.isDateInstance(this.selection) &&
        this.adapter.isValid(this.selection);
  }

  contains(value: D): boolean {
    return !!(this.selection && this.adapter.sameDate(value, this.selection));
  }

  /**
   * Determines if the single date is within a given date range. Retuns false if either dates of
   * the range is null or if the selection is undefined.
   */
  overlaps(range: DateRange<D>): boolean {
    return !!(this.selection && range.start && range.end &&
        this.adapter.compareDate(range.start, this.selection) <= 0 &&
        this.adapter.compareDate(this.selection, range.end) <= 0);
  }

  protected isSameSelection(first: D | null, second: D | null): boolean {
    return this.adapter.sameDate(first, second);
  }
}

/**
 * Concrete implementation of a MatDateSelectionModel that holds a date range, represented by
 * a start date and an end date.
 */
@Injectable()
export class MatRangeDateSelectionModel<D> extends MatDateSelectionModel<D, DateRange<D>> {
  constructor(adapter: DateAdapter<D>) {
    super(adapter);
  }

  /** Sets the current selection. */
  setSelection(range: DateRange<D> | null, source: DateSelectionChangeSource = PROGRAM) {
    this.selection = range && {...range};
    this.selectionSubject.next({value: this.selection, source});
  }

  /** Gets the current selection. */
  getSelection(): DateRange<D> | null {
    return this.isValid() && this.selection && (this.selection.start || this.selection.end) ?
        {...this.selection} : null;
  }

  /**
   * Adds the given date to the selection model. For a `MatRangeDateSelectionModel` this means:
   * - Setting the start date if nothing is already selected.
   * - Setting the end date if the start date is already set but the end is not.
   * - Clearing the selection and setting the start date if both the start and end are already set.
   */
  add(date: D, source: DateSelectionChangeSource = PROGRAM): void {
    if (!this.selection || !this.selection.start) {
      this.setSelection({end: null, ...this.selection, start: date}, source);
    } else if (!this.selection.end) {
      this.setSelection({...this.selection, end: date}, source);
    } else {
      this.setSelection({start: date, end: null}, source);
    }
  }

  clone(): MatRangeDateSelectionModel<D> {
    const cloned = new MatRangeDateSelectionModel<D>(this.adapter);
    cloned.setSelection(this.selection && {...this.selection});
    return cloned;
  }

  getFirstSelectedDate() { return this.selection && this.selection.start; }

  getLastSelectedDate() { return this.selection && this.selection.end; }

  isComplete(): boolean {
    return !!(this.selection && this.selection.start && this.selection.end);
  }

  isSame(other: MatDateSelectionModel<D, unknown>): boolean {
    return other instanceof MatRangeDateSelectionModel &&
        this.isSameSelection(this.selection, other.selection);
  }

  isValid(): boolean {
    return !this.selection || !!(this.selection.start && this.selection.end &&
        this.adapter.isValid(this.selection.start) && this.adapter.isValid(this.selection.end));
  }

  contains(value: D): boolean {
    if (!this.selection) {
      return false;
    }
    if (this.selection.start && this.selection.end) {
      return this.adapter.compareDate(this.selection.start, value) <= 0 &&
          this.adapter.compareDate(this.selection.end, value) >= 0;
    } else if (this.selection.start) {
      return this.adapter.sameDate(this.selection.start, value);
    }

    return false;
  }

  /**
   * Returns true if the given range and the selection overlap in any way. False if otherwise, that
   * includes incomplete selections or ranges.
   */
  overlaps(range: DateRange<D>): boolean {
    if (!(this.selection && this.selection.start && this.selection.end && range.start &&
          range.end)) {
      return false;
    }

    return (
      this._isBetween(range.start, this.selection.start, this.selection.end) ||
      this._isBetween(range.end, this.selection.start, this.selection.end) ||
      (
        this.adapter.compareDate(range.start, this.selection.start) <= 0 &&
        this.adapter.compareDate(this.selection.end, range.end) <= 0
      )
    );
  }

  protected isSameSelection(first: DateRange<D> | null, second: DateRange<D> | null): boolean {
    if (!first || !second) {
      return first == second;
    }
    return this.adapter.sameDate(first.start, second.start) &&
        this.adapter.sameDate(first.end, second.end);
  }

  private _isBetween(value: D, from: D, to: D): boolean {
    return this.adapter.compareDate(from, value) <= 0 && this.adapter.compareDate(value, to) <= 0;
  }
}

/**
 * A factory used to create a `MatDateSelectionModel`. If one is provided by the parent it reuses
 * that one, if not it creates a new `MatSingleDateSelectionModel`.
 */
export function MAT_SINGLE_DATE_SELECTION_MODEL_FACTORY<D>(parent: MatSingleDateSelectionModel<D>,
                                                           adapter: DateAdapter<D>) {
  return parent || new MatSingleDateSelectionModel(adapter);
}

/**
 * A provider that re-provides the parent `MatDateSelectionModel` if available, otherwise provides a
 * new `MatSingleDateSelectionModel`
 */
export const MAT_SINGLE_DATE_SELECTION_MODEL_PROVIDER: FactoryProvider = {
  provide: MatDateSelectionModel,
  deps: [[new Optional(), new SkipSelf(), MatDateSelectionModel], DateAdapter],
  useFactory: MAT_SINGLE_DATE_SELECTION_MODEL_FACTORY,
};
