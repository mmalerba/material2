import {NgModule} from '@angular/core';
import {MatCommonModule} from '@angular/material/core';
import {MatMdcCheckbox} from './checkbox';

@NgModule({
  imports: [MatCommonModule],
  exports: [MatMdcCheckbox, MatCommonModule],
  declarations: [MatMdcCheckbox],
})
export class MatMdcCheckboxModule {}
