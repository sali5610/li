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
