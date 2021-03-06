import { values } from 'lodash';
import { UserMenuItem } from './user-menu';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthenticateService } from '../../authenticate.service';
import { Page } from '@ygg/shared/ui/core';

@Injectable({
  providedIn: 'root'
})
export class UserMenuService {
  menuItems: { [id: string]: UserMenuItem };
  menuItems$: BehaviorSubject<UserMenuItem[]>;

  constructor(private authenticateService: AuthenticateService) {
    this.menuItems = {};
    this.menuItems$ = new BehaviorSubject(values(this.menuItems));
    // this.authenticateService.currentUser$.subscribe(user => {
    //   if (user && user.id) {
    //     this.addItem({
    //       id: 'profile',
    //       icon: 'account_box',
    //       label: '個人資料',
    //       link: 'users/me'
    //     });
    //   }
    // });
  }

  addItem(menuItem: UserMenuItem) {
    this.menuItems[menuItem.id] = menuItem;
    this.menuItems$.next(values(this.menuItems));
  }

  removeItem(menuItemId: string) {
    if (menuItemId in this.menuItems) {
      delete this.menuItems[menuItemId];
      this.menuItems$.next(values(this.menuItems));
    }
  }
}
