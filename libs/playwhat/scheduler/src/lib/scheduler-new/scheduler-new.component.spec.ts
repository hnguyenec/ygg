import { MockComponent } from 'ng-mocks';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedulerNewComponent } from './scheduler-new.component';
import { SchedulePlanComponent } from '../schedule-plan';
import { DebugElement, Injectable } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';

describe('SchedulerNewComponent', () => {
  let component: SchedulerNewComponent;
  let fixture: ComponentFixture<SchedulerNewComponent>;

  @Injectable()
  class MockRouter {
    navigate() {}
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SchedulerNewComponent,
        MockComponent(SchedulePlanComponent)
      ],
      providers: [{ provide: Router, useClass: MockRouter }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchedulerNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show schedule-plan', () => {
    const debugElement: DebugElement = fixture.debugElement;
    expect(debugElement.query(By.css('ygg-schedule-plan'))).toBeDefined();
  });
});
