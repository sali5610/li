import type {Attempt} from '../native-bridge';

/** Production integration ports, never test doubles. Chat 3 owns auth/attempts/sync,
 * Chat 4 owns search, Chat 1 owns the app router and staging release.
 * No fallback guest access, fake cloud progress, or direct learner-key writes here.
 */
export const L09_LESSON_ID = 'L09-1-2' as const;
export type Wave1LessonId = 'L03-1-2'|'L09-1-2'|'L15-2-2';
export type InvitedLearner = Readonly<{subjectId:string}>;
export type StoredAttempt = Readonly<{attempt:Attempt;revision:string}>;
export type SyncState = 'on-device'|'queued'|'synced'|'unavailable';

export interface LearningPorts {
  auth: {
    /** Must reject an anonymous, uninvited or expired session. */
    requireInvitedLearner():Promise<InvitedLearner>;
  };
  attempts: {
    load(input:{lessonId:Wave1LessonId;subjectId:string}):Promise<StoredAttempt>;
    /** Compare-and-swap, rejecting stale revisions. Persist through the real Chat 3 adapter. */
    save(input:{
      lessonId:Wave1LessonId;subjectId:string;
      attempt:Attempt;expectedRevision:string;
    }):Promise<{revision:string}>;
  };
  sync: {
    /** Truthful status from persistence owner; NOT inferred from local form state. */
    getStatus(input:{lessonId:Wave1LessonId;subjectId:string}):Promise<SyncState>;
  };
  navigation: {openCatalog():void};
  search: {openSearch(query:string):void};
}
