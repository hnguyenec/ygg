import {
  TheThing,
  TheThingFactory,
  RelationFactory,
  Relationship,
  RelationRecord
} from '@ygg/the-thing/core';
import { Router, Emcee } from '@ygg/shared/infra/core';
import { Subject, BehaviorSubject, Observable, of } from 'rxjs';
import {
  ImitationItem,
  ItemFilter,
  RelationshipBoxItem,
  RelationshipItemHolder,
  RelationshipItemRequestBorrow
} from '../models';
import { take, filter, switchMap, tap, catchError, map } from 'rxjs/operators';
import { ItemAccessor } from './item-accessor';
import { User, UserAccessor, Authenticator } from '@ygg/shared/user/core';
import { isEmpty, first } from 'lodash';

export class ItemFactory {
  // creatingPool: {
  //   [id: string]: {
  //     local$: BehaviorSubject<TheThing>;
  //     // onSave$: Subject<TheThing>;
  //   };
  // } = {};

  constructor(
    protected emcee: Emcee,
    protected router: Router,
    protected authenticator: Authenticator,
    // protected itemAccessor: ItemAccessor,
    protected theThingFactory: TheThingFactory,
    protected relationFactory: RelationFactory,
    protected userAccessor: UserAccessor
  ) {}

  async create(): Promise<TheThing> {
    try {
      const newItem = await this.theThingFactory.create({
        imitation: ImitationItem
      });
      this.router.navigate(['/', ImitationItem.routePath, newItem.id]);
      return this.theThingFactory.onSave$
        .pipe(
          filter(thing => thing.id === newItem.id),
          take(1)
        )
        .toPromise()
        .then(async (resultItem: TheThing) => {
          await this.relationFactory.create({
            subjectCollection: resultItem.collection,
            subjectId: resultItem.id,
            objectCollection: User.collection,
            objectId: resultItem.ownerId,
            objectRole: RelationshipItemHolder.role
          });
          return resultItem;
        });
    } catch (error) {
      this.emcee.error(`新增寶物失敗，錯誤原因：${error.message}`);
      return;
    }
  }

  async load(id: string): Promise<Observable<TheThing>> {
    return this.theThingFactory.load$(id, ImitationItem.collection);
  }

  getItemHolder$(itemId: string): Observable<User> {
    return this.relationFactory
      .findBySubjectAndRole$(itemId, RelationshipItemHolder.role)
      .pipe(
        // tap(relations => console.log(relations)),
        filter(relations => !isEmpty(relations)),
        switchMap((relations: RelationRecord[]) => {
          return this.userAccessor.get$(relations[0].objectId);
        })
      );
  }

  isItemHolder$(itemId: string, userId?: string): Observable<boolean> {
    let userId$: Observable<string>;
    if (userId) {
      userId$ = of(userId);
    } else {
      userId$ = this.authenticator.currentUser$.pipe(
        map(user => (!!user ? user.id : null))
      );
    }
    return userId$.pipe(
      switchMap(_userId => {
        if (_userId) {
          return this.relationFactory.hasRelation$(
            itemId,
            _userId,
            RelationshipItemHolder.role
          );
        } else {
          return of(false);
        }
      })
    );
  }

  hasRequestedBorrowItem$(
    itemId: string,
    userId?: string
  ): Observable<boolean> {
    let userId$: Observable<string>;
    if (userId) {
      userId$ = of(userId);
    } else {
      userId$ = this.authenticator.currentUser$.pipe(
        map(user => (!!user ? user.id : null))
      );
    }
    return userId$.pipe(
      switchMap(_userId => {
        if (!!_userId) {
          return this.relationFactory.hasRelation(
            itemId,
            _userId,
            RelationshipItemRequestBorrow.role
          );
        } else {
          return of(false);
        }
      })
    );
  }

  async requestBorrowItem(itemId: string) {
    let item: TheThing;
    try {
      const user: User = await this.authenticator.requestLogin();
      item = await this.theThingFactory.load(itemId, ImitationItem.collection);
      const alreadyRequested = await this.hasRequestedBorrowItem$(item.id)
        .pipe(take(1))
        .toPromise();
      if (alreadyRequested) {
        this.emcee.warning(`你已經請求索取 ${item.name} 並且正在排隊等候中`);
        return;
      }
      const IamHolder = await this.isItemHolder$(item.id)
        .pipe(take(1))
        .toPromise();
      if (IamHolder) {
        this.emcee.warning(`你是 ${item.name} 目前的保管者內...`);
        return;
      }
      const confirm = await this.emcee.confirm(
        `送出索取 ${item.name} 的請求，並且排隊等待？`
      );
      if (confirm) {
        await this.relationFactory.create({
          subjectCollection: item.collection,
          subjectId: item.id,
          objectCollection: User.collection,
          objectId: user.id,
          objectRole: RelationshipItemRequestBorrow.role
        });
        this.emcee.info(`已送出索取 ${item.name} 的請求`);
      }
    } catch (error) {
      this.emcee.error(
        `索取 ${itemId} ${item ? item.name : ''} 失敗，錯誤原因：${
          error.message
        }`
      );
    }
  }

  getItemRequestBorrowers$(itemId: string): Observable<User[]> {
    return this.relationFactory
      .findBySubjectAndRole$(itemId, RelationshipItemRequestBorrow.role)
      .pipe(
        switchMap((relations: RelationRecord[]) => {
          // Ordered by createAt
          relations.sort((ra, rb) => {
            return ra.createAt < rb.createAt ? -1 : 1;
          });
          return this.userAccessor.listByIds$(relations.map(r => r.objectId));
        }),
        catchError(error => {
          this.emcee.error(`無法載入等候索取名單，錯誤原因：${error.message}`);
          return [];
        })
      );
  }

  async cancelRequest(itemId: string) {
    let item: TheThing;
    try {
      const user = await this.authenticator.requestLogin();
      item = await this.theThingFactory.load(itemId, ImitationItem.collection);
      const hasRequested = await this.hasRequestedBorrowItem$(item.id)
        .pipe(take(1))
        .toPromise();
      if (!hasRequested) {
        this.emcee.warning(`你並沒有索取 ${item.name} 喔`);
        return;
      }
      const confirm = await this.emcee.confirm(`要取消索取 ${item.name} 嗎？`);
      if (confirm) {
        await this.relationFactory.delete(
          item.id,
          RelationshipItemRequestBorrow.role,
          user.id
        );
        this.emcee.info(`已取消索取 ${item.name}`);
      }
    } catch (error) {
      this.emcee.error(
        `取消索取 ${!!item ? item.name : itemId} 失敗，錯誤原因：${
          error.message
        }`
      );
    }
  }

  // find$(itemFilter: ItemFilter): Observable<TheThing[]> {
  //   throw new Error('Method not implemented.');
  // }

  // async save(item: TheThing) {
  //   await this.itemAccessor.save(item);
  //   if (item.id in this.creatingPool) {
  //     const onSave$ = this.creatingPool[item.id].onSave$;
  //     if (onSave$) {
  //       onSave$.next(item);
  //       onSave$.complete();
  //       delete this.creatingPool[item.id];
  //     }
  //   }
  // }
}
