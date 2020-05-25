import { TheThingImitation, TheThing } from '@ygg/the-thing/core';
import { RelationPurchase } from './purchase';
import { CellNames } from './cell-names';

export const ImitationOrder = new TheThingImitation({
  id: '7cNQdeD6VZxZshH9A7Law9',
  name: '訂單範本',
  description: '定義交易訂單所需的資料欄位及功能',
  icon: 'shop',
  image: '/assets/images/shopping/order.png',
  filter: {
    tags: ['order', ' 訂單']
  },
  stateName: '訂購狀態',
  states: {
    new: {
      name: 'new',
      label: '新建立',
      value: 1
    },
    applied: {
      name: 'applied',
      label: '已提交',
      value: 3
    },
    paid: {
      name: 'paid',
      label: '已付款',
      value: 5
    },
    completed: {
      name: 'completed',
      label: '已完成',
      value: 9
    }
  }
});

ImitationOrder.creators.push((order: TheThing) => {
  order.setState(ImitationOrder.stateName, ImitationOrder.states.new);
  return order;
});

export function getTotalCharge(order: TheThing): number {
  let totalCharge = 0;
  const relations = order.getRelations(RelationPurchase.name);
  for (const relation of relations) {
    const quantity = relation.getCellValue(CellNames.quantity);
    const price = relation.getCellValue(CellNames.price);
    const charge = price * quantity;
    // console.log(`${price} x ${quantity} = ${charge}`);
    if (charge) {
      totalCharge += charge;
    }
  }
  // console.log(`Total charge = ${totalCharge}`);
  return totalCharge;
}

ImitationOrder.valueFunctions['getTotalCharge'] = getTotalCharge;
