import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatAutocompleteHarness} from './autocomplete-harness';
import {runTests} from './shared.spec';

describe('Non-MDC-based MatAutocompleteHarness', () => {
  runTests(MatAutocompleteModule, MatAutocompleteHarness);
});
