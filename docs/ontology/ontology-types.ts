// GENERATED from docs/ontology/registry.v0.1.json; read-only type reference, not deployed runtime.
// Regenerate through node tools/validate_ontology.mjs --emit-types; do not hand-maintain unions.
export type OntologyNodeKind = "DesignToken" | "Component" | "Variant" | "Slot" | "Pattern" | "Screen" | "Flow" | "UIRule" | "QAGate" | "DomainGroup" | "Field" | "Course" | "Lesson" | "Chapter" | "Concept" | "LearningOutcome" | "Misconception" | "SourceClaim" | "SourceEdition" | "TechniqueDefinition" | "TechniqueApplication" | "Micropractice" | "IndependentChallenge" | "Rubric" | "HintPolicy" | "RevealGate" | "Learner" | "Attempt" | "TechniqueExecution" | "ReviewDue" | "AssistanceEvent" | "Feedback" | "MentorStage" | "Intent" | "ContextSnapshot" | "AllowedAction" | "ResponseTemplate" | "Decision" | "Permission";
export type OntologyPredicate = "USES_TOKEN" | "HAS_VARIANT" | "HAS_SLOT" | "FILLS_SLOT" | "USES_PATTERN" | "INCLUDES_SCREEN" | "CONSTRAINS" | "VALIDATES" | "PART_OF" | "IS_A" | "TEACHES" | "AIMS_AT" | "REQUIRES" | "CONTRASTS_WITH" | "RELATED_TO" | "APPLIES_IN_FIELD" | "SUPPORTED_BY" | "USES_METHOD" | "INSTANTIATES_METHOD" | "ASSESSES_METHOD" | "ASSESSES_OUTCOME" | "ASSISTS_WITH" | "OFFERS_ACTION" | "EVIDENCES" | "SUPERSEDES";
export type OntologyReviewState = "proposed" | "verified" | "approved" | "rejected" | "superseded";
export type OntologyPublishState = "not_applicable" | "draft" | "review_only" | "published" | "suspended" | "retired";
export type OntologyVisibility = "public_curated" | "private_user";
export type OntologyRightsState = "first_party" | "external_reference" | "unknown";
export type OntologyEvidenceType = "documented" | "implemented" | "editorial" | "synthetic_fixture";
export interface OntologyProvenance { sourceUrl: string; sourceSection: string; evidenceType: OntologyEvidenceType; checkedOn: string; }
export interface OntologyAlias { locale: "vi" | "en"; text: string; }
export interface OntologyNode { id: string; kind: OntologyNodeKind; title: string; version: string; reviewState: OntologyReviewState; publishState: OntologyPublishState; visibility: OntologyVisibility; rightsState: OntologyRightsState; aliases: OntologyAlias[]; provenance: OntologyProvenance; note: string; }
export interface OntologyEdge { id: string; predicate: OntologyPredicate; from: string; to: string; reviewState: OntologyReviewState; visibility: OntologyVisibility; provenance: OntologyProvenance; }
export interface OntologyGraph { profile: string; graphVersion: string; contractVersion: string; demoOnly: true; boundary: string; nodes: OntologyNode[]; edges: OntologyEdge[]; }
