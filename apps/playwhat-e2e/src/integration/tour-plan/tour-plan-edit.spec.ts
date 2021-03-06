// import { sampleSize, values, pick, sum, sumBy, random, find } from 'lodash';
import { ImitationTourPlan } from '@ygg/playwhat/core';
import {
  forgeTourPlansByState,
  SiteNavigator,
  TourPlanPageObjectCypress
} from '@ygg/playwhat/test';
import { login, theMockDatabase } from '@ygg/shared/test/cypress';
import { User } from '@ygg/shared/user/core';
import { loginTestUser, testUsers, waitForLogin } from '@ygg/shared/user/test';
import { TheThing, TheThingCell } from '@ygg/the-thing/core';
import { MyThingsDataTablePageObjectCypress } from '@ygg/the-thing/test';
import promisify from 'cypress-promise';
import { filter, values } from 'lodash';
import { beforeAll } from '../../support/before-all';
import { SampleEquipments, SamplePlays } from '../play/sample-plays';
import { MinimalTourPlan, TourPlanFull } from './sample-tour-plan';

describe('Edit exist tour-plans from my-tour-plans page', () => {
  const siteNavigator = new SiteNavigator();
  // const SampleTourPlans = [
  //   MinimalTourPlan,
  //   TourPlanWithPlaysNoEquipment
  // ];

  // const cartPO = new ShoppingCartEditorPageObjectCypress();
  // const imageThumbnailListPO = new ImageThumbnailListPageObjectCypress();
  const tourPlanPO = new TourPlanPageObjectCypress();
  const myTourPlansPO = new MyThingsDataTablePageObjectCypress(
    '',
    ImitationTourPlan
  );

  // const playPO = new TheThingPageObjectCypress('', ImitationPlay);
  const tourPlan = TourPlanFull.clone();
  tourPlan.name = `測試遊程(修改資料)_${Date.now()}`;
  ImitationTourPlan.setState(tourPlan, ImitationTourPlan.states.new);
  const tourPlansByState = forgeTourPlansByState();

  const SampleThings = SamplePlays.concat(SampleEquipments).concat([
    MinimalTourPlan,
    tourPlan,
    ...values(tourPlansByState)
  ]);

  const me: User = testUsers[0];

  before(() => {
    beforeAll();
    MinimalTourPlan.ownerId = me.id;
    cy.wrap(SampleThings).each((thing: any) => {
      thing.ownerId = me.id;
      theMockDatabase.insert(`${TheThing.collection}/${thing.id}`, thing);
    });
    cy.visit('/');
    loginTestUser(me);
  });

  // beforeEach(() => {
  // login().then(user => {
  //   // MinimalTourPlan.ownerId = user.id;
  //   cy.wrap(SampleThings).each((thing: any) => {
  //     thing.ownerId = user.id;
  //     theMockDatabase.insert(`${TheThing.collection}/${thing.id}`, thing);
  //   });
  // });
  // Reset MinimalTourPlan
  // tourPlanPO.expectVisible();
  // cy.visit('/');
  // });

  // afterEach(() => {
  //   theMockDatabase.clear();
  // });

  after(() => {
    // // Goto my-things page and delete all test things
    // const myThingsPO = new MyThingsPageObjectCypress();
    // siteNavigator.goto(['the-things', 'my'], myThingsPO);
    // cy.wait(3000);
    // myThingsPO.deleteAll();

    theMockDatabase.clear();
  });

  it('Edit exist tour-plan with full data', () => {
    siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
    myTourPlansPO.theThingDataTablePO.expectTheThing(MinimalTourPlan);
    myTourPlansPO.theThingDataTablePO.gotoTheThingView(MinimalTourPlan);
    tourPlanPO.expectVisible();
    tourPlanPO.theThingPO.setValue(TourPlanFull);
    tourPlanPO.theThingPO.save(TourPlanFull);
    tourPlanPO.expectValue(TourPlanFull);
  });

  it('Edit tour-plan, remove optional cells', () => {
    siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
    myTourPlansPO.theThingDataTablePO.gotoTheThingView(tourPlan);
    tourPlanPO.expectVisible();
    tourPlanPO.expectValue(tourPlan);
    const cells2BDel: TheThingCell[] = tourPlan.getCellsByNames(
      ImitationTourPlan.getOptionalCellIds()
    );
    for (const cell of cells2BDel) {
      tourPlanPO.deleteCell(cell);
    }
    tourPlanPO.theThingPO.save(tourPlan);

    // const resultTourPlan = tourPlan.clone();
    // resultTourPlan.deleteCells(cells2BDel);
    siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
    myTourPlansPO.theThingDataTablePO.gotoTheThingView(tourPlan);
    tourPlanPO.expectVisible();
    tourPlanPO.expectNoCells(cells2BDel);
  });

  it('Editable in state new', () => {
    const tourPlanNew = tourPlansByState[ImitationTourPlan.states['new'].name];
    siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
    myTourPlansPO.theThingDataTablePO.gotoTheThingView(tourPlanNew);
    tourPlanPO.expectVisible();
    tourPlanPO.theThingPO.expectState(ImitationTourPlan.states.new);
    tourPlanPO.expectEditable();
  });

  it('Editable in state editing', () => {
    const tourPlanEditing =
      tourPlansByState[ImitationTourPlan.states['editing'].name];
    siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
    myTourPlansPO.theThingDataTablePO.gotoTheThingView(tourPlanEditing);
    tourPlanPO.expectVisible();
    tourPlanPO.theThingPO.expectState(ImitationTourPlan.states.editing);
    tourPlanPO.expectEditable();
  });

  it('Readonly in other states', () => {
    const otherStates = filter(
      ImitationTourPlan.states,
      state =>
        !(state.name === 'new' || state.name === 'editing')
    );
    for (const state of otherStates) {
      const _tourPlan =
      tourPlansByState[state.name];
      siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
      myTourPlansPO.theThingDataTablePO.gotoTheThingView(_tourPlan);
      tourPlanPO.expectVisible();
      tourPlanPO.theThingPO.expectState(state);
      tourPlanPO.expectReadonly();        
    }
  });

  // it('Readonly if not owner', async () => {
  //   tourPlan.ownerId = 'You not see me, am ghost';
  //   // Readonly for all state
  //   for (const state of values(ImitationTourPlan.states)) {
  //     await promisify(
  //       cy.wrap(
  //         new Cypress.Promise((resolve, reject) => {
  //           cy.log(`Set state of ${tourPlan.id}: ${state.name}`);
  //           ImitationTourPlan.setState(tourPlan, state);
  //           // console.log(ImitationTourPlan.getState(tourPlan));
  //           theMockDatabase
  //             .insert(`${tourPlan.collection}/${tourPlan.id}`, tourPlan)
  //             .then(() => {
  //               tourPlanPO.theThingPO.expectState(state);
  //               tourPlanPO.expectReadonly();
  //               resolve();
  //             });
  //         }),
  //         { timeout: 20000 }
  //       )
  //     );
  //   }
  // });
});
