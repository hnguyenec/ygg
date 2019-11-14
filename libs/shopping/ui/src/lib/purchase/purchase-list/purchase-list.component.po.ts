import { PageObject } from '@ygg/shared/test/page-object';
import { Product } from '@ygg/shopping/core';

export class PurchaseListPageObject extends PageObject {
  selectors = {
    main: '.purchase-list',
    list: '.list',
    totalPrice: '.total-price'
  };

  getSelectorForProduct(product: Product): string {
    return `${this.getSelector('list')} [product-id="${product.id}"]`;
  }
}