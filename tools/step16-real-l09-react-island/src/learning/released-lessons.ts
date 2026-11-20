/* One release gate for the existing React routes and private learning sync.
 * A JSON file alone NEVER grants access; the lesson must be in the built course
 * pack AND have an explicitly published native navigation entry.
 */
import manifest from '../../../../site/content-packs/manifest.json';
import catalog from '../../../../site/content-packs/course-catalog.json';
import legacy from '../../../../content/curriculum/legacy-catalog.v1.json';
const packed=new Set(manifest.courses.flatMap(c=>c.lessonIds));
const authorized=new Set(catalog.lessons.filter(l=>
 l.navigationPublished===true&&l.contentState==='review_only'&&
 l.publishState==='review_only'&&packed.has(l.id)).map(l=>l.id));
export const releasedLessonIds:readonly string[]=Object.freeze([...authorized].sort());
export function isReleasedLessonId(id:string):boolean{return authorized.has(id);}

/** Personal-use lessons are surfaced only inside the existing invited STAGING
 * app catalog. They are NOT release approvals or public content-pack entries.
 * This list also enables the existing account-scoped learner sync for them.
 */
const stagingPersonalIds=import.meta.env.VITE_LI_AUTH_TARGET==='github-pages-staging'
 ?[
  'L03-1-1','L03-1-3','L03-2-1','L03-2-2','L03-2-3',
  'L09-1-3','L09-2-1','L09-2-2','L09-2-3','L09-3-1','L09-3-2','L09-3-3',
  'L15-2-1','L15-2-3','L15-3-1','L15-3-2','L15-3-3'
 ]:[];
export const personalStudyLessonIds:readonly string[]=Object.freeze(stagingPersonalIds);
const personalStudySet=new Set(personalStudyLessonIds);
export function isPersonalStudyLessonId(id:string):boolean{return personalStudySet.has(id);}
export const learnableLessonIds:readonly string[]=Object.freeze(
 [...new Set([...releasedLessonIds,...personalStudyLessonIds])].sort());
export function isLearnableLessonId(id:string):boolean{
 return authorized.has(id)||personalStudySet.has(id);
}

export type ReleasedLessonRoute=Readonly<{id:string;route:string;slug:string}>;
const routes:ReleasedLessonRoute[]=[];
const seen=new Set<string>();
for(const group of legacy.groups)for(const field of group.fields)
 for(const course of field.courses)for(const lesson of course.lessons){
  const route='route' in lesson?lesson.route:undefined;
  if(!authorized.has(lesson.id)||lesson.published!==true||
   typeof route!=='string'||!/^lessonL\d+$/.test(route))continue;
  if(seen.has(route))throw Error('DUPLICATE_RELEASED_LESSON_ROUTE '+route);
  seen.add(route);
  routes.push({id:lesson.id,route,slug:route.slice('lesson'.length).toLowerCase()});
 }
export const releasedLessonRoutes:readonly ReleasedLessonRoute[]=Object.freeze(routes);
