import { PageObject } from '@ygg/shared/test/page-object';
import { TheThingPageObject } from '@ygg/the-thing/ui';

export abstract class EquipmentViewPageObject extends TheThingPageObject {}


// export abstract class EquipmentViewPageObject extends PageObject {
//   selectors = {
//     main: '.equipment-view',
//     name: '.name',
//     additionList: '.addition-list',
//     buttonAddCell: 'button.add-cell',
//     buttonSave: 'button.save',
//     equipments: '.equipments'
//   };

//   getSelectorForCell(cellName: string): string {
//     return `${this.getSelector()} [cell-name="${cellName}"]`;
//   }

//   getSelectorForCellDeleteButton(cellName: string): any {
//     return `${this.getSelectorForCell(cellName)} button.delete`;
//   }

// }
