import { Injectable } from '@angular/core';
import { CanActivateChild, CanActivate } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticateService } from '../authenticate.service';
import { YggDialogService } from '@ygg/shared/ui/widgets';
import { tap, map, take } from 'rxjs/operators';
import { User } from "@ygg/shared/user/core";
import { LoginDialogComponent } from '../components/login-dialog/login-dialog.component';
import { AuthenticateUiService } from '../authenticate-ui.service';

@Injectable({
  providedIn: 'root'
})
export class LoggedInGuard implements CanActivate, CanActivateChild {
  constructor(
    private authenticateService: AuthenticateService,
    private authenticateUiService: AuthenticateUiService
  ) {}

  canActivate(): Promise<boolean> {
    return this.checkLoggedIn();
  }

  canActivateChild(): Promise<boolean> {
    return this.checkLoggedIn();
  }

  async checkLoggedIn(): Promise<boolean> {
    const isLoggedIn = await this.authenticateService.currentUser$
      .pipe(
        take(1),
        map(currentUser => User.isUser(currentUser))
      )
      .toPromise();

    if (!isLoggedIn) {
      alert('請先登入才能繼續喔');
      const user = await this.authenticateUiService.openLoginDialog();
      return User.isUser(user);
    } else {
      return true;
    }
  }
}
