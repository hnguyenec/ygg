import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { TheThing, TheThingCell, TheThingCellTypes } from '@ygg/the-thing/core';
import { TheThingAccessService } from '@ygg/the-thing/data-access';
import { Tags } from '@ygg/tags/core';

@Component({
  selector: 'the-thing-the-thing-creator',
  templateUrl: './the-thing-creator.component.html',
  styleUrls: ['./the-thing-creator.component.css']
})
export class TheThingCreatorComponent implements OnInit {
  formGroup: FormGroup;
  cellsFormGroup: FormGroup;
  formControlNewCellType: FormControl;
  cellTypes = TheThingCellTypes;
  formControlNewCellName: FormControl;
  cells: TheThingCell[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private theThingAccessService: TheThingAccessService,
    private router: Router
  ) {
    this.formGroup = formBuilder.group({
      types: [],
      name: '東東'
    });
    this.cellsFormGroup = formBuilder.group({});
    this.formControlNewCellType = new FormControl();
    this.formControlNewCellName = new FormControl();
  }

  ngOnInit() {}

  addCell() {
    const cell = new TheThingCell().fromJSON({
      name: this.formControlNewCellName.value,
      type: this.formControlNewCellType.value,
      value: null
    });
    this.cells.push(cell);
    this.cellsFormGroup.addControl(
      this.formControlNewCellName.value,
      new FormControl()
    );
  }

  async onSubmit() {
    const meta = {
      name: this.formGroup.get('name').value,
      types: (this.formGroup.get('types').value as Tags).toIDArray()
    };
    let theThing = TheThing.from(meta, this.cells);
    if (confirm(`新增 ${theThing.name} ？`)) {
      try {
        theThing = await this.theThingAccessService.upsert(theThing);
        this.router.navigate(['/', 'the-things', theThing.id]);
      } catch (error) {
        alert(`新增失敗，錯誤訊息 ${error.message}`);
      }
    }
  }
}
