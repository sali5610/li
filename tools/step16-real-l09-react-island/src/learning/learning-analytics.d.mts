import type {Attempt} from '../native-bridge';
export function summarizeSavedAttempt(attempt:Attempt):{
 submitted:boolean;completed:boolean;completedRounds:number;methodChoice:string|null;methodApplications:string[];
 selfRating:number|null;assistance:'hint_recorded'|'unknown';untrainedProbeOutcome:null;
};
