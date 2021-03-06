import {
  ImitationItem,
  ImitationItemTransfer,
  ItemTransferNotificationType,
  RelationshipItemHolder,
  RelationshipItemRequester,
  RelationshipItemTransferGiver,
  RelationshipItemTransferReceiver
} from '@ygg/ourbox/core';
import {
  ItemPageObjectCypress,
  ItemTransferPageObjectCypress,
  MyHeldItemsPageObjectCypress,
  MyItemTransfersPageObjectCypress
} from '@ygg/ourbox/test';
import { beforeAll, theMockDatabase } from '@ygg/shared/test/cypress';
import { EmceePageObjectCypress } from '@ygg/shared/ui/test';
import { Notification, User } from '@ygg/shared/user/core';
import {
  AccountWidgetPageObjectCypress,
  loginTestUser,
  logout,
  MyNotificationListPageObjectCypress,
  testUsers
} from '@ygg/shared/user/test';
import { SiteNavigator } from '../../support/site-navigator';

describe('Create an item-transfer task', () => {
  const siteNavigator = new SiteNavigator();
  const myHeldItemsPO = new MyHeldItemsPageObjectCypress();
  const itemPO = new ItemPageObjectCypress();
  const itemTransferPO = new ItemTransferPageObjectCypress();
  const emceePO = new EmceePageObjectCypress();
  const accountWidgetPO = new AccountWidgetPageObjectCypress();
  const myNotificationsPO = new MyNotificationListPageObjectCypress();
  const myItemTransfersPO = new MyItemTransfersPageObjectCypress();

  const testUser = testUsers[0];
  const testHolder = testUsers[1];
  const testRequester = testUsers[2];

  const testItem = ImitationItem.forgeTheThing();
  testItem.ownerId = testUser.id;
  testItem.setState(ImitationItem.stateName, ImitationItem.states.available);
  testItem.setUserOfRole(RelationshipItemHolder.role, testHolder.id);
  testItem.addUsersOfRole(RelationshipItemRequester.role, [testRequester.id]);

  const testItemTransfer = ImitationItemTransfer.forgeTheThing();
  testItemTransfer.name = `${testHolder.name} 交付 ${testItem.name} 給 ${
    testRequester.name
  } 的交付任務_${Date.now()}`;
  testItemTransfer.setUserOfRole(
    RelationshipItemTransferGiver.role,
    testHolder.id
  );
  testItemTransfer.setUserOfRole(
    RelationshipItemTransferReceiver.role,
    testRequester.id
  );

  const testItemNoRequester = ImitationItem.forgeTheThing();
  testItemNoRequester.ownerId = testUser.id;
  testItemNoRequester.setState(
    ImitationItem.stateName,
    ImitationItem.states.available
  );
  testItemNoRequester.setUserOfRole(RelationshipItemHolder.role, testHolder.id);

  before(() => {
    beforeAll();
    theMockDatabase.insert(`${User.collection}/${testUser.id}`, testUser);
    theMockDatabase.insert(`${User.collection}/${testHolder.id}`, testHolder);
    theMockDatabase.insert(
      `${User.collection}/${testRequester.id}`,
      testRequester
    );
    theMockDatabase.insert(
      `${ImitationItem.collection}/${testItem.id}`,
      testItem
    );
    theMockDatabase.insert(
      `${ImitationItem.collection}/${testItemNoRequester.id}`,
      testItemNoRequester
    );
    cy.visit('/');
    loginTestUser(testHolder);
    siteNavigator.gotoMyHeldItems();
    myHeldItemsPO.expectVisible();
    myHeldItemsPO.gotoItem(testItem);
    itemPO.expectVisible();
  });

  it('Can not create item-transfer if item not available', () => {
    testItem.setState(ImitationItem.stateName, ImitationItem.states.editing);
    theMockDatabase.insert(
      `${ImitationItem.collection}/${testItem.id}`,
      testItem
    );
    itemPO.theThingPO.expectNoActionButton(
      ImitationItem.actions['transfer-next']
    );
    testItem.setState(ImitationItem.stateName, ImitationItem.states.available);
    theMockDatabase.insert(
      `${ImitationItem.collection}/${testItem.id}`,
      testItem
    );
    itemPO.theThingPO.expectActionButton(
      ImitationItem.actions['transfer-next']
    );
  });

  it('Can not create item-transfer if not item holder', () => {
    logout();
    loginTestUser(testUser);
    itemPO.theThingPO.expectNoActionButton(
      ImitationItem.actions['transfer-next']
    );
    logout();
    loginTestUser(testHolder);
    itemPO.theThingPO.expectActionButton(
      ImitationItem.actions['transfer-next']
    );
  });

  it('Can not create item-transfer if no one in request list', () => {
    siteNavigator.gotoMyHeldItems();
    myHeldItemsPO.expectVisible();
    myHeldItemsPO.gotoItem(testItemNoRequester);
    itemPO.expectVisible();
    itemPO.theThingPO.expectNoActionButton(
      ImitationItem.actions['transfer-next']
    );
  });

  it('Create an item-transfer for first requester in request list', () => {
    siteNavigator.gotoMyHeldItems();
    myHeldItemsPO.expectVisible();
    myHeldItemsPO.gotoItem(testItem);
    itemPO.expectVisible();
    itemPO.theThingPO.runAction(ImitationItem.actions['transfer-next']);
    emceePO.confirm(`要將 ${testItem.name} 交付給 ${testRequester.name} ？`);
    itemTransferPO.expectVisible();
    itemTransferPO.expectGiver(testHolder);
    itemTransferPO.expectReceiver(testRequester);
    itemTransferPO.expectItem(testItem);
    itemTransferPO.theThingPO.setValue(testItemTransfer);
    itemTransferPO.theThingPO.save(testItemTransfer);

    emceePO.confirm(
      `確認約定時間和地點無誤，送出交付請求給 ${testRequester.name}？`
    );
    emceePO.alert(
      `已送出 ${testItem.name} 的交付要求，請等待 ${testRequester.name} 的回應`
    );
  });

  it('Item with created item-transfer task should be in state "transfer"', () => {
    itemTransferPO.gotoItem();
    itemPO.expectVisible();
    itemPO.theThingPO.expectState(ImitationItem.states.transfer);
  });

  it('Created item-transfer can be accessed from item page', () => {
    itemPO.theThingPO.expectActionButton(
      ImitationItem.actions['check-item-transfer']
    );
    itemPO.theThingPO.runAction(ImitationItem.actions['check-item-transfer']);
    itemTransferPO.expectVisible();
    itemTransferPO.theThingPO.expectValue(testItemTransfer);
    itemTransferPO.expectGiver(testHolder);
    itemTransferPO.expectReceiver(testRequester);
  });

  it('Item-transfer should now in state waitReceiver', () => {
    itemTransferPO.theThingPO.expectState(
      ImitationItemTransfer.states.waitReceiver
    );
  });

  it('Created item-transfer can be accessed in my-item-transfers page', () => {
    siteNavigator.gotoMyItemTransfers();
    myItemTransfersPO.expectVisible();
    myItemTransfersPO.expectItemTransfer(testItemTransfer);
    myItemTransfersPO.gotoItemTransfer(testItemTransfer);
    itemTransferPO.expectVisible();
    itemTransferPO.theThingPO.expectValue(testItemTransfer);
  });

  it('Send notification about item-transfer to receiver', () => {
    const notification: Notification = new Notification({
      type: ItemTransferNotificationType,
      inviterId: testHolder.id,
      email: testRequester.email,
      mailSubject: `${testHolder.name} 想要將 ${testItem.name} 交給你`,
      mailContent: `${testHolder.name} 想要將 ${testItem.name} 交給你，請點選以下網址檢視交付約定的相關訊息`,
      confirmMessage: `<h3>您將前往交付通知的頁面</h3><br><h3>請確認相關約定事項</h3>`,
      landingUrl: ``,
      data: {}
    });

    logout();
    loginTestUser(testRequester);
    accountWidgetPO.expectNotification(1);
    accountWidgetPO.clickNotification();
    myNotificationsPO.expectVisible();
    myNotificationsPO.expectUnreadNotifications([notification]);
    myNotificationsPO.clickNotification(notification);
    emceePO.confirm(
      `您將前往 ${testItem.name} 的交付任務頁面請確認相關約定事項`
    );
    itemTransferPO.expectVisible();
    itemTransferPO.theThingPO.expectValue(testItemTransfer);
  });
});
