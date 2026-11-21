/** One real React component API shared between Studio and app.
 * Do not copy these components into a separate publishing repository. */
export {Container,Stack,Inline,Cluster,Grid,SafeArea,ScrollRegion} from './Layout';
export {Text,Heading,Link,Divider,Badge,Progress} from './Atoms';
export type {TextRole,HeadingRole} from './Atoms';
export {Checkbox,Radio,Field,Icon,IconButton} from './Controls';
export type {FieldProps,IconName} from './Controls';
export {Button,Card,FilterChip} from './Components';
export type {ButtonProps,ButtonVariant,CardProps,CardVariant,FilterChipProps} from './Components';

export {Dialog} from './Dialog';
export type {DialogProps} from './Dialog';
export {SearchField,ActionGroup,InlineFeedback} from './Molecules';
export type {SearchFieldProps,InlineFeedbackProps,FeedbackTone} from './Molecules';

export {SaveStatus,LanguageSwitch,FilterGroup,ListRow,Breadcrumb} from './Molecules';
export type {SaveState,SaveStatusProps,LanguageCode,LanguageSwitchProps,FilterOption,FilterGroupProps,ListRowProps,BreadcrumbItem,BreadcrumbProps} from './Molecules';

export {SourceStatus,Disclosure,ActionMenu} from './Molecules';
export type {SourceReviewState,SourceStatusProps,DisclosureProps,ActionMenuItem,ActionMenuProps} from './Molecules';

export {AppNavigationControls} from './AppNavigation';
export type {AppNavigationItem,AppNavigationControlsProps} from './AppNavigation';
export {AppHeader,HomeMirrorShell,CatalogShell,LearningFlowShell,AccountShell,FeedbackScene} from './Templates';
export type {AppNavItem,AppHeaderProps,HomeMirrorShellProps,CatalogShellProps,LearningFlowShellProps,AccountShellProps,SceneKind,FeedbackSceneProps} from './Templates';

/** UX-DS-11 canonical React parity, historical candidate states remain DRAFT. */
export * from './LegacyNavigation';
export * from './LegacyCards';
export * from './LegacyControls';
export * from './LegacyDataViz';

export {LiIcon,iconRoles,lucideRoleNames} from './LucideIcons';
export type {LiIconRole,LiIconProps} from './LucideIcons';

/** Share the same presentational Home layout between the UI Lab and real React Home. */
export {HomeLayout,homeLayoutVariants} from './HomeLayoutVariants';
export type {HomeLayoutProps,HomeLayoutVariant} from './HomeLayoutVariants';
export {BookwormIllustration} from './BookwormIllustration';
export type {BookwormArtKind} from './BookwormIllustration';
export {BookwormLessonBook} from './BookwormLessonBook';
export type {BookwormLessonBookProps} from './BookwormLessonBook';
export {BookwormScrapbook} from './BookwormScrapbook';
export {BookwormSourceArt} from './BookwormSourceArt';

/** Notebook annotations are a shared, presentational component. */
export {NotebookAnnotation} from './NotebookAnnotation';

/** Content-preserving, opt-in Notebook illustration slots. */
export {NotebookArt,notebookDisciplineImages} from './NotebookArt';
export type {NotebookArtKind,NotebookArtSize} from './NotebookArt';

/** Notebook reading: animated ink marks and open-book reader. */
export {NotebookInk} from './NotebookInk';
export {NotebookLessonBook} from './NotebookLessonBook';
export type {NotebookLessonSection} from './NotebookLessonBook';

export {PortalCategoryCard} from './PortalCategoryCard';
export type {PortalCategoryCardProps,PortalVariant} from './PortalCategoryCard';

/** Shared Tàng Thư specialist/field card (one whole arched illustration). */
export {CatalogFieldCard} from './CatalogFieldCard';
export type {CatalogFieldCardProps} from './CatalogFieldCard';
