/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ListboxSelectionChangeEvent} from '@angular/cdk-experimental/listbox';
import {ChangeDetectorRef, Component} from '@angular/core';
import {FormControl} from '@angular/forms';

@Component({
  templateUrl: 'cdk-listbox-demo.html',
  styleUrls: ['cdk-listbox-demo.css'],
})
export class CdkListboxDemo {
  pokemon: {[gen: string]: string[]} = {
    'kanto': [
        'bulbasaur',
        'charmander',
        'squirtle'
    ],
    'johto': [
        'chikorita',
        'cyndaquil',
        'totodile'
    ],
    'hoenn': [
        'treecko',
        'torchic',
        'mudkip'
    ]
  };

  availableGens = Object.keys(this.pokemon);
  availableMons: string[] = [];

  gens = new FormControl([]);
  mons = new FormControl([]);

  updateFormControl(fc: FormControl, e: ListboxSelectionChangeEvent<string>) {
    // I don't think this should be necessary, maybe form controls aren't hooked up right?
    fc.patchValue(e.source.getSelectedValues(), {
      emitEvent: true,
      emitModelToViewChange: false,
      emitViewToModelChange: false
    });
  }

  constructor() {
    this.gens.valueChanges.subscribe(gens => {
      this.availableMons = gens.flatMap((gen: string) => this.pokemon[gen]);
    });
  }
}
