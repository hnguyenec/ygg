import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedUiNgMaterialModule } from '@ygg/shared/ui/ng-material';

import { LogListComponent } from './log-list/log-list.component';

@NgModule({
  declarations: [LogListComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedUiNgMaterialModule
  ],
  exports: [LogListComponent]
})
export class SharedInfrastructureLogModule {}