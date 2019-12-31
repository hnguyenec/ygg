import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { TheThing } from '@ygg/the-thing/core';
import { TheThingAccessService } from "@ygg/the-thing/data-access";
import { take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TheThingResolver implements Resolve<TheThing> {

  constructor(private theThingAccessService: TheThingAccessService) {}

  resolve(
    route: ActivatedRouteSnapshot
  ): Observable<TheThing> | Promise<TheThing> | TheThing {
    const id = route.paramMap.get('id');
    if (id) {
      return this.theThingAccessService.get$(id).pipe(take(1));
    } else {
      return throwError(new Error(`"id" not found in url`));
    }
  }
}
