import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControlComponent } from './form-control';
import { DynamicFormComponent } from './dynamic-form/dynamic-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedUiWidgetsModule } from '@ygg/shared/ui/widgets';
import { SharedUiNgMaterialModule } from '@ygg/shared/ui/ng-material';
import { SharedOmniTypesUiModule } from '@ygg/shared/omni-types/ui';
import { SharedOmniTypesUiModule } from "@ygg/shared/omni-types/ui";
import { FormArrayComponent } from './form-array';

@NgModule({
  declarations: [FormControlComponent, DynamicFormComponent, FormArrayComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedUiNgMaterialModule,
    SharedUiWidgetsModule,
    SharedTypesModule,
    SharedOmniTypesUiModule
  ],
  exports: [DynamicFormComponent, FormControlComponent, FormArrayComponent]
})
export class SharedUiDynamicFormModule {}
