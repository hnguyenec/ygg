import {
  ImitationPlay,
  ImitationTourPlan,
  RelationshipEquipment
} from '@ygg/playwhat/core';
import { SiteNavigator, TourPlanPageObjectCypress } from '@ygg/playwhat/test';
import { theMockDatabase } from '@ygg/shared/test/cypress';
import {
  EmceePageObjectCypress,
  ImageThumbnailListPageObjectCypress,
  YggDialogPageObjectCypress
} from '@ygg/shared/ui/test';
import { User } from '@ygg/shared/user/core';
import { loginTestUser, logout, testUsers, waitForLogin } from '@ygg/shared/user/test';
import {
  Purchase,
  PurchaseAction,
  RelationPurchase,
  ShoppingCellDefines
} from '@ygg/shopping/core';
import {
  PurchaseProductPageObjectCypress,
  ShoppingCartEditorPageObjectCypress
} from '@ygg/shopping/test';
import { TheThing } from '@ygg/the-thing/core';
import {
  MyThingsDataTablePageObjectCypress,
  // MyThingsPageObjectCypress,
  TheThingPageObjectCypress
} from '@ygg/the-thing/test';
import { chunk, isEmpty, keyBy, random, sampleSize, sum } from 'lodash';
import { beforeAll } from '../../support/before-all';
import { HeaderPageObjectCypress } from '../../support/header.po';
import {
  PlaysWithEquipment,
  PlaysWithoutEquipment,
  SampleEquipments,
  SamplePlays
} from '../play/sample-plays';
import {
  MinimalTourPlan,
  // TourPlanWithPlaysNoEquipment,
  // TourPlanWithPlaysAndEquipments,
  TourPlanFull,
  TourPlanWithPlaysAndEquipments,
  TourPlanWithPlaysNoEquipment
} from '../tour-plan/sample-tour-plan';

describe('Import/export purchases between cart and tour-plan', () => {
  const siteNavigator = new SiteNavigator();
  for (const play of SamplePlays) {
    ImitationPlay.setState(play, ImitationPlay.states.forSale);
  }
  const SampleThings = SamplePlays.concat(SampleEquipments).concat([
    MinimalTourPlan,
    TourPlanFull,
    TourPlanWithPlaysNoEquipment,
    TourPlanWithPlaysAndEquipments
  ]);
  const imageThumbnailListPO = new ImageThumbnailListPageObjectCypress();
  const cartPO = new ShoppingCartEditorPageObjectCypress();
  const headerPO = new HeaderPageObjectCypress();
  const tourPlanPO = new TourPlanPageObjectCypress();
  const playPO = new TheThingPageObjectCypress('', ImitationPlay);
  const myTourPlansPO = new MyThingsDataTablePageObjectCypress(
    '',
    ImitationTourPlan
  );

  const me: User = testUsers[0];

  const purchasesTourPlanWithPlaysNoEquipment: Purchase[] = TourPlanWithPlaysNoEquipment.getRelations(
    RelationPurchase.name
  ).map(r => Purchase.fromRelation(r));
  const totalChargeTourPlanWithPlaysNoEquipment = sum(
    purchasesTourPlanWithPlaysNoEquipment.map(p => p.charge)
  );
  const resultTourPlan = TourPlanFull.clone();
  resultTourPlan.name = `測試遊程(從購物車中匯入購買資料)_${Date.now()}`;

  function purchasePlays(plays: TheThing[]): Cypress.Chainable<Purchase[]> {
    const purchases: { [playId: string]: Purchase } = keyBy(
      plays.map(play => {
        const purchase = new Purchase({
          productId: play.id,
          price: play.getCellValue(ShoppingCellDefines.price.id),
          quantity: random(10, 50)
        });
        return purchase;
      }),
      'productId'
    );
    const finalPurchases: Purchase[] = [];
    cy.wrap(plays).each((play: any) => {
      const playPurchases: Purchase[] = [];
      playPurchases.push(
        new Purchase({
          productId: play.id,
          price: play.getCellValue(ShoppingCellDefines.price.id),
          quantity: random(10, 50)
        })
      );
      const equipmentRelations = play.getRelations(RelationshipEquipment.name);
      if (!isEmpty(equipmentRelations)) {
        for (const eRelation of equipmentRelations) {
          const equip: TheThing = theMockDatabase.getEntity(
            `${TheThing.collection}/${eRelation.objectId}`
          );
          playPurchases.push(
            new Purchase({
              productId: eRelation.objectId,
              price: equip.getCellValue(ShoppingCellDefines.price.id),
              quantity: random(1, 10)
            })
          );
        }
      }

      siteNavigator.goto();
      const playThumbnailPO = imageThumbnailListPO.getItemPageObject(play);
      playThumbnailPO.clickLink();
      playPO.expectVisible();
      playPO.runAction(PurchaseAction);
      const dialogPO = new YggDialogPageObjectCypress();
      const purchasePO = new PurchaseProductPageObjectCypress(
        dialogPO.getSelector()
      );
      purchasePO.setValue(playPurchases);
      dialogPO.confirm();
      finalPurchases.push(...playPurchases);
    });
    return cy.wrap(finalPurchases);
  }

  before(() => {
    beforeAll();
    theMockDatabase.setAdmins([me.id]);
    cy.wrap(SampleThings).each((thing: any) => {
      thing.ownerId = me.id;
      theMockDatabase.insert(`${TheThing.collection}/${thing.id}`, thing);
    });
    cy.visit('/');
    loginTestUser(me);
  });

  // beforeEach(() => {
  //   cy.visit('/');
  //   waitForLogin();
  //   // tourPlanBuilderPO.reset();
  //   // siteNavigator.goto(['tour-plans', 'builder'], tourPlanBuilderPO);
  // });

  after(() => {
    // // Goto my-things page and delete all test things
    // const myThingsPO = new MyThingsPageObjectCypress();
    // siteNavigator.goto(['the-things', 'my'], myThingsPO);
    // cy.wait(3000);
    // myThingsPO.deleteAll();
    theMockDatabase.clear();
    // theMockDatabase.restoreRTDB();
  });

  it('Save tour plan with purchased plays', () => {
    // cy.pause();
    const plays = PlaysWithoutEquipment;
    purchasePlays(plays).then(purchases => {
      resultTourPlan.setRelation(
        RelationPurchase.name,
        purchases.map(p => p.toRelation())
      );
      const totalCharge = sum(purchases.map(p => p.charge));

      // Start test
      siteNavigator.goto(['shopping', 'cart'], cartPO);
      cartPO.submit();
      // cy.pause();
      tourPlanPO.expectVisible();
      tourPlanPO.theThingPO.setValue(resultTourPlan);
      tourPlanPO.theThingPO.save(resultTourPlan);
      siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
      myTourPlansPO.theThingDataTablePO.gotoTheThingView(resultTourPlan);
      // cy.pause();
      tourPlanPO.expectVisible();
      tourPlanPO.theThingPO.expectValue(resultTourPlan);
      tourPlanPO.expectPurchases(purchases);
      tourPlanPO.expectTotalCharge(totalCharge);
      siteNavigator.goto(['shopping', 'cart'], cartPO);
      cartPO.removeAll();
    });
  });

  it('Edit exist tour-plan altering purchases', () => {
    // const resultTourPlan = MinimalTourPlan.clone();
    // resultTourPlan.name = `測試遊程修改(加購體驗，含設備)_${Date.now()}`;
    siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
    myTourPlansPO.theThingDataTablePO.gotoTheThingView(resultTourPlan);
    tourPlanPO.expectVisible();
    tourPlanPO.theThingPO.runAction(
      ImitationTourPlan.actions['alter-shopping-cart']
    );
    cartPO.expectVisible();
    cartPO.removeAll();
    const plays: TheThing[] = PlaysWithEquipment;
    purchasePlays(plays).then(purchases => {
      const totalCharge = sum(purchases.map(p => p.charge));
      siteNavigator.goto(['shopping', 'cart'], cartPO);
      cartPO.expectSubmitTarget(resultTourPlan.name);
      cartPO.submit();
      tourPlanPO.expectVisible();
      tourPlanPO.expectPurchases(purchases);
      tourPlanPO.theThingPO.save(resultTourPlan);
      siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
      myTourPlansPO.theThingDataTablePO.gotoTheThingView(resultTourPlan);
      tourPlanPO.expectVisible();
      // tourPlanPO.expectValue(resultTourPlan);
      tourPlanPO.expectPurchases(purchases);
      tourPlanPO.expectTotalCharge(totalCharge);
    });
  });

  it('Submit purchases to tour-plan creation page', () => {
    const plays = PlaysWithoutEquipment.slice(2);
    purchasePlays(plays).then(purchases => {
      const totalCharge = sum(purchases.map(p => p.charge));
      siteNavigator.goto(['shopping', 'cart'], cartPO);
      cartPO.submit();
      tourPlanPO.expectVisible();
      tourPlanPO.expectPurchases(purchases);
      tourPlanPO.expectTotalCharge(totalCharge);
      siteNavigator.goto(['shopping', 'cart'], cartPO);
      cartPO.removeAll();
    });
  });

  it('Import purchases from tour-plan to cart page', () => {
    siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
    myTourPlansPO.theThingDataTablePO.gotoTheThingView(
      TourPlanWithPlaysNoEquipment
    );
    tourPlanPO.expectVisible();
    tourPlanPO.expectPurchases(purchasesTourPlanWithPlaysNoEquipment);
    tourPlanPO.theThingPO.runAction(
      ImitationTourPlan.actions['alter-shopping-cart']
    );
    cartPO.expectVisible();
    cartPO.expectPurchases(purchasesTourPlanWithPlaysNoEquipment);
    cartPO.expectTotalCharge(totalChargeTourPlanWithPlaysNoEquipment);
    cartPO.removeAll();
  });

  it('On import, confirm clear purchases already in cart', () => {
    const samplePlays = sampleSize(PlaysWithoutEquipment, 2);
    // Purchase some plays in advance, make cart not empty
    purchasePlays(samplePlays);

    siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
    myTourPlansPO.theThingDataTablePO.gotoTheThingView(
      TourPlanWithPlaysNoEquipment
    );
    tourPlanPO.expectVisible();
    tourPlanPO.theThingPO.runAction(
      ImitationTourPlan.actions['alter-shopping-cart']
    );
    const emceePO = new EmceePageObjectCypress();
    emceePO.confirm('原本在購物車中的購買項目將會被清除，是否繼續？');
    // const confirmPO = new ConfirmDialogPageObjectCypress();
    // confirmPO.expectMessage('原本在購物車中的購買項目將會被清除，是否繼續？');
    // confirmPO.confirm();
    cartPO.expectVisible();
    cartPO.expectPurchases(purchasesTourPlanWithPlaysNoEquipment);
    cartPO.expectTotalCharge(totalChargeTourPlanWithPlaysNoEquipment);
    cartPO.removeAll();
  });

  it('Remove purchases', () => {
    const purchaseRelations = TourPlanWithPlaysNoEquipment.getRelations(
      RelationPurchase.name
    );
    const [toBeRemoved, remains] = chunk(purchaseRelations, 2);
    const removePurchases = toBeRemoved.map(pr => Purchase.fromRelation(pr));
    const remainPurchases = remains.map(pr => Purchase.fromRelation(pr));
    const totalCharge = sum(remainPurchases.map(p => p.charge));
    siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
    myTourPlansPO.theThingDataTablePO.gotoTheThingView(
      TourPlanWithPlaysNoEquipment
    );
    tourPlanPO.expectVisible();
    tourPlanPO.theThingPO.runAction(
      ImitationTourPlan.actions['alter-shopping-cart']
    );
    cartPO.expectVisible();
    cy.wrap(removePurchases).each((p: Purchase) => {
      cartPO.removePurchase(p);
    });
    cartPO.submit();
    tourPlanPO.expectVisible();
    tourPlanPO.theThingPO.save(TourPlanWithPlaysNoEquipment);
    siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
    myTourPlansPO.theThingDataTablePO.gotoTheThingView(
      TourPlanWithPlaysNoEquipment
    );
    tourPlanPO.expectVisible();
    tourPlanPO.expectPurchases(remainPurchases);
    tourPlanPO.expectTotalCharge(totalCharge);
  });

  it('Hide purchases block if no purchase', () => {
    tourPlanPO.removeAllPurchases();
    tourPlanPO.expectNonePurchase();
  });
});
