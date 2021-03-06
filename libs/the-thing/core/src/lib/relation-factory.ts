import { getEnv, Query } from '@ygg/shared/infra/core';
import { Observable, race, NEVER, of, throwError } from 'rxjs';
import { map, tap, take, timeout, filter, catchError } from 'rxjs/operators';
import { RelationRecord } from './relation';
import { RelationAccessor } from './relation-accessor';
import { isEmpty } from 'lodash';

export abstract class RelationFactory {
  saveUniq = this.replaceObject;
  siteConfig = getEnv('siteConfig');

  constructor(protected relationAccessor: RelationAccessor) {}

  async create(options: {
    subjectCollection: string;
    subjectId: string;
    objectCollection: string;
    objectId: string;
    objectRole: string;
  }) {
    const relationRecord: RelationRecord = new RelationRecord(options);
    return this.save(relationRecord);
  }

  async save(relationRecord: RelationRecord) {
    try {
      await this.relationAccessor.save(relationRecord);
    } catch (error) {
      const wrapError = new Error(
        `Failed to save relation record; \n${error.message}`
      );
      throw wrapError;
    }
  }

  async delete(subjectId: string, objectRole: string, objectId: string) {
    const id = RelationRecord.constructId(subjectId, objectRole, objectId);
    return this.relationAccessor.delete(id);
  }

  findBySubjectAndRole$(
    subjectId: string,
    objectRole: string
  ): Observable<RelationRecord[]> {
    // console.log(`Find by subject id ${subjectId}, of role ${objectRole}`);
    const queries = [];
    queries.push(new Query('subjectId', '==', subjectId));
    queries.push(new Query('objectRole', '==', objectRole));
    return this.relationAccessor.find$(queries);
  }

  findByObjectAndRole$(
    objectId: string,
    objectRole: string
  ): Observable<RelationRecord[]> {
    const queries = [];
    queries.push(new Query('objectId', '==', objectId));
    queries.push(new Query('objectRole', '==', objectRole));
    return this.relationAccessor.find$(queries);
  }

  hasRelation$(
    subjectId: string,
    objectId: string,
    objectRole: string
  ): Observable<boolean> {
    const id = RelationRecord.constructId(subjectId, objectRole, objectId);
    return this.relationAccessor.has$(id);
  }

  async hasRelation(
    subjectId: string,
    objectId: string,
    objectRole: string
  ): Promise<boolean> {
    try {
      const id = RelationRecord.constructId(subjectId, objectRole, objectId);
      const relationRecord = await this.relationAccessor.load(id);
      return !!relationRecord;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async waitRelation(
    subjectId: string,
    objectId: string,
    objectRole: string,
    hasNot: boolean = false
  ) {
    const id = RelationRecord.constructId(subjectId, objectRole, objectId);
    const timeoutLength =
      this.siteConfig.dataAccess.timeoutLong ||
      this.siteConfig.dataAccess.timeout ||
      5000;
    try {
      await race(
        this.hasRelation$(subjectId, objectId, objectRole).pipe(
          tap(has => console.log(`Has relation ${id}? ${has}`)),
          filter(has => (hasNot ? !has : has)),
          take(1)
        ),
        NEVER.pipe(
          timeout(timeoutLength),
          catchError(() =>
            throwError(new Error(`Timeout after ${timeoutLength} ms`))
          )
        )
      ).toPromise();
    } catch (error) {
      const wrapError = new Error(
        `Failed to wait relation ${id} ${hasNot ? 'not ' : ''}exist.\n${
          error.message
        }`
      );
      return Promise.reject(wrapError);
    }
  }

  async deleteBySubjectAndRole(subjectId: string, objectRole: string) {
    const relations = await this.findBySubjectAndRole$(subjectId, objectRole)
      .pipe(take(1))
      .toPromise();
    if (!isEmpty(relations)) {
      for (const relation of relations) {
        await this.delete(
          relation.subjectId,
          relation.objectRole,
          relation.objectId
        );
      }
    }
  }

  async replaceObject(relation: RelationRecord) {
    await this.deleteBySubjectAndRole(relation.subjectId, relation.objectRole);
    return this.save(relation);
  }
}
