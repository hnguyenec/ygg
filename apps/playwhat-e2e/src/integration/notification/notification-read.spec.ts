import { theMockDatabase } from '@ygg/shared/test/cypress';
import { EmceePageObjectCypress } from '@ygg/shared/ui/test';
import { Notification, User } from '@ygg/shared/user/core';
import {
  AccountWidgetPageObjectCypress,
  loginTestUser,
  MyNotificationListPageObjectCypress,
  testUsers
} from '@ygg/shared/user/test';
import { beforeAll } from '../../support/before-all';

describe('Read new unread notifications', () => {
  const accountWidgetPO = new AccountWidgetPageObjectCypress();
  const myNotificationsPO = new MyNotificationListPageObjectCypress();
  const notifications: Notification[] = [];
  const countNotifications = 5;
  const countUnreadNotifications = 2;

  for (let index = 0; index < countNotifications; index++) {
    const ntf = Notification.forge();
    if (index >= countUnreadNotifications) {
      ntf.read = true;
    }
    notifications.push(ntf);
  }
  const unreadNotifications: Notification[] = notifications.slice(
    0,
    countUnreadNotifications
  );
  const me: User = testUsers[0];

  before(() => {
    beforeAll();
    notifications.forEach(ntf => {
      ntf.inviterId = me.id;
      ntf.inviteeId = me.id;
    });
    cy.wrap(notifications).each((ntf: Notification) => {
      theMockDatabase.insert(`${Notification.collection}/${ntf.id}`, ntf);
    });
    cy.visit('/');
    loginTestUser(me);
  });

  after(() => {
    theMockDatabase.clear();
  });

  it('Should show number of unread notifications in account-widget', () => {
    // cy.pause();
    accountWidgetPO.expectNotification(countUnreadNotifications);
  });

  it('Click on number redirect to notifications page', () => {
    accountWidgetPO.clickNotification();
    myNotificationsPO.expectVisible();
    myNotificationsPO.expectUnreadNotifications(
      notifications.slice(0, countUnreadNotifications)
    );
    myNotificationsPO.expectReadNotifications(
      notifications.slice(countUnreadNotifications, countNotifications)
    );
  });

  it('Click on notification to its view, and decrement number of unread notifications', () => {
    myNotificationsPO.clickNotification(unreadNotifications[0]);
    const emcee = new EmceePageObjectCypress();
    emcee.confirm(unreadNotifications[0].confirmMessage);
    // notificationPO.expectVisible();
    // notificationPO.expectValue(unreadNotifications[0]);
    accountWidgetPO.expectNotification(countUnreadNotifications - 1);
  });

  it('Hide number of unread notifications if none', () => {
    cy.wrap(unreadNotifications.slice(1)).each((ntf: Notification) => {
      accountWidgetPO.clickNotification();
      myNotificationsPO.clickNotification(ntf);
      const emcee = new EmceePageObjectCypress();
      emcee.confirm(ntf.confirmMessage);
    });
    accountWidgetPO.expectNotificationHidden();
  });
});
