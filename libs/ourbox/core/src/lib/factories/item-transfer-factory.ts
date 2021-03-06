import { Emcee, Router } from '@ygg/shared/infra/core';
import { Location } from '@ygg/shared/omni-types/core';
import {
  Authenticator,
  NotificationFactory,
  User,
  UserAccessor
} from '@ygg/shared/user/core';
import {
  RelationFactory,
  RelationRecord,
  TheThing,
  TheThingAccessor,
  TheThingFactory,
  TheThingStateChangeRecord
} from '@ygg/the-thing/core';
import { first, flatten, isEmpty, uniqBy } from 'lodash';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import {
  ImitationItem,
  ImitationItemTransfer,
  ImitationItemTransferStates,
  RelationshipItemTransferGiver,
  RelationshipItemTransferItem,
  RelationshipItemTransferReceiver
} from '../models';
import { ItemFactory } from './item-factory';

export const ItemTransferNotificationType = 'ourbox-item-transfer';

export interface ItemTransferCompleteInfo {
  newLocation: Location;
}

export abstract class ItemTransferFactory {
  subscription: Subscription = new Subscription();
  listMyItemTransfersIamGiver$: Observable<TheThing[]>;
  listMyItemTransfersIamReceiver$: Observable<TheThing[]>;
  listMyItemTransfers$: Observable<TheThing[]>;

  constructor(
    protected emcee: Emcee,
    protected router: Router,
    protected authenticator: Authenticator,
    // protected itemAccessor: ItemAccessor,
    protected itemFactory: ItemFactory,
    protected theThingAccessor: TheThingAccessor,
    protected theThingFactory: TheThingFactory,
    protected relationFactory: RelationFactory,
    protected userAccessor: UserAccessor,
    protected notificationFactory: NotificationFactory
  ) {
    this.subscription.add(
      this.theThingFactory.runAction$.subscribe(actionInfo => {
        switch (actionInfo.action.id) {
          case ImitationItem.actions['transfer-next'].id:
            this.giveAway(actionInfo.theThing.id);
            break;

          case ImitationItem.actions['check-item-transfer'].id:
            this.gotoItemTransferOfItem(actionInfo.theThing.id);
            break;

          case ImitationItemTransfer.actions['send-request'].id:
            this.sendRequest(actionInfo.theThing);
            break;

          case ImitationItemTransfer.actions['consent-reception'].id:
            this.consentReception(actionInfo.theThing);
            break;

          case ImitationItemTransfer.actions['confirm-completed'].id:
            this.completeReception(actionInfo.theThing);
            break;

          case ImitationItemTransfer.actions['cancel'].id:
            this.cancelTransfer(actionInfo.theThing.id);
            break;

          default:
            break;
        }
      })
    );

    this.listMyItemTransfersIamGiver$ = this.authenticator.currentUser$.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        } else {
          return this.relationFactory.findByObjectAndRole$(
            user.id,
            RelationshipItemTransferGiver.role
          );
        }
      }),
      switchMap((relations: RelationRecord[]) => {
        if (isEmpty(relations)) {
          return of([]);
        } else {
          const itemTransferIds: string[] = relations.map(r => r.subjectId);
          return this.theThingAccessor.listByIds$(
            itemTransferIds,
            ImitationItemTransfer.collection
          );
        }
      })
    );

    this.listMyItemTransfersIamReceiver$ = this.authenticator.currentUser$.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        } else {
          return this.relationFactory.findByObjectAndRole$(
            user.id,
            RelationshipItemTransferReceiver.role
          );
        }
      }),
      switchMap((relations: RelationRecord[]) => {
        if (isEmpty(relations)) {
          return of([]);
        } else {
          const itemTransferIds: string[] = relations.map(r => r.subjectId);
          return this.theThingAccessor.listByIds$(
            itemTransferIds,
            ImitationItemTransfer.collection
          );
        }
      })
    );

    this.listMyItemTransfers$ = combineLatest([
      this.listMyItemTransfersIamGiver$,
      this.listMyItemTransfersIamReceiver$
    ]).pipe(
      map(results => {
        return uniqBy(flatten(results), 'id');
      })
    );
  }

  abstract async inquireCompleteInfo(
    item: TheThing
  ): Promise<ItemTransferCompleteInfo>;

  async create(item: TheThing, giver: User, receiver: User): Promise<TheThing> {
    try {
      const newItemTrnasfer = await this.theThingFactory.create(
        ImitationItemTransfer
      );
      newItemTrnasfer.name = `${giver.name} 交付 ${item.name} 給 ${receiver.name} 的交付任務`;
      newItemTrnasfer.addRelation(
        RelationshipItemTransferItem.createRelation(newItemTrnasfer.id, item.id)
      );
      newItemTrnasfer.setUserOfRole(
        RelationshipItemTransferGiver.role,
        giver.id
      );
      newItemTrnasfer.setUserOfRole(
        RelationshipItemTransferReceiver.role,
        receiver.id
      );
      // console.log(`New ItemTransfer id = ${newItemTrnasfer.id}`);
      this.router.navigate([
        ImitationItemTransfer.routePath,
        newItemTrnasfer.id
      ]);
      const itemTransfer = await this.theThingFactory.onSave$
        .pipe(
          filter(thing => thing.id === newItemTrnasfer.id),
          take(1)
        )
        .toPromise();
      await this.sendRequest(itemTransfer);
    } catch (error) {
      const wrapError = new Error(
        `新增交付約定記錄失敗，錯誤原因：${error.message}`
      );
      this.emcee.error(wrapError.message);
      return Promise.reject(wrapError);
    }
  }

  async getLatestItemTransfer(item: TheThing): Promise<TheThing> {
    try {
      const relations: RelationRecord[] = await this.relationFactory
        .findByObjectAndRole$(item.id, RelationshipItemTransferItem.role)
        .pipe(take(1))
        .toPromise();
      const relationLatest: RelationRecord = RelationRecord.findLatest(
        relations
      );
      return this.theThingFactory.load(
        relationLatest.subjectId,
        relationLatest.subjectCollection
      );
    } catch (error) {
      const wrapError = new Error(
        `找不到 ${item.name} 的最新一筆交付任務，錯誤原因：\n${error.message}`
      );
      return Promise.reject(wrapError);
    }
  }

  async giveAway(itemId: string) {
    let item: TheThing;
    try {
      item = await this.theThingFactory.load(itemId, ImitationItem.collection);
      const user: User = await this.authenticator.requestLogin();
      const requestBorrowers: User[] = await this.itemFactory
        .getItemRequestBorrowers$(item.id)
        .pipe(take(1))
        .toPromise();
      if (isEmpty(requestBorrowers)) {
        throw new Error(`目前沒有人正在等候索取 ${item.name}`);
      }
      const receiver: User = first(requestBorrowers);
      const confirm = await this.emcee.confirm(
        `<h3>要將 ${item.name} 交付給 ${receiver.name} ？</h3>`
      );
      if (!confirm) {
        return Promise.resolve();
      }
      const itemTransfer = await this.create(item, user, receiver);
      await this.theThingFactory.setState(
        item,
        ImitationItem,
        ImitationItem.states.transfer
      );

      // 2020/09/14 yglin: Stay in item-transfer page
      // this.router.navigate(['/', ImitationItem.routePath, item.id]);
    } catch (error) {
      this.emcee.error(
        `<h3>建立 ${!!item ? item.name : itemId} 的交付任務失敗，錯誤原因：${
          error.message
        }</h3>`
      );
    }
  }

  async getTransferItem(itemTransferId: string): Promise<TheThing> {
    try {
      const itemTransfer = await this.theThingAccessor.load(
        itemTransferId,
        ImitationItemTransfer.collection
      );
      const itemId = first(
        itemTransfer.getRelationObjectIds(RelationshipItemTransferItem.role)
      );
      const item = await this.theThingAccessor.load(
        itemId,
        ImitationItem.collection
      );
      return item;
    } catch (error) {
      const wrapError: Error = new Error(
        `Failed to get item of item-transfer ${itemTransferId}.\n${error.message}`
      );
      return Promise.reject(wrapError);
    }
  }

  async getReceiver(itemTransferId: string): Promise<User> {
    try {
      const itemTransfer = await this.theThingAccessor.load(
        itemTransferId,
        ImitationItemTransfer.collection
      );
      const receiverId = first(
        itemTransfer.listUserIdsOfRole(RelationshipItemTransferReceiver.role)
      );
      return await this.userAccessor.get(receiverId);
    } catch (error) {
      const wrapError = new Error(
        `Can not find receiver of item-transfer: ${itemTransferId}`
      );
      return Promise.reject(wrapError);
    }
  }

  async getGiver(itemTransferId: string): Promise<User> {
    try {
      const itemTransfer = await this.theThingAccessor.load(
        itemTransferId,
        ImitationItemTransfer.collection
      );
      const giverId = first(
        itemTransfer.listUserIdsOfRole(RelationshipItemTransferGiver.role)
      );
      return await this.userAccessor.get(giverId);
    } catch (error) {
      const wrapError = new Error(
        `Can not find giver of item-transfer: ${itemTransferId}`
      );
      return Promise.reject(wrapError);
    }
  }

  async sendRequest(itemTransfer: TheThing) {
    let item: TheThing;
    let giver: User;
    let receiver: User;
    try {
      item = await this.getTransferItem(itemTransfer.id);
      giver = await this.getGiver(itemTransfer.id);
      receiver = await this.getReceiver(itemTransfer.id);
      const confirm = await this.emcee.confirm(
        `<h3>確認約定時間和地點無誤，送出交付請求給 ${receiver.name}？</h3>`
      );
      if (!confirm) {
        return;
      }
      await this.notificationFactory.create({
        type: ItemTransferNotificationType,
        inviterId: giver.id,
        inviteeId: receiver.id,
        email: receiver.email,
        mailSubject: `${giver.name} 想要將 ${item.name} 交給你`,
        mailContent: `${giver.name} 想要將 ${item.name} 交給你，請點選以下網址檢視交付約定的相關訊息`,
        confirmMessage: `<h3>您將前往 ${item.name} 的交付任務頁面</h3><br><h3>請確認相關約定事項</h3>`,
        landingUrl: `/${ImitationItemTransfer.routePath}/${itemTransfer.id}`,
        data: {}
      });
      await this.theThingFactory.setState(
        itemTransfer,
        ImitationItemTransfer,
        ImitationItemTransferStates.waitReceiver
      );
      await this.emcee.info(
        `<h3>已送出 ${item.name} 的交付要求，請等待 ${receiver.name} 的回應</h3>`
      );
    } catch (error) {
      const wrapError = new Error(
        `送出${
          giver && item && receiver
            ? ' ' +
              giver.name +
              ' => ' +
              item.name +
              ' => ' +
              receiver.name +
              ' '
            : ''
        }交付約定失敗，錯誤原因：${error.message}`
      );
      this.emcee.error(wrapError.message);
      return Promise.reject(wrapError);
    }
  }

  async consentReception(itemTransfer: TheThing) {
    let item: TheThing;
    let giver: User;
    let receiver: User;
    try {
      item = await this.getTransferItem(itemTransfer.id);
      giver = await this.getGiver(itemTransfer.id);
      receiver = await this.getReceiver(itemTransfer.id);
      const confirm = await this.emcee.confirm(
        `<h3>確定要依照約定前往收取寶物 ${item.name} 嗎？</h3>`
      );
      if (confirm) {
        await this.theThingFactory.setState(
          itemTransfer,
          ImitationItemTransfer,
          ImitationItemTransfer.states.consented
        );
        await this.notificationFactory.create({
          type: ItemTransferNotificationType,
          inviterId: receiver.id,
          inviteeId: giver.id,
          email: giver.email,
          mailSubject: `${receiver.name} 已確認要收取 ${item.name}`,
          mailContent: `${receiver.name} 已確認要收取 ${item.name}，請點選以下網址檢視交付約定的相關訊息`,
          confirmMessage: `<h3>您將前往交付通知的頁面</h3><h3>請確認相關約定事項</h3>`,
          landingUrl: `/${ImitationItemTransfer.routePath}/${itemTransfer.id}`,
          data: {}
        });
        this.emcee.info(
          `<h3>已通知 ${giver.name} ，請依照約定時間地點前往進行交付</h3>`
        );
      }
    } catch (error) {
      this.emcee.error(`確認交付失敗，錯誤原因：${error.message}`);
      return Promise.reject();
    }
  }

  async completeReception(itemTransfer: TheThing) {
    let item: TheThing;
    let giver: User;
    let receiver: User;
    try {
      item = await this.getTransferItem(itemTransfer.id);
      giver = await this.getGiver(itemTransfer.id);
      receiver = await this.getReceiver(itemTransfer.id);
      const completeInfo = await this.inquireCompleteInfo(item);
      if (completeInfo && completeInfo.newLocation) {
        await this.itemFactory.transfer(
          item,
          receiver,
          completeInfo.newLocation
        );
        await this.theThingFactory.setState(
          itemTransfer,
          ImitationItemTransfer,
          ImitationItemTransfer.states.completed
        );
        await this.notificationFactory.create({
          type: ItemTransferNotificationType,
          inviterId: receiver.id,
          inviteeId: giver.id,
          email: giver.email,
          mailSubject: `${receiver.name} 已收到 ${item.name}`,
          mailContent: `${receiver.name} 已收到 ${item.name}，請點選以下網址檢視交付記錄`,
          confirmMessage: `<h3>您將前往交付記錄頁面</h3>`,
          landingUrl: `/${ImitationItemTransfer.routePath}/${itemTransfer.id}`,
          data: {}
        });
        this.emcee.info(
          `<h3>已通知 ${giver.name}, ${item.name} 的交付任務已完成</h3>`
        );
      } else {
        throw new Error(`必須為寶物 ${item.name} 指定新的地點`);
      }
    } catch (error) {
      this.emcee.error(`確認完成失敗，錯誤原因：${error.message}`);
      return Promise.reject();
    }
  }

  async gotoItemTransferOfItem(itemId: string) {
    try {
      const item = await this.theThingFactory.load(
        itemId,
        ImitationItem.collection
      );
      const lastItemTransfer = await this.getLatestItemTransfer(item);
      this.router.navigate([
        '/',
        ImitationItemTransfer.routePath,
        lastItemTransfer.id
      ]);
    } catch (error) {
      this.emcee.error(`前往交付任務頁面失敗，錯誤原因：\n${error.message}`);
      return Promise.reject(error);
    }
  }

  async cancelTransfer(itemTransferId: string) {
    try {
      const user = await this.authenticator.requestLogin();
      const itemTransfer = await this.theThingAccessor.load(
        itemTransferId,
        ImitationItemTransfer.collection
      );
      const giver = await this.getGiver(itemTransferId);
      const receiver = await this.getReceiver(itemTransferId);
      const item = await this.getTransferItem(itemTransferId);
      const changeRecord: TheThingStateChangeRecord = await this.theThingFactory.setState(
        itemTransfer,
        ImitationItemTransfer,
        ImitationItemTransfer.states.cancelled
      );
      await this.theThingFactory.setState(
        item,
        ImitationItem,
        ImitationItem.states.available
      );

      const cancelReason =
        changeRecord && changeRecord.message ? changeRecord.message : '無';
      const mailSubject = `${item.name} 的交付任務已取消`;
      const mailContent = `<h3>${user.name} 已取消 ${item.name} 的交付任務</h3><h3>原因說明：${cancelReason}</h3><br>請點選以下網址檢視交付記錄`;
      const confirmMessage = `<h3>您將前往交付記錄頁面</h3>`;
      // Send notification to receiver
      await this.notificationFactory.create({
        type: ItemTransferNotificationType,
        inviterId: user.id,
        inviteeId: receiver.id,
        email: receiver.email,
        mailSubject,
        mailContent,
        confirmMessage,
        landingUrl: `/${ImitationItemTransfer.routePath}/${itemTransfer.id}`,
        data: {}
      });
      // Send notification to giver
      await this.notificationFactory.create({
        type: ItemTransferNotificationType,
        inviterId: user.id,
        inviteeId: giver.id,
        email: giver.email,
        mailSubject,
        mailContent,
        confirmMessage,
        landingUrl: `/${ImitationItemTransfer.routePath}/${itemTransfer.id}`,
        data: {}
      });

      this.emcee.info(
        `<h3>已取消 ${item.name} 的交付任務，並寄出通知給 ${receiver.name}，${giver.name}</h3>`
      );
    } catch (error) {
      const wrapError = new Error(
        `取消交付任務失敗，id=${itemTransferId}，錯誤原因：\n${error.message}`
      );
      this.emcee.error(wrapError.message);
      return Promise.reject(wrapError);
    }
  }
}
