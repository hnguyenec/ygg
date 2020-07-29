import * as functions from 'firebase-functions';
import { camelCase, upperFirst, uniq } from 'lodash';
import {
  TheThingImitation,
  TheThing,
  TheThingRelation
} from '@ygg/the-thing/core';
import { relationFactory } from '../global';

export function generateOnCreateFunctions(imitations: TheThingImitation[]) {
  const onCreateFunctions = {};
  const collections = uniq(imitations.map(im => im.collection));
  for (const collection of collections) {
    onCreateFunctions[
      `onCreateTheThing${upperFirst(camelCase(collection))}`
    ] = functions.firestore
      .document(`${collection}/{id}`)
      .onCreate(
        async (
          snapshot: functions.firestore.QueryDocumentSnapshot,
          context: functions.EventContext
        ) => {
          try {
            const theThing: TheThing = new TheThing().fromJSON(snapshot.data());
            for (const relation of theThing
              .getAllRelations()
              .map(r => r.toRelationRecord())) {
              await relationFactory.save(relation);
            }
            return Promise.resolve();
          } catch (error) {
            console.error(error.message);
            return Promise.reject(error);
          }
        }
      );
  }
  return onCreateFunctions;
}