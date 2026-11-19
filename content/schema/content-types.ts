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
  content: { format: "locked-structured-v1"; localized: Record<Locale, Record<string, unknown>> };
  practice: { kind: string; questionCount: number; minimumCharactersPerAnswer: number; feedbackAfterSubmission: boolean; rubricKey: string; questionsKey: string; answerKey: string };
  sources: { title: string; url: string; tier: string; usage: "reference_only" | "claim_verified" }[];
  rights: { text: "first_party" | "external_reference" | "unknown"; illustration: string };
  provenance: { sourceUrl: string; sourceSection: string; evidenceType: "editorial" | "documented"; checkedOn: string; legacySourcePath: string };
  reviewState: OntologyReviewState; publishState: OntologyPublishState; editorialStatus: "po_locked" | "draft" | "reviewed";
  publishedAt: string | null; updatedAt: string;
};
export type ContentEdge = { id: string; predicate: OntologyPredicate | "STATES_CLAIM" | "RECOMMENDED_BEFORE"; from: string; to: string; reviewState: OntologyReviewState; reason?: string; provenance: CanonicalLesson["provenance"] };
