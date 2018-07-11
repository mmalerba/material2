import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {MatCommonModule, MatRippleModule} from '@angular/material/core';

import {MdcCheckbox} from './checkbox';

@NgModule({
  declarations: [MdcCheckbox],
  exports: [
    MdcCheckbox,
  ],
  imports: [
    BrowserModule,
    MatCommonModule,
    MatRippleModule
  ]
})
export class MdcCheckboxModule {
}
