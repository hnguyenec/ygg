import { DateRange, DayTimeRange } from '@ygg/shared/omni-types/core';
import { TheThing, TheThingCell } from '@ygg/the-thing/core';
import { TourPlanViewPageObject } from '@ygg/playwhat/ui';
import {
  DateRangeViewPageObjectCypress,
  DayTimeRangeViewPageObjectCypress,
  ContactViewPageObjectCypress
} from '@ygg/shared/omni-types/test';
import { ImageThumbnailListPageObjectCypress } from '@ygg/shared/ui/test';
import { ImitationTourPlan, defaultName } from '@ygg/playwhat/core';
import { TheThingCellViewPageObjectCypress } from '@ygg/the-thing/test';
import { PurchaseListPageObjectCypress } from '@ygg/shopping/test';
import {
  RelationNamePurchase,
  Purchase,
  CellNameQuantity
} from '@ygg/shopping/core';
import { isEmpty, find } from 'lodash';
import { MockDatabase, theMockDatabase } from '@ygg/shared/test/cypress';

export class TourPlanViewPageObjectCypress extends TourPlanViewPageObject {
  constructor(parentSelector?: string) {
    super(parentSelector);
    this.dateRangeViewPO = new DateRangeViewPageObjectCypress(
      this.getSelector('dateRange')
    );
    this.contactViewPO = new ContactViewPageObjectCypress(
      this.getSelector('contact')
    );
    this.purchaseListPO = new PurchaseListPageObjectCypress(
      this.getSelector('purchases')
    );
  }

  expectVisible() {
    cy.get(this.getSelector(), { timeout: 10000 }).should('be.visible');
  }

  expectName(name: string) {
    cy.get(this.getSelector('name')).should('include.text', name);
  }

  expectCell(cell: TheThingCell) {
    cy.get(`${this.getSelectorForCell(cell.name)} h4`).contains(cell.name);
    const cellViewPagePO = new TheThingCellViewPageObjectCypress(
      this.getSelectorForCell(cell.name)
    );
    cellViewPagePO.expectValue(cell);
  }

  expectValue(tourPlan: TheThing) {
    this.expectName(tourPlan.name || defaultName(tourPlan));
    const requiredCells = ImitationTourPlan.getRequiredCellNames();
    for (const requiredCell of requiredCells) {
      const cell = tourPlan.cells[requiredCell];
      this.expectCell(cell);
    }
    const optionalCells = ImitationTourPlan.getOptionalCellNames();
    for (const optionalCell of optionalCells) {
      if (tourPlan.hasCell(optionalCell)) {
        const cell = tourPlan.cells[optionalCell];
        this.expectCell(cell);
      }
    }
    if (tourPlan.hasRelation(RelationNamePurchase)) {
      // tslint:disable-next-line: no-unused-expression
      const purchases = tourPlan.getRelations(RelationNamePurchase).map(r => {
        const product: TheThing = theMockDatabase.getEntity(
          `${TheThing.collection}/${r.objectId}`
        ) as TheThing;
        return Purchase.purchase(
          tourPlan,
          product,
          r.getCellValue(CellNameQuantity)
        );
      });
      this.purchaseListPO.expectPurchases(purchases);
    }
  }

  submitApplication(): void {
    cy.get(this.getSelector('buttonSubmitApplication')).click();
  }

  adminComplete() {
    cy.get(this.getSelector('buttonAdminComplete')).click();
  }

  adminPaid() {
    cy.get(this.getSelector('buttonAdminPaid')).click();
  }
}