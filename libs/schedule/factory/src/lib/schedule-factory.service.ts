import { Injectable } from '@angular/core';
import { SchedulePlan } from '@ygg/schedule/core';
import { Schedule } from '../../../core/src/lib/schedule/schedule';

@Injectable({
  providedIn: 'root'
})
export class ScheduleFactoryService {

  constructor() { }

  async createSchedule(schedulePlan: SchedulePlan): Promise<Schedule> {
    // TODO: implement
    return new Schedule();
  }
}