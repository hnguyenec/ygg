import { TheThing } from '@ygg/the-thing/core';
import { TheThingListPageObject } from '@ygg/the-thing/ui';

export class TheThingListPageObjectCypress extends TheThingListPageObject {
  expectVisible() {
    cy.get(this.getSelector(), { timeout: 10000 }).should('exist');
  }

  expectTheThing(theThing: TheThing) {
    cy.get(this.getSelectorForTheThing(theThing)).should('exist');
  }

  expectCount(count: number) {
    cy.get(this.getSelectorForTheThing())
      .should('have.length', count);
  }

  expectNoTheThing(theThing: TheThing) {
    cy.get(this.getSelectorForTheThing(theThing)).should('not.exist');
  }

  deleteTheThing(theThing: TheThing) {
    cy.get(this.getSelectorForTheThingDelete(theThing)).click({ force: true });
  }
}
