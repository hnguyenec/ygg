import { last, values } from 'lodash';
import { TheThingCell, TheThing } from '@ygg/the-thing/core';
import { login, MockDatabase } from '@ygg/shared/test/cypress';
import {
  TheThingEditorPageObjectCypress,
  TheThingViewPageObjectCypress
} from '../page-objects';
import { waitForTheThingCreated } from "./utils";

describe('Create a new the-thing', () => {
  const mockDatabase = new MockDatabase();
  const forgedCells = {
    綽號: TheThingCell.forge({ name: '綽號', type: 'text' }),
    興趣: TheThingCell.forge({ name: '興趣', type: 'longtext' }),
    售價: TheThingCell.forge({ name: '售價', type: 'number' }),
    照片: TheThingCell.forge({ name: '照片', type: 'album' }),
    地址: TheThingCell.forge({ name: '地址', type: 'address' })
  };

  before(() => {
    login();
  });

  after(function() {
    mockDatabase.clear();
  });

  beforeEach(function() {
    // Navigate to the-thing creation page
    cy.visit('/the-things/create');
  });

  it('Create a new the-thing with all cell-types, then confirm data consistency', () => {
    const theThing: TheThing = TheThing.forge({
      cells: forgedCells
    });
    const theThingEditorPO = new TheThingEditorPageObjectCypress();
    theThingEditorPO.setValue(theThing);
    theThingEditorPO.submit();
    waitForTheThingCreated().then(newId => {
      mockDatabase.pushDocument(`${TheThing.collection}/${newId}`);
    });

    const theThingViewPO = new TheThingViewPageObjectCypress();
    theThingViewPO.expectValue(theThing);
  });

  it('Clone from other the-thing', () => {
    const DollyOrigin = TheThing.forge({
      name: 'Dolly (Origin)',
      tags: ['sheep', 'cell donor']
    });
    mockDatabase.insert(
      `${TheThing.collection}/${DollyOrigin.id}`,
      DollyOrigin.toJSON()
    );
    cy.visit(`/the-things/${DollyOrigin.id}`);
    const theThingViewPO = new TheThingViewPageObjectCypress();
    theThingViewPO.gotoCreateByClone();
    const theThingEditorPO = new TheThingEditorPageObjectCypress();
    theThingEditorPO.expectVisible();
    theThingEditorPO.submit();
    waitForTheThingCreated().then(dollyCloneId => {
      mockDatabase.pushDocument(`${TheThing.collection}/${dollyCloneId}`);
      cy.wrap(dollyCloneId).should('not.eq', DollyOrigin.id);
    });
    theThingViewPO.expectValue(DollyOrigin);
  });
});
