import { PageObject } from '@ygg/shared/test/page-object';
import { ScheduleForm, TranspotationTypes } from '@ygg/playwhat/scheduler';
import { DateRange, NumberRange, Contact } from '@ygg/shared/types';
import { DateRange as DateRangePageObjects } from '../shared-types';
import { NumberRangeViewPageObjectCypress } from '../shared-types/number-range';
import { ContactViewPageObjectCypress } from '../shared-types/contact';
import { TagsViewPageObjectCypress } from '../tags';
import { Tags } from '@ygg/tags/core';

export abstract class ScheduleFormViewPageObject extends PageObject {
  selectors = {
    main: '.ygg-schedule-form-view',
    dateRange: '.date-range',
    numParticipants: '.numberPeople .numParticipants',
    numElders: '.numberPeople .numElders',
    numKids: '.numberPeople .numKids',
    totalBudget: '.budget .total-budget',
    singleBudget: '.budget .single-budget',
    groupName: '.contacts .group-name',
    contacts: '.contacts',
    transpotation: '.transpotation .transpotation-type',
    transpotationHelp: '.transpotation .transpotation-help',
    accommodationHelp: '.miscellaneous .accommodation-help',
    likesTags: '.likes .tags',
    likesDescription: '.likes .description'
  };

  getSelectorForContactAt(index: number): string {
    return `${this.getSelector('contacts')} [index="${index}"]`;
  }

  abstract expectValue(scheduleForm: ScheduleForm): any;
}

export class ScheduleFormViewPageObjectCypress extends ScheduleFormViewPageObject {
  expectValue(scheduleForm: ScheduleForm) {
    this.expectDateRange(scheduleForm.dateRange);
    this.expectNumParticipants(scheduleForm.numParticipants);
    this.expectNumElders(scheduleForm.numElders);
    this.expectNumKids(scheduleForm.numKids);
    this.expectTotalBudget(scheduleForm.totalBudget);
    this.expectSingleBudget(scheduleForm.singleBudget);
    this.expectGroupName(scheduleForm.groupName);
    this.expectContacts(scheduleForm.contacts);
    this.expectTranspotation(scheduleForm.transpotation);
    this.expectTranspotationHelp(scheduleForm.transpotationHelp);
    this.expectAccommodationHelp(scheduleForm.accommodationHelp);
    this.expectLikesTags(scheduleForm.tags);
    this.expectLikesDescription(scheduleForm.likesDescription);
  }

  expectDateRange(dateRange: DateRange) {
    const dateRangeView = new DateRangePageObjects.DateRangeViewPageObjectCypress(
      this.getSelector('dateRange')
    );
    dateRangeView.expectValue(dateRange);
  }

  expectNumParticipants(numParticipants: number) {
    cy.get(this.getSelector('numParticipants')).contains(numParticipants);
  }

  expectNumElders(numElders: number) {
    cy.get(this.getSelector('numElders')).contains(numElders);
  }

  expectNumKids(numKids: number) {
    cy.get(this.getSelector('numKids')).contains(numKids);
  }

  expectTotalBudget(budget: NumberRange) {
    const totalBudgetPageObject = new NumberRangeViewPageObjectCypress(
      this.getSelector('totalBudget')
    );
    totalBudgetPageObject.expectValue(budget);
  }

  expectSingleBudget(budget: NumberRange) {
    const singleBudgetPageObject = new NumberRangeViewPageObjectCypress(
      this.getSelector('singleBudget')
    );
    singleBudgetPageObject.expectValue(budget);
  }

  expectGroupName(groupName: string) {
    cy.get(this.getSelector('groupName')).contains(groupName);
  }

  expectContacts(contacts: Contact[]) {
    for (let index = 0; index < contacts.length; index++) {
      const contact = contacts[index];
      const contactViewPageObject = new ContactViewPageObjectCypress(
        this.getSelectorForContactAt(index)
      );
      contactViewPageObject.expectValue(contact);
    }
  }

  expectTranspotation(transpotation: string) {
    cy.get(this.getSelector('transpotation')).contains(TranspotationTypes[transpotation].label);
  }

  expectTranspotationHelp(transpotationHelp: string) {
    cy.get(this.getSelector('transpotationHelp')).contains(transpotationHelp);
  }

  expectAccommodationHelp(accommodationHelp: string) {
    cy.get(this.getSelector('accommodationHelp')).contains(accommodationHelp);
  }

  expectLikesTags(tags: Tags) {
    const tagsViewPageObject = new TagsViewPageObjectCypress(this.getSelector('likesTags'));
    tagsViewPageObject.expectValue(tags);
  }

  expectLikesDescription(likesDescription: string) {
    cy.get(this.getSelector('likesDescription')).contains(likesDescription);
  }
}
