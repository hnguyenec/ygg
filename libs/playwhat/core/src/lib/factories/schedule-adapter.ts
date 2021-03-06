import {
  Schedule,
  Service,
  ServiceAvailablility,
  ServiceEvent
} from '@ygg/schedule/core';
import {
  BusinessHours,
  DateRange,
  OmniTypes,
  TimeLength,
  TimeRange
} from '@ygg/shared/omni-types/core';
import { RelationPurchase, ShoppingCellDefines } from '@ygg/shopping/core';
import {
  RelationFactory,
  RelationRecord,
  TheThing,
  TheThingAccessor,
  TheThingFilter,
  TheThingRelation
} from '@ygg/the-thing/core';
import { find, isEmpty } from 'lodash';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import {
  ImitationEvent,
  ImitationEventCellDefines,
  ImitationPlay,
  ImitationPlayCellDefines,
  ImitationTourPlan,
  ImitationTourPlanCellDefines,
  RelationshipEventService,
  RelationshipScheduleEvent
} from '../imitations';
import { EventFactory } from './event-factory';

export class ScheduleAdapter {
  // static deriveEventFromServiceEvent(serviceEvent: ServiceEvent): TheThing {
  //   const event = ImitationEvent.createTheThing();
  //   event.id = serviceEvent.id;
  //   event.name = serviceEvent.service.name;
  //   event.image = serviceEvent.service.image;
  //   event.setCellValue(
  //     ImitationEventCellDefines.timeRange.id,
  //     serviceEvent.timeRange
  //   );
  //   event.setCellValue(
  //     ImitationEventCellDefines.numParticipants.id,
  //     serviceEvent.numParticipants
  //   );
  //   event.addRelation(
  //     RelationshipEventService.createRelation(event.id, serviceEvent.service.id)
  //   );
  //   // console.log('deriveEventFromServiceEvent');
  //   // console.log(event);
  //   return event;
  // }

  static fromTheThingEventToServiceEvent(
    tEvent: TheThing,
    play: TheThing
  ): ServiceEvent {
    const sEvent = new ServiceEvent(
      ScheduleAdapter.deduceServiceFromPlay(play),
      {
        id: tEvent.id,
        numParticipants: tEvent.getCellValue(
          ImitationEventCellDefines.numParticipants.id
        )
      }
    );
    const timeRange: TimeRange = tEvent.getCellValue(
      ImitationEventCellDefines.timeRange.id
    );
    if (timeRange) {
      sEvent.setTimeRange(timeRange.start, timeRange.end);
    }
    return sEvent;
  }

  static deduceServiceFromPlay(play: TheThing): Service {
    const service = new Service();
    service.id = play.id;
    service.image = play.image;
    service.name = play.name;
    service.timeLength = (play.getCellValue(
      ImitationPlayCellDefines.timeLength.id
    ) as TimeLength).getLength();
    service.minParticipants = play.getCellValue(
      ImitationPlayCellDefines.minimum.id
    );
    service.maxParticipants = play.getCellValue(
      ImitationPlayCellDefines.maximum.id
    );
    service.location = play.getCellValue(ImitationPlayCellDefines.location.id);
    service.businessHours = play.getCellValue(
      ImitationPlayCellDefines.businessHours.id
    );
    return service;
  }

  constructor(
    protected eventFactory: EventFactory,
    protected theThingAccessor: TheThingAccessor,
    protected relationFactory: RelationFactory
  ) {}

  async fromTourPlanToSchedule(tourPlan: TheThing, tServices: TheThing[], tEvents: TheThing[]): Promise<Schedule> {
    try {
      if (!ImitationTourPlan.isValid(tourPlan)) {
        throw new Error(`Not a valid tour plan: ${JSON.stringify(tourPlan)}`);
      }

      // console.log(tEvents);
      // console.log(tEvents);

      const dateRange: DateRange = tourPlan.getCellValue(
        ImitationTourPlanCellDefines.dateRange.id
      );
      const schedule = new Schedule(dateRange.toTimeRange(), {
        dayTimeRange: tourPlan.getCellValue(
          ImitationTourPlanCellDefines.dayTimeRange.id
        )
      });
      for (const tEvent of tEvents) {
        const tService: TheThing = find(tServices, p =>
          tEvent.hasRelationTo(RelationshipEventService.name, p.id)
        );
        const sEvent: ServiceEvent = await ScheduleAdapter.fromTheThingEventToServiceEvent(
          tEvent,
          tService
        );
        schedule.addEvent(sEvent);
        if (!(tService.id in schedule.serviceAvailabilities$)) {
          schedule.serviceAvailabilities$[
            tService.id
          ] = this.deduceServiceAvailability$(
            tService.id,
            schedule.timeRange,
            tService.getCellValue(ImitationPlayCellDefines.maximum.id),
            tService.getCellValue(ImitationPlayCellDefines.businessHours.id)
          );
        }
      }
      // console.log(schedule.events);
      // for (const purchase of purchaseRelations) {
      //   const play = await this.theThingAccessor.load(purchase.objectId);
      //   if (ImitationPlay.isValid(play)) {
      //     const service = ScheduleAdapter.deduceServiceFromPlay(play);
      //     const event = new ServiceEvent(service, {
      //       numParticipants: purchase.getCellValue(
      //         ShoppingCellDefines.quantity.id
      //       )
      //     });
      //     if (event) {
      //       schedule.addEvent(event);
      //     }
      //     if (!(play.id in schedule.serviceAvailabilities$)) {
      //       schedule.serviceAvailabilities$[
      //         play.id
      //       ] = this.deduceServiceAvailability$(
      //         play.id,
      //         schedule.timeRange,
      //         play.getCellValue(ImitationPlayCellDefines.maximum.id),
      //         play.getCellValue(ImitationPlayCellDefines.businessHours.id)
      //       );
      //     }
      //   }
      // }
      return schedule;
    } catch (error) {
      const wrapError = new Error(
        `Failed to convert tour-plan to schedule.\n${error.message}`
      );
      throw wrapError;
    }
  }

  async deduceEventFromPurchase(
    purchase: TheThingRelation
  ): Promise<ServiceEvent> {
    const play = await this.theThingAccessor.load(purchase.objectId);
    if (!ImitationPlay.isValid(play)) {
      return null;
    }
    const service = ScheduleAdapter.deduceServiceFromPlay(play);
    const event = new ServiceEvent(service, {
      numParticipants: purchase.getCellValue(ShoppingCellDefines.quantity.id)
    });
    return event;
  }

  async deriveEventsFromSchedule(schedule: Schedule): Promise<TheThing[]> {
    const events: TheThing[] = [];
    for (const serviceEvent of schedule.events) {
      const play: TheThing = await this.theThingAccessor.load(
        serviceEvent.service.id
      );
      const event: TheThing = ImitationEvent.createTheThing(play);
      // console.dir(event);
      event.name = play.name;
      event.setCellValue(
        ImitationEventCellDefines.timeRange.id,
        serviceEvent.timeRange
      );
      event.setCellValue(
        ImitationEventCellDefines.numParticipants.id,
        serviceEvent.numParticipants
      );
      event.addRelation(
        RelationshipEventService.createRelation(event.id, play.id)
      );
      events.push(event);
    }
    return events;
  }

  deduceServiceAvailability$(
    serviceId: string,
    timeRange: TimeRange,
    capacity: number,
    businessHours?: BusinessHours
  ): Observable<ServiceAvailablility> {
    return this.relationFactory
      .findByObjectAndRole$(serviceId, RelationshipEventService.name)
      .pipe(
        switchMap((relations: RelationRecord[]) => {
          if (isEmpty(relations)) {
            return of([]);
          } else {
            const eventFilter: TheThingFilter = ImitationEvent.filter;
            eventFilter.addState(
              ImitationEvent.stateName,
              ImitationEvent.states['host-approved'].value
            );
            eventFilter.ids = relations.map(r => r.subjectId);
            eventFilter.addCellFilter(
              ImitationEventCellDefines.timeRange.id,
              OmniTypes['time-range'].matchers.in,
              timeRange
            );
            return this.theThingAccessor.listByFilter$(
              eventFilter,
              ImitationEvent.collection
            );
          }
        }),
        map((events: TheThing[]) => {
          const serviceAvailablility = new ServiceAvailablility(serviceId, {
            timeRange,
            capacity
          });
          if (businessHours) {
            serviceAvailablility.mergeBusinessHours(businessHours);
          }
          for (const event of events) {
            serviceAvailablility.addOccupancy(
              event.getCellValue(ImitationEventCellDefines.timeRange.id),
              event.getCellValue(ImitationEventCellDefines.numParticipants.id)
            );
          }
          return serviceAvailablility;
        }),
        catchError(error => {
          console.error(error);
          return throwError(
            new Error(
              `Failed to deduce service availability from service ${serviceId}\n ${error.message}`
            )
          );
        })
      );
  }

  // async attachScheduleWithTourPlan(tourPlan: TheThing, schedule: Schedule) {
  //   const relations: TheThingRelation[] = [];
  //   const events = this.deriveEventsFromSchedule(schedule);
  //   for (const serviceEvent of schedule.events) {
  //     const event = ScheduleAdapter.deriveEventFromServiceEvent(serviceEvent);
  //     events.push(event);
  //     await this.theThingAccessor.save(event);
  //     const relation = RelationshipScheduleEvent.createRelation(
  //       tourPlan.id,
  //       event.id
  //     );
  //     relations.push(relation);
  //   }
  //   tourPlan.setRelation(RelationshipScheduleEvent.name, relations);
  // }
}
