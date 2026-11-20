// Canonical lesson contract. Ontology node and predicate unions are reused from ONT-01.
import type { OntologyPredicate, OntologyReviewState, OntologyPublishState } from "../../docs/ontology/ontology-types";
export type Locale = "vi" | "en";
export type HierarchyRef = { id: string; title: string };
export type CanonicalLesson = {
  schemaVersion: "1.0.0"; id: string; kind: "Lesson"; version: string;
  languages: Locale[]; title: Record<Locale, string>; aliases: { locale: Locale; text: string }[];
  hierarchy: { group: HierarchyRef; field: HierarchyRef; course: HierarchyRef; chapter?: HierarchyRef };
  difficulty?: string | null; learningOutcomes: Record<Locale, string[]>; conceptIds: string[];
  prerequisiteLessonIds: string[]; methodFit: { status: "not_reviewed" | "reviewed" | "approved"; primaryTechniqueId: string | null; optionalTechniqueIds: string[] };
  content: { format: "locked-structured-v1" | "editorial-structured-v1" | "editorial-sectioned-v1"; localized: Record<Locale, Record<string, unknown>> };
  practice: { kind: string; questionCount: number; minimumCharactersPerAnswer: number; feedbackAfterSubmission: boolean; rubricKey: string; questionsKey: string; answerKey: string; questionFeedbackModes?: ("exact"|"open")[] };
  sources: { title: string; url: string; tier: string; usage: "reference_only" | "claim_verified" }[];
  rights: { text: "first_party" | "external_reference" | "unknown"; illustration: string };
  provenance: { sourceUrl: string; sourceSection: string; evidenceType: "editorial" | "documented"; checkedOn: string; legacySourcePath: string };
  reviewState: OntologyReviewState; publishState: OntologyPublishState; editorialStatus: "po_locked" | "draft" | "reviewed";
  publishedAt: string | null; updatedAt: string;
};
export type ContentEdge = { id: string; predicate: OntologyPredicate | "STATES_CLAIM" | "RECOMMENDED_BEFORE"; from: string; to: string; reviewState: OntologyReviewState; reason?: string; provenance: CanonicalLesson["provenance"] };

export type CourseLevelId = "foundation" | "intermediate" | "advanced" | "capstone";
export type CourseLevel = { id: CourseLevelId; order: number; title: Record<Locale,string>; sourceLabels: string[] };
export type CourseMetadata = { id: string; title: string; groupId: string; fieldId: string; level: CourseLevelId; sourceLevel: string; status: "legacy_outline" | "review_only"; lessonIds: string[]; outlineLessonIds: string[] };
export type EditorialResearchCourse = { id: string; fieldId: string; title: string; triage: string; level: CourseLevelId; sourceLevel: string; editorialRole: string; legacyEvidence: string[]; sourcePriority: string; status: "research_candidate"; canonicalCourseId: null };

export type CurriculumGroup = { id: string; title: string; fieldIds: string[] };
export type CurriculumField = { id: string; slug: string; title: string; groupId: string; source: string | null; courseIds: string[] };
export type CurriculumLessonOutline = { id: string; title: string; groupId: string; fieldId: string; courseId: string; order: number; navigationPublished: boolean; contentState: "outline_only" | "review_only"; publishState: "draft" | "review_only"; localizedTitle: Record<Locale,string> | null };
export type CurriculumHierarchy = { schemaVersion: "1.0.0"; hierarchy: ["group","field","course","lesson"]; groups: CurriculumGroup[]; fields: CurriculumField[]; courses: CourseMetadata[]; lessons: CurriculumLessonOutline[] };
