import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Resolve,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { BoxFactory, ItemFilter } from '@ygg/ourbox/core';
import { EmceeService } from '@ygg/shared/ui/widgets';
import {
  AuthenticateUiService,
  InvitationFactoryService,
  UserService
} from '@ygg/shared/user/ui';
import { TheThing } from '@ygg/the-thing/core';
import { RelationFactoryService } from '@ygg/the-thing/ui';
import { Observable } from 'rxjs';
import { BoxAccessService } from './box-access.service';
import { ItemAccessService } from './item-access.service';
import { ItemFactoryService } from './item-factory.service';

@Injectable({
  providedIn: 'root'
})
export class BoxFactoryService extends BoxFactory implements Resolve<TheThing> {
  findItemsOnMap(filter: ItemFilter): any {
    throw new Error('Method not implemented.');
  }
  constructor(
    authenticator: AuthenticateUiService,
    emcee: EmceeService,
    invitationFactory: InvitationFactoryService,
    userAccessor: UserService,
    BoxAccessor: BoxAccessService,
    relationFactory: RelationFactoryService,
    router: Router,
    itemFactory: ItemFactoryService,
    itemAccessor: ItemAccessService
  ) {
    super(
      authenticator,
      emcee,
      invitationFactory,
      userAccessor,
      BoxAccessor,
      relationFactory,
      router,
      itemFactory,
      itemAccessor
    );
  }

  async resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<TheThing> {
    const id = route.paramMap.get('id');
    try {
      await this.authenticator.requestLogin();
      const box = await this.boxAccessor.load(id);
      if (!box) {
        throw new Error(`找不到寶箱，id: ${id}`);
      }
      const meMember = await this.isMember(id);
      if (!meMember) {
        throw new Error(`非寶箱成員無法檢視寶箱 ${box.name} 的內容`);
      }
      return box;
    } catch (error) {
      await this.emcee.error(`頁面載入失敗，錯誤原因：${error.message}`);
      this.router.navigate(['/']);
      return;
    }
  }
}