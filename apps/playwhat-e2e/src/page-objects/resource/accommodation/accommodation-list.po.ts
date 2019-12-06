import { Accommodation } from "@ygg/resource/core";
import { AccommodationListPageObject } from "@ygg/resource/ui";

export class AccommodationListPageObjectCypress extends AccommodationListPageObject {

  expectAccommodation(accommodation: Accommodation) {
    cy.get(this.getSelectorForAccommodation(accommodation)).should('exist');
  }

  expectAccommodations(accommodations: Accommodation[]) {
    cy.pause();
    cy.wrap(accommodations).each((acmd: Accommodation) => this.expectAccommodation(acmd));
  }

  expectValue(accommodations: Accommodation[]) {
    accommodations.forEach(acmd => this.expectAccommodation(acmd));
  }

  gotoCreateAccommodation() {
    cy.get(this.getSelector('buttonGotoCreate')).click({force: true});
  }

}