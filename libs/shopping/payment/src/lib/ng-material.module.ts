import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { 
// MatIconModule,
// MatTooltipModule,
// MatBadgeModule,
// MatTableModule,
// MatStepperModule,
// MatCardModule,
MatListModule } from '@angular/material/list';
import { 
// MatButtonModule,
// MatInputModule,
// MatFormFieldModule,
MatRadioModule } from '@angular/material/radio';

@NgModule({
  exports: [
    BrowserAnimationsModule,
    // MatButtonModule,
    // MatInputModule,
    MatRadioModule,
    MatCheckboxModule,
    // MatFormFieldModule,
    // MatIconModule,
    // MatTooltipModule,
    // MatBadgeModule,
    // MatTableModule,
    // MatStepperModule,
    // MatCardModule,
    MatListModule
  ]
})
export class NgMaterialModule {}
