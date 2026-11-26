export type PhysicalKey='sleep'|'move'|'rest';
export type PhysicalAnswer='yes'|'no';
export type PhysicalAnswers=Partial<Record<PhysicalKey,PhysicalAnswer>>;
export type EnergyAnswer=''|'high'|'medium'|'low';
export type AttentionAnswer=''|'steady'|'warming'|'hard';
export type StudyRhythm='start'|'focus'|'overload'|'recover';
export declare const STUDY_RHYTHMS:Readonly<Record<StudyRhythm,string>>;
export declare const CHECKIN_PHYSICAL:readonly PhysicalKey[];
export declare const CHECKIN_ALLOWED:readonly PhysicalAnswer[];
export declare function completePhysical(answers:PhysicalAnswers):boolean;
export interface RhythmRecommendation{
 mode:StudyRhythm;reason:string;points:number;physicalPoints:number;
 energyPoints:number;attentionPoints:number;positives:string[]
}
export declare function recommendStudyRhythm(
 physical:PhysicalAnswers,
 energy?:EnergyAnswer,attention?:AttentionAnswer
):RhythmRecommendation|null;

export type SavedCheckin=Required<PhysicalAnswers>&{
 energy:EnergyAnswer;attention:AttentionAnswer;override:StudyRhythm|'';
 selectedMode:StudyRhythm;recordedAt:string;
};
export declare function checkinDay(when:string|number|Date):string|null;
export declare function savedCheckin(value:unknown,now:string|number|Date):SavedCheckin|null;
