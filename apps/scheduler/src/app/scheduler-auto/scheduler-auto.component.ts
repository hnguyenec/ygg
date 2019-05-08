import {Component, Input, Output, OnDestroy, OnInit, EventEmitter} from '@angular/core';
import {Resource, ResourceService} from '@ygg/shared/domain/resource';
import {Schedule, ScheduleForm, ScheduleService} from '@ygg/shared/domain/schedule';
import {ProgressSpinnerService} from '@ygg/shared/ui/widgets';
import {isArray, isEmpty} from 'lodash';
import {BehaviorSubject, from, merge, Observable, Subject, Subscription} from 'rxjs';
import {debounceTime, finalize, switchMap} from 'rxjs/operators';
import { MatTabChangeEvent } from '@angular/material';

@Component({
  selector: 'ygg-scheduler-auto',
  templateUrl: './scheduler-auto.component.html',
  styleUrls: ['./scheduler-auto.component.css']
})
export class SchedulerAutoComponent implements OnInit, OnDestroy {
  @Input() scheduleForm$: Observable<ScheduleForm>;
  scheduleForm: ScheduleForm;
  @Input() resourceIds$: Observable<string[]>;
  resources: Resource[];
  hasResourcesSelected: boolean;
  canAutoSchedule: boolean;
  autoSchedule$: Subject<boolean>;
  subscription: Subscription;
  resultSchedules: Schedule[];
  @Output() selectSchedule: EventEmitter<Schedule>;

  constructor(
      private resourceService: ResourceService,
      private scheduleService: ScheduleService,
      private progressSpinnerService: ProgressSpinnerService) {
    this.resultSchedules = [];
    this.resources = [];
    this.hasResourcesSelected = false;
    this.canAutoSchedule = false;
    this.autoSchedule$ = new Subject();
    this.selectSchedule = new EventEmitter();
    // this.autoSchedule$.pipe(
    //   debounceTime(500),
    //   switchMap(() => this.resources$),
    //   switchMap(resources =>
    //   from(this.scheduleService.autoSchedule(resources, this.scheduleForm)))
    //   ).subscribe(schedule => {
    //     this.resultSchedules = [schedule];
    //   });
  }

  ngOnInit() {
    if (this.scheduleForm$ && this.resourceIds$) {
      this.subscription =
          merge(
              this.scheduleForm$,
              this.resourceIds$.pipe(switchMap(
                  resourceIds => this.resourceService.getByIds$(resourceIds))),
              this.autoSchedule$.pipe(debounceTime(500)))
              .subscribe(value => {
                if (value === true) {
                  this.startAutoScheudle();
                } else {
                  if (ScheduleForm.isScheduleForm(value)) {
                    this.scheduleForm = value;
                  } else if (isArray(value)){
                    this.resources = value;
                  }
                  // console.log('value is ...');
                  // console.log(value);
                  // console.log('this.resources are ...');
                  // console.log(this.resources);
                  this.resultSchedules = [];
                  this.canAutoSchedule =
                      this.scheduleForm && !isEmpty(this.resources);
                  this.hasResourcesSelected = !isEmpty(this.resources);
                }
              })
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  startAutoScheudle() {
    this.progressSpinnerService.show();
    this.canAutoSchedule = false;
    this.resultSchedules = [];
    this.scheduleService.autoSchedule(this.resources, this.scheduleForm)
        .pipe(finalize(() => {
          this.progressSpinnerService.hide();
          this.canAutoSchedule = true;
        }))
        .subscribe(schedule => {
          this.resultSchedules.push(schedule);
          // // Auto select the first one
          // if (this.resultSchedules.length === 1) {
          //   this.selectSchedule.emit(this.resultSchedules[0]);
          // }
        });
  }

  onClickAutoSchedule() {
    this.autoSchedule$.next(true);
  }

  onTabChange(change: MatTabChangeEvent) {
    const index = change.index;
    console.log(this.resultSchedules[index]);
    this.selectSchedule.emit(this.resultSchedules[index]);
  }
}