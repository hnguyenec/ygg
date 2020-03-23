import { TheThingImitation, TheThing } from '@ygg/the-thing/core';
import { DateRange } from '@ygg/shared/omni-types/core';
import {
  RelationNamePurchase,
  CellNameCharge,
  Purchase,
  CellNamePrice,
  CellNameQuantity,
  ImitationOrder
} from '@ygg/shopping/core';
import { keyBy } from 'lodash';

export const CellNames = {
  completeAt: '完成時間'
};

export enum States {
  Completed = '已完成'
}

const cellsDef = {
  預計出遊日期: {
    name: '預計出遊日期',
    type: 'date-range',
    userInput: 'required'
  },
  預計參加人數: {
    name: '預計參加人數',
    type: 'number',
    userInput: 'required'
  },
  聯絡資訊: {
    name: '聯絡資訊',
    type: 'contact',
    userInput: 'required'
  },
  預計遊玩時間: {
    name: '預計遊玩時間',
    type: 'day-time-range',
    userInput: 'optional'
  },
  用餐需求: {
    name: '用餐需求',
    type: 'longtext',
    userInput: 'optional'
  },
  交通需求: {
    name: '交通需求',
    type: 'longtext',
    userInput: 'optional'
  },
  長輩人數: {
    name: '長輩人數',
    type: 'number',
    userInput: 'optional'
  },
  孩童人數: {
    name: '孩童人數',
    type: 'number',
    userInput: 'optional'
  },
  司領人數: {
    name: '司領人數',
    type: 'number',
    userInput: 'optional'
  },
  其他注意事項: {
    name: '其他注意事項',
    type: 'longtext',
    userInput: 'optional'
  }
};

cellsDef[CellNames.completeAt] = {
  name: CellNames.completeAt,
  type: 'datetime',
  userInput: 'hidden'
};

export const ImitationTourPlan: TheThingImitation = ImitationOrder.extend(
  {
    id: 'BvyVkzRIxEuYoPjxIjHVOA',
    name: '旅遊行程規劃',
    description: '規劃你想玩的體驗組合，預計出遊日期、參加人數，以及其他細節',
    icon: 'directions_bike',
    image: '/assets/images/tour/tour-plans.svg',
    view: 'tour-plan',
    editor: 'tour-plan',
    // templateId: TemplateTourPlan.id,
    cellsDef,
    filter: {
      name: '搜尋旅遊行程',
      tags: ['tour-plan', '遊程規劃']
    }
  }
);

ImitationTourPlan.dataTableConfig = {
  columns: keyBy(
    [
      {
        name: '預計出遊日期',
        label: '預計出遊日期',
        valueSource: 'cell'
      },
      {
        name: '預計參加人數',
        label: '預計參加人數',
        valueSource: 'cell'
      },
      {
        name: '聯絡資訊',
        label: '聯絡資訊',
        valueSource: 'cell'
      },
      {
        name: '總價',
        label: '總價',
        valueSource: 'function',
        valueFunc: ImitationOrder.valueFunctions['getTotalCharge']
      }
    ],
    'name'
  )
};

// export function getTotalCharge(tourPlan: TheThing): number {
//   let totalCharge = 0;
//   const relations = tourPlan.getRelations(RelationNamePurchase);
//   for (const relation of relations) {
//     const charge =
//       relation.getCellValue(CellNamePrice) *
//       relation.getCellValue(CellNameQuantity);
//     if (charge) {
//       totalCharge += charge;
//     }
//   }
//   return totalCharge;
// }

export function defaultName(tourPlan: TheThing): string {
  const dateRange: DateRange = tourPlan.getCellValue('預計出遊日期');
  return `深度遊趣${dateRange.days() + 1}日遊`;
}
