import {
  extend,
  isEmpty,
  filter,
  pickBy,
  mapValues,
  get,
  isArray,
  keyBy
} from 'lodash';
import {
  generateID,
  SerializableJSON,
  toJSONDeep
} from '@ygg/shared/infra/data-access';
import { TheThing } from './the-thing';
import { ImageThumbnailItem } from '@ygg/shared/ui/widgets';
import { TheThingCell } from './cell';
import { TheThingFilter } from './filter';
import {
  TheThingValidator,
  TheThingValidatorBasic,
  TheThingValidateError
} from './validator';
import { Tags } from '@ygg/tags/core';
import { RelationDef } from './relation-def';
import { TheThingCellDefine } from './cell-define';
import { TheThingCellComparator, TheThingCellTypes } from './cell-type';

export const ImitationsDataPath = 'the-thing/imitations';

type ValueSource = 'cell' | 'function';
type ValueFunction = (thing: TheThing) => any;

export interface DataTableColumnConfig {
  name: string;
  label: string;
  valueSource?: ValueSource;
  valueFunc?: ValueFunction;
}

export interface DataTableConfig {
  columns: {
    [key: string]: DataTableColumnConfig;
  };
}

export class TheThingImitation implements ImageThumbnailItem, SerializableJSON {
  id: string;
  name: string;
  icon: string;
  image: string;
  description: string;
  view: string;
  editor: string;
  // templateId: string;
  filter: TheThingFilter;
  cellsDef: { [name: string]: TheThingCellDefine } = {};
  dataTableConfig?: DataTableConfig;
  validators: TheThingValidator[] = [];
  relationsDef: { [name: string]: RelationDef } = {};
  valueFunctions: { [name: string]: ValueFunction } = {};

  /** Create time */
  createAt: number;

  constructor(options: any = {}) {
    this.id = generateID();
    this.createAt = new Date().valueOf();
    this.view = 'basic';

    this.fromJSON(options);
  }

  createCell(name: string, value: any): TheThingCell {
    const cellDef = this.getCellDef(name);
    return cellDef.createCell(value);
  }

  getCellDef(name: string): TheThingCellDefine {
    return this.cellsDef[name];
  }

  createTheThing(): TheThing {
    const theThing = new TheThing();
    if (this.filter && this.filter.tags) {
      theThing.tags = new Tags(this.filter.tags);
    }
    theThing.view = this.view;
    for (const cellName in this.cellsDef) {
      if (this.cellsDef.hasOwnProperty(cellName)) {
        const cellDef = this.cellsDef[cellName];
        theThing.addCell(cellDef.createCell());
      }
    }
    for (const name in this.relationsDef) {
      if (this.relationsDef.hasOwnProperty(name)) {
        theThing.addRelation(name);
      }
    }
    return theThing;
  }

  getRequiredCellDefs(): TheThingCellDefine[] {
    return filter(this.cellsDef, cellDef => cellDef.userInput === 'required');
  }

  getRequiredCellNames(): string[] {
    return this.getRequiredCellDefs().map(cellDef => cellDef.name);
  }

  getOptionalCellDefs(): TheThingCellDefine[] {
    return filter(this.cellsDef, cellDef => cellDef.userInput === 'optional');
  }

  getOptionalCellNames(): string[] {
    return this.getOptionalCellDefs().map(cellDef => cellDef.name);
  }

  createOptionalCells(): TheThingCell[] {
    return this.getOptionalCellDefs().map(cellDef => cellDef.createCell());
  }

  getComparators(): { [cellName: string]: TheThingCellComparator } {
    return pickBy(
      mapValues(this.cellsDef, cellDef =>
        get(TheThingCellTypes, `${cellDef.type}.comparator`, null)
      ),
      cf => typeof cf === 'function'
    );
  }

  validate(theThing: TheThing): TheThingValidateError[] {
    if (isEmpty(this.validators)) {
      const basicValidator = new TheThingValidatorBasic({
        requiredCells: this.getRequiredCellDefs()
      });
      this.validators.push(basicValidator);
    }
    let errors: TheThingValidateError[] = [];
    for (const validator of this.validators) {
      errors = errors.concat(validator.validate(theThing));
    }
    return errors;
  }

  addRelationDef(rDef: RelationDef) {
    this.relationsDef[rDef.name] = rDef;
  }

  hasRelationDef(relationName: string): boolean {
    return !isEmpty(this.relationsDef) && relationName in this.relationsDef;
  }

  getRelationDef(relationName: string): RelationDef {
    return this.hasRelationDef(relationName)
      ? this.relationsDef[relationName]
      : null;
  }

  fromJSON(data: any = {}): this {
    extend(this, data);
    if (!isEmpty(data.cellsDef)) {
      let cellsDef = data.cellsDef;
      if (isArray(data.cellsDef)) {
        cellsDef = keyBy(data.cellsDef, 'name');
      }
      this.cellsDef = mapValues(
        cellsDef,
        cellDef => new TheThingCellDefine(cellDef)
      );
    }
    if (data.filter) {
      this.filter = new TheThingFilter().fromJSON(data.filter);
    }
    if (!isEmpty(data.relationsDef)) {
      let relationsDef = data.relationsDef;
      if (isArray(data.relationsDef)) {
        relationsDef = keyBy(data.relationsDef, 'name');
      }
      this.relationsDef = mapValues(
        relationsDef,
        rDef => new RelationDef(rDef)
      );
    }
    return this;
  }

  toJSON(): any {
    return toJSONDeep(this);
  }
}
