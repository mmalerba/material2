/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessLoader, HarnessPredicate} from '@angular/cdk/testing';
import {CardHarnessFilters} from './card-harness-filters';


/** Harness for interacting with a standard mat-card in tests. */
export class MatCardHarness extends ComponentHarness {
  /** The selector for the host element of a `MatCard` instance. */
  static hostSelector = 'mat-card';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatCardHarness` that meets
   * certain criteria.
   * @param options Options for filtering which card instances are considered a match.
   * @return a `HarnessPredicate` configured with the given options.
   */
  static with(options: CardHarnessFilters = {}): HarnessPredicate<MatCardHarness> {
    return new HarnessPredicate(MatCardHarness, options)
        .addOption('text', options.text,
            (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text))
        .addOption('title', options.title,
            (harness, title) => HarnessPredicate.stringMatches(harness.getTitleText(), title))
        .addOption('subtitle', options.subtitle,
            (harness, subtitle) =>
                HarnessPredicate.stringMatches(harness.getSubtitleText(), subtitle));
  }

  private _title = this.locatorForOptional('.mat-card-title');
  private _subtitle = this.locatorForOptional('.mat-card-subtitle');

  /** Gets all of the card's content as text. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /** Gets the cards's title text. */
  async getTitleText(): Promise<string> {
    return (await this._title())?.text() ?? '';
  }

  /** Gets the cards's subtitle text. */
  async getSubtitleText(): Promise<string> {
    return (await this._subtitle())?.text() ?? '';
  }

  /** Gets a harness loader for the header section of this card. */
  async getHarnessLoaderForHeader(): Promise<HarnessLoader | null> {
    return this.locatorFactory.harnessLoaderForOptional('.mat-card-header');
  }

  /** Gets a harness loader for the content section of this card. */
  async getHarnessLoaderForContent(): Promise<HarnessLoader | null> {
    return this.locatorFactory.harnessLoaderForOptional('.mat-card-content');
  }

  /** Gets a harness loader for the actions section of this card. */
  async getHarnessLoaderForActions(): Promise<HarnessLoader | null> {
    return this.locatorFactory.harnessLoaderForOptional('.mat-card-actions');
  }

  /** Gets a harness loader for the footer section of this card. */
  async getHarnessLoaderForFooter(): Promise<HarnessLoader | null> {
    return this.locatorFactory.harnessLoaderForOptional('.mat-card-footer');
  }
}
