import { Injectable, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import {
  TheThing,
  TheThingCell,
  TheThingImitation,
  TheThingRelation
} from '@ygg/the-thing/core';
import { TheThingFactoryService } from '@ygg/the-thing/ui';
import { ImitationPlay } from '@ygg/playwhat/core';
import {
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { tap, take } from 'rxjs/operators';
import { extend } from 'lodash';
import { EmceeService } from '@ygg/shared/ui/widgets';
import { AlertType } from '@ygg/shared/infra/core';
import { EquipmentFactoryService } from './equipment-factory.service';

@Injectable({
  providedIn: 'root'
})
export class PlayFactoryService implements OnDestroy, Resolve<TheThing> {
  theThing$: BehaviorSubject<TheThing> = new BehaviorSubject(null);
  theThing: TheThing;
  cacheCreated: TheThing;
  subscriptions: Subscription[] = [];

  constructor(
    private theThingFactory: TheThingFactoryService,
    private emcee: EmceeService,
    private router: Router,
    private equipmentFactory: EquipmentFactoryService
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    const id = route.paramMap.get('id');
    if (id === 'create') {
      return this.create();
    } else if (id === 'edit') {
      return this.loadTheOne();
    } else if (!!id) {
      return this.load(id);
    }
  }

  ngOnDestroy() {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  setMeta(value: { [key: string]: any }): void {
    extend(this.theThing, value);
  }

  async loadTheOne(): Promise<Observable<TheThing>> {
    if (!this.theThing) {
      this.theThing = await this.create();
    }
    this.theThing$.next(this.theThing);
    return this.theThing$;
  }

  async create(): Promise<TheThing> {
    if (!this.cacheCreated) {
      this.cacheCreated = await this.theThingFactory.create({
        imitation: ImitationPlay.id
      });
    }
    this.theThing = this.cacheCreated;
    return this.cacheCreated;
  }

  setCell(cell: TheThingCell): void {
    this.theThing.upsertCell(cell);
    this.theThing$.next(this.theThing);
  }

  async load(id: string): Promise<TheThing> {
    return this.load$(id)
      .pipe(take(1))
      .toPromise();
  }

  load$(id: string): Observable<TheThing> {
    return this.theThingFactory
      .load$(id)
      .pipe(tap(theThing => (this.theThing = theThing)));
  }

  async save() {
    const confirm = await this.emcee.confirm(
      `確定要儲存 ${this.theThing.name} ？`
    );
    if (!confirm) {
      return;
    }
    await this.theThingFactory.save(this.theThing, {
      requireOwner: true
    });
    // if (
    //   ImitationTourPlan.isState(this.theThing, ImitationTourPlan.states.new)
    // ) {
    //   const confirm = await this.emcee.confirm(`順便將遊程計畫送出申請？`);
    //   if (confirm) {
    //     this.theThing.setState(
    //       ImitationTourPlan.stateName,
    //       ImitationTourPlan.states.applied
    //     );
    //     await this.theThingFactory.save(this.theThing, {
    //       requireOwner: true
    //     });
    //   }
    // }
    await this.emcee.alert(`已成功儲存 ${this.theThing.name}`, AlertType.Info);
    // this.theThing = undefined;
    if (!!this.cacheCreated && this.theThing.id === this.cacheCreated.id) {
      this.cacheCreated = undefined;
    }
    this.router.navigate(['/', ImitationPlay.routePath, this.theThing.id]);
    return;
  }

  deleteCell(cellName: string) {
    this.theThing.deleteCell(cellName);
  }

  async createRelationObject(imitation: TheThingImitation) {
    const currentUrl = this.router.url;
    // console.log(currentUrl);
    try {
      await this.equipmentFactory.createForRelation(this.theThing, imitation);
      this.router.navigateByUrl(currentUrl);
    } catch (error) {
      console.warn(error.message);
    }
  }
}
