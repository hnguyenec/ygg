import {
  CellDefinesTourPlan,
  ImitationTourPlan,
  ScheduleAdapter,
  ImitationTourPlanCellDefines,
  ImitationEvent,
  ImitationEventCellDefines,
  RelationshipEventService
} from '@ygg/playwhat/core';
import { SiteNavigator, TourPlanPageObjectCypress } from '@ygg/playwhat/test';
import { SchedulePageObjectCypress } from '@ygg/schedule/test';
import { login, theMockDatabase } from '@ygg/shared/test/cypress';
import { waitForLogin } from '@ygg/shared/user/test';
import { TheThing } from '@ygg/the-thing/core';
import { MyThingsDataTablePageObjectCypress } from '@ygg/the-thing/test';
import { SampleEquipments, SamplePlays } from '../play/sample-plays';
import {
  ScheduleTrivial,
  TourPlanUnscheduled,
  ScheduledEvents,
  RelationPlayOfEvents
} from './sample-schedules';
import { find } from 'lodash';
import { TimeRange } from '@ygg/shared/omni-types/core';
import { ServiceEvent } from '@ygg/schedule/core';

describe('Create/Attach schedule data from/to tour-plan', () => {
  const siteNavigator = new SiteNavigator();
  const SampleThings = SamplePlays.concat(SampleEquipments).concat([
    TourPlanUnscheduled
  ]);
  const tourPlanPO = new TourPlanPageObjectCypress();
  const myTourPlansPO = new MyThingsDataTablePageObjectCypress(
    '',
    ImitationTourPlan
  );
  // Only tour-plans of state applied can make schedule
  ImitationTourPlan.setState(
    TourPlanUnscheduled,
    ImitationTourPlan.states.applied
  );
  const schedulePO = new SchedulePageObjectCypress('', {
    dateRange: TourPlanUnscheduled.getCellValue(
      ImitationTourPlanCellDefines.dateRange.id
    ),
    dayTimeRange: TourPlanUnscheduled.getCellValue(
      ImitationTourPlanCellDefines.dayTimeRange.id
    )
  });

  const movedEvent01: TheThing = ScheduledEvents[0].clone();
  const movedTimeRange01: TimeRange = (movedEvent01.getCellValue(
    ImitationEventCellDefines.timeRange.id
  ) as TimeRange).clone();
  movedTimeRange01.move(150, 'minute');
  movedEvent01.setCellValue(
    ImitationEventCellDefines.timeRange.id,
    movedTimeRange01
  );

  const movedEvent02: TheThing = ScheduledEvents[1].clone();
  const movedTimeRange02: TimeRange = (movedEvent02.getCellValue(
    ImitationEventCellDefines.timeRange.id
  ) as TimeRange).clone();
  movedTimeRange02.move(210, 'minute');
  movedEvent02.setCellValue(
    ImitationEventCellDefines.timeRange.id,
    movedTimeRange02
  );

  // const scheduleEvents: TheThing[] = ScheduleTrivial.events.map(se => {
  //   const play: TheThing = find(SamplePlays, p => p.id === se.service.id);
  //   const event = ImitationEvent.createTheThing(play);
  //   event.setCellValue(
  //     ImitationEventCellDefines.timeRange.id,
  //     se.timeRange
  //   );
  //   event.setCellValue(
  //     ImitationEventCellDefines.numParticipants.id,
  //     se.numParticipants
  //   );
  //   return event;
  // });

  before(() => {
    login().then(user => {
      // Only Admin user can make schedule
      theMockDatabase.setAdmins([user.id]);
      cy.wrap(SampleThings).each((thing: any) => {
        thing.ownerId = user.id;
        theMockDatabase.insert(`${thing.collection}/${thing.id}`, thing);
      });
      cy.visit('/');
      waitForLogin();
    });
  });

  after(() => {
    // // Goto my-things page and delete previously created things
    // const myThingsPO = new MyThingsPageObjectCypress();
    // siteNavigator.goto(['the-things', 'my'], myThingsPO);
    // cy.wait(3000);
    // myThingsPO.deleteAll();
    theMockDatabase.clear();
  });

  it('Apply date-range from tour-plan', () => {
    siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
    myTourPlansPO.theThingDataTablePO.gotoTheThingView(TourPlanUnscheduled);
    tourPlanPO.expectVisible();
    tourPlanPO.theThingPO.runAction(ImitationTourPlan.actions['schedule']);
    schedulePO.expectVisible();
    schedulePO.expectDateRange(
      TourPlanUnscheduled.getCellValue(CellDefinesTourPlan.dateRange.id)
    );
  });

  it('Apply day-time-range from tour-plan', () => {
    const dayTimeRange = TourPlanUnscheduled.getCellValue(
      CellDefinesTourPlan.dayTimeRange.id
    );
    schedulePO.expectDayTimeRange(dayTimeRange);
  });

  it('Expect events in event pool', () => {
    cy.wrap(ScheduleTrivial.events).each((event: ServiceEvent) => {
      schedulePO.expectEventInPool(event);
    });
  });

  it('Cancel and back to tour-plans', () => {
    schedulePO.cancel();
    tourPlanPO.expectVisible();
    tourPlanPO.expectNoSchedule();
  });

  it('Create a trivial schedule from tour-plan', () => {
    tourPlanPO.theThingPO.runAction(ImitationTourPlan.actions['schedule']);
    schedulePO.expectVisible();
    cy.wrap(ScheduledEvents).each((tEvent: TheThing) => {
      schedulePO.moveEvent(
        tEvent.name,
        (tEvent.getCellValue(
          ImitationEventCellDefines.timeRange.id
        ) as TimeRange).start
      );
    });
    schedulePO.submit();
    cy.wait(30000);
    tourPlanPO.expectVisible();
    tourPlanPO.expectEvents(ScheduledEvents);
  });

  it('Schedule saved for tour-plan', () => {
    siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
    myTourPlansPO.theThingDataTablePO.gotoTheThingView(TourPlanUnscheduled);
    tourPlanPO.expectVisible();
    tourPlanPO.expectEvents(ScheduledEvents);
  });

  it('Edit exist schedule events', () => {
    tourPlanPO.theThingPO.runAction(ImitationTourPlan.actions['schedule']);
    schedulePO.expectVisible();
    schedulePO.expectEvents(
      ScheduledEvents.map(tEvent => {
        const tPlay = find(SamplePlays, p =>
          tEvent.hasRelationTo(RelationshipEventService.name, p.id)
        );
        return ScheduleAdapter.fromTheThingEventToServiceEvent(tEvent, tPlay);
      }),
      ScheduleTrivial
    );
    const movedPlay01 = find(SamplePlays, p =>
      movedEvent01.hasRelationTo(RelationshipEventService.name, p.id)
    );
    schedulePO.moveEvent(
      ScheduleAdapter.fromTheThingEventToServiceEvent(movedEvent01, movedPlay01)
        .name,
      movedTimeRange01.start
    );
    const movedPlay02 = find(SamplePlays, p =>
      movedEvent02.hasRelationTo(RelationshipEventService.name, p.id)
    );
    schedulePO.moveEvent(
      ScheduleAdapter.fromTheThingEventToServiceEvent(movedEvent02, movedPlay02)
        .name,
      movedTimeRange02.start
    );
    schedulePO.submit();
    cy.wait(30000);
    tourPlanPO.expectVisible();
    tourPlanPO.expectEvent(movedEvent01);
    siteNavigator.goto(['tour-plans', 'my'], myTourPlansPO);
    myTourPlansPO.theThingDataTablePO.gotoTheThingView(TourPlanUnscheduled);
    tourPlanPO.expectVisible();
    tourPlanPO.expectEvent(movedEvent01);
    tourPlanPO.expectEvent(movedEvent02);
  });
});
