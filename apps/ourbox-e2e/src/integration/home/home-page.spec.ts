import {
  ImitationBox,
  pages as OurboxPages,
  RelationshipBoxMember
} from '@ygg/ourbox/core';
import {
  BoxCreatePageObjectCypress,
  ItemWarehousePageObjectCypress,
  MapSearchPageObjectCypress,
  MyBoxesPageObjectCypress,
  SiteHowtoPageObjectCypress,
  HeaderPageObjectCypress
} from '@ygg/ourbox/test';
import { Document, theMockDatabase } from '@ygg/shared/test/cypress';
import { SideDrawerPageObjectCypress } from '@ygg/shared/ui/test';
import { User } from '@ygg/shared/user/core';
import { loginTestUser, logout, testUsers } from '@ygg/shared/user/test';
import { SiteNavigator } from '../../support/site-navigator';
import { Page } from '@ygg/shared/ui/core';

describe('Ourbox home page, as guest(not login)', () => {
  function getPageLink(page: Page): string {
    return `.link-card a:contains("${page.label}")`;
  }

  const headerPO = new HeaderPageObjectCypress();
  const siteNavigator = new SiteNavigator();
  const sideDrawerPO = new SideDrawerPageObjectCypress();
  const mapSearchPO = new MapSearchPageObjectCypress();
  const boxCreatePO = new BoxCreatePageObjectCypress();
  const siteHowtoPO = new SiteHowtoPageObjectCypress();
  const myBoxesPO = new MyBoxesPageObjectCypress();
  const itemWarehousePO = new ItemWarehousePageObjectCypress();

  const sampleBox = ImitationBox.forgeTheThing();
  const SampleDocuments: Document[] = [];
  const userWithoutBox: User = testUsers[0];
  const userWithBox: User = testUsers[1];

  sampleBox.addUsersOfRole(RelationshipBoxMember.role, [userWithBox.id]);
  SampleDocuments.push({
    path: `${User.collection}/${userWithoutBox.id}`,
    data: userWithoutBox
  });
  SampleDocuments.push({
    path: `${User.collection}/${userWithBox.id}`,
    data: userWithBox
  });
  SampleDocuments.push({
    path: `${sampleBox.collection}/${sampleBox.id}`,
    data: sampleBox
  });

  before(() => {
    // sampleBox.ownerId = user.id;
    cy.wrap(SampleDocuments).each((doc: Document) => {
      theMockDatabase.insert(doc.path, doc.data);
    });
    cy.visit('/');
  });

  beforeEach(function() {
    siteNavigator.gotoHome();
  });

  after(() => {
    theMockDatabase.clear();
  });

  it('Should show link of site-howto if first visit', () => {
    // Hide link of map-search
    cy.get(getPageLink(OurboxPages.mapSearch)).should('not.be.visible');

    cy.get(getPageLink(OurboxPages.siteHowto)).click({ force: true });
    siteHowtoPO.expectVisible({ timeout: 10000 });
  });

  it('Should show link of site-howto in side-drawer', () => {
    headerPO.openSideDrawer();
    sideDrawerPO.expectVisible();
    sideDrawerPO.clickLink(OurboxPages.siteHowto);
    siteHowtoPO.expectVisible({ timeout: 10000 });
  });

  it('Should show link of map-search if not first visit', () => {
    cy.visit('/');
    // Hide link of site-howto
    cy.get(getPageLink(OurboxPages.siteHowto)).should('not.be.visible');

    cy.get(getPageLink(OurboxPages.mapSearch)).click({ force: true });
    mapSearchPO.expectVisible({ timeout: 10000 });
  });

  it('Should show link of map-search in side-drawer', () => {
    headerPO.openSideDrawer();
    sideDrawerPO.expectVisible();
    sideDrawerPO.clickLink(OurboxPages.mapSearch);
    mapSearchPO.expectVisible({ timeout: 10000 });
  });

  it('Should show link of box-create if user has no box', () => {
    loginTestUser(userWithoutBox);
    // Hide link of my-boxes
    cy.get(getPageLink(OurboxPages.myBoxes)).should('not.be.visible');
    cy.get(getPageLink(OurboxPages.boxCreate)).click({ force: true });
    boxCreatePO.expectVisible({ timeout: 10000 });
    logout();
  });

  it('Should show link of box-create in side-drawer', () => {
    headerPO.openSideDrawer();
    sideDrawerPO.expectVisible();
    sideDrawerPO.clickLink(OurboxPages.boxCreate);
    boxCreatePO.expectVisible({ timeout: 10000 });
  });

  it('Should show link of my-boxes if user is member of any box', () => {
    loginTestUser(userWithBox);
    // Hide link of box-create
    cy.get(getPageLink(OurboxPages.boxCreate), { timeout: 10000 }).should(
      'not.be.visible'
    );
    cy.get(getPageLink(OurboxPages.myBoxes), { timeout: 10000 }).click({
      force: true
    });
    myBoxesPO.expectVisible({ timeout: 10000 });
    logout();
  });

  it('Should show links of box-create as guest', () => {
    // Hide link of my-boxes
    cy.get(getPageLink(OurboxPages.myBoxes)).should('not.be.visible');

    cy.get(getPageLink(OurboxPages.boxCreate)).click({ force: true });
    boxCreatePO.expectVisible({ timeout: 10000 });
  });

  it('Should show link of item-warehouse in side-drawer', () => {
    headerPO.openSideDrawer();
    sideDrawerPO.expectVisible();
    sideDrawerPO.clickLink(OurboxPages.itemWarehouse);
    itemWarehousePO.expectVisible({ timeout: 10000 });
  });
});
