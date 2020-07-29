import {
  DataAccessor,
  Dialog,
  Emcee,
  generateID,
  Router,
  Query
} from '@ygg/shared/infra/core';
import { isEmpty } from 'lodash';
import * as moment from 'moment';
import { Subject, Observable, of } from 'rxjs';
import { Notification } from './notification';
import { Authenticator } from '../authenticator';
import { config } from '../config';
import { User } from '../user';
import { UserAccessor } from '../user-accessor';
import { NotificationAccessor } from './notification-accessor';
import { map, switchMap } from 'rxjs/operators';

export abstract class NotificationFactory {
  constructor(
    protected userAccessor: UserAccessor,
    protected dataAccessor: DataAccessor,
    protected authenticator: Authenticator,
    protected emcee: Emcee,
    protected notificationAccessor: NotificationAccessor,
    protected dialog: Dialog,
    protected router: Router,
    protected mailListControlComponent: any
  ) {}

  confirm$: Subject<Notification> = new Subject();

  async create(options: {
    type: string;
    inviterId: string;
    email: string;
    mailSubject?: string;
    mailContent: string;
    confirmMessage: string;
    landingUrl?: string;
    data: any;
  }): Promise<Notification> {
    const id = generateID();
    const notificationLink = `${location.origin}/notifications/${id}`;
    const mailSubject =
      options.mailSubject || `來自 ${location.hostname} 的通知`;
    const mailContent = `
      <h3>來自 ${location.hostname} 的通知，此為系統自動寄發，請勿回覆</h3>
      <br>
      ${options.mailContent}
      <br><br>
      <h3>點擊以下網址繼續：</h3>
      <br>
      <a href="${notificationLink}">${notificationLink}</a>
    `;
    const notification: Notification = new Notification({
      id,
      type: options.type,
      inviterId: options.inviterId,
      email: options.email,
      mailSubject,
      mailContent,
      confirmMessage: options.confirmMessage,
      landingUrl: options.landingUrl,
      data: options.data
    });
    await this.notificationAccessor.save(notification);
    return notification;
  }

  async confirm(id: string): Promise<Notification> {
    try {
      if (!id) {
        throw new Error(`錯誤的id: ${id}`);
      }

      const notification: Notification = await this.notificationAccessor.load(
        id
      );
      if (!notification) {
        throw new Error(`遺失通知資料，id: ${id}`);
      }
      console.log(notification);

      const inviter: User = await this.userAccessor.get(notification.inviterId);
      if (!inviter) {
        throw new Error(`找不到通知者，id: ${notification.inviterId}`);
      }

      const now = new Date();
      if (now > notification.expireDate) {
        throw new Error(
          `抱歉，已超過通知有效期限：${config.notification.expireDays}天，請${inviter.name}再送出通知一次`
        );
      }

      const currentUser = await this.authenticator.requestLogin();

      const confirm = await this.emcee.confirm(notification.confirmMessage);
      if (confirm) {
        notification.inviteeId = currentUser.id;
        this.confirm$.next(notification);
        await this.markAsRead(notification);
        // this.dataAccessor.delete(config.notification.collection, notification.id);
      }

      if (notification.landingUrl) {
        this.router.navigateByUrl(notification.landingUrl);
      }

      return notification;
    } catch (error) {
      this.emcee.error(`確認通知失敗，錯誤原因：${error.message}`);
      return null;
    }
  }

  async markAsRead(notification: Notification) {
    try {
      return this.notificationAccessor.update(notification.id, { read: true });
    } catch (error) {
      throw new Error(
        `Failed to mark notifiction ${notification.id} as read, ${error.message}`
      );
    }
  }

  getUnreadNotifications$(inviteeId?: string): Observable<Notification[]> {
    let inviteeId$: Observable<string>;
    if (inviteeId) {
      inviteeId$ = of(inviteeId);
    } else {
      inviteeId$ = this.authenticator.currentUser$.pipe(
        map(user => (user ? user.id : null))
      );
    }
    return inviteeId$.pipe(
      switchMap(userId => {
        if (!userId) {
          return of([]);
        } else {
          const queries = [
            new Query('inviteeId', '==', userId),
            new Query('read', '==', false)
          ];
          return this.notificationAccessor.find$(queries);
        }
      })
    );
  }

  getReadNotifications$(inviteeId?: string): Observable<Notification[]> {
    let inviteeId$: Observable<string>;
    if (inviteeId) {
      inviteeId$ = of(inviteeId);
    } else {
      inviteeId$ = this.authenticator.currentUser$.pipe(
        map(user => (user ? user.id : null))
      );
    }
    return inviteeId$.pipe(
      switchMap(userId => {
        if (!userId) {
          return of([]);
        } else {
          const queries = [
            new Query('inviteeId', '==', userId),
            new Query('read', '==', true)
          ];
          return this.notificationAccessor.find$(queries);
        }
      })
    );
  }

  async inquireEmails(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const dialogRef = this.dialog.open(this.mailListControlComponent, {
        title: '新增通知Email'
      });
      dialogRef.afterClosed().subscribe(
        emails => {
          if (!isEmpty(emails)) {
            resolve(emails);
          } else {
            resolve([]);
          }
        },
        error => reject(error)
      );
    });
  }
}