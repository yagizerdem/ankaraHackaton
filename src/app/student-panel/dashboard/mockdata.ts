import {
  BookOpenIcon,
  ChartColumnIcon,
  ClipboardCheckIcon,
  CpuIcon,
  DatabaseIcon,
  FileTextIcon,
  FileUpIcon,
  GitForkIcon,
  LayoutDashboardIcon,
  NetworkIcon,
  RouteIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";

// Everything the student panel renders until the real APIs exist.

export const student = {
  firstName: "Caner",
  fullName: "Caner Öztürk",
  department: "METU Computer Engineering",
};

export const activeCourse = {
  code: "MATH 101",
  name: "Calculus I",
  icon: BookOpenIcon,
};

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/student-panel/dashboard", icon: LayoutDashboardIcon },
  { id: "documents", label: "Documents & Upload", href: "/student-panel/uploads", icon: FileUpIcon },
  { id: "graph", label: "Knowledge Graph", href: "/student-panel/knowledge-graph", icon: NetworkIcon },
  { id: "assessment", label: "Adaptive Exam & Assessment", href: "/student-panel/assessment", icon: ClipboardCheckIcon },
  { id: "path", label: "Personal Learning Path", href: "/student-panel/learning-path", icon: RouteIcon },
  { id: "analytics", label: "Teacher / Class Analytics", href: "/student-panel/analytics", icon: ChartColumnIcon },
];

export const notifications = { unread: 1 };

export const welcomeBanner = {
  cycleLabel: "METU Hackathon v0.9 • Active Cycle",
  liveLabel: "Live Analytics Engine",
  summary:
    "Using Bayesian inference on Gemini 1.5 Pro, the knowledge graph found 1 critical prerequisite bottleneck. Your path was adjusted automatically.",
  engines: [
    { label: "Beta-Bernoulli", icon: CpuIcon, iconClassName: "text-success" },
    { label: "DAG Verified", icon: GitForkIcon, iconClassName: "text-primary" },
    { label: "Vector RAG", icon: DatabaseIcon, iconClassName: "text-tertiary" },
  ] satisfies { label: string; icon: LucideIcon; iconClassName: string }[],
};

export type StatFooter =
  | { kind: "progress"; percent: number; left: string; right: string }
  | { kind: "callout"; text: string }
  | { kind: "split"; left: string; right: string }
  | { kind: "progress-caption"; percent: number; caption: string; highlight: string };

export interface StatCard {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  valueClassName: string;
  detailClassName: string;
  iconClassName: string;
  /** Fill color of the footer progress bar. */
  barClassName?: string;
  /** Marks the card as an alert with a tinted corner. */
  alert?: boolean;
  footer: StatFooter;
}

export const statCards: StatCard[] = [
  {
    id: "mastery",
    label: "Overall Topic Mastery",
    value: "68%",
    detail: "+4.2% last exam",
    icon: TrendingUpIcon,
    valueClassName: "text-success",
    detailClassName: "text-success",
    iconClassName: "bg-success/15 text-success",
    barClassName: "bg-success",
    footer: { kind: "progress", percent: 68, left: "34 correct / 14 wrong", right: "48 Evidence Points" },
  },
  {
    id: "gap",
    label: "Critical Knowledge Gap",
    value: "1 Block",
    detail: "Root Cause",
    icon: TriangleAlertIcon,
    valueClassName: "text-error",
    detailClassName: "text-error",
    iconClassName: "bg-error/15 text-error",
    alert: true,
    footer: { kind: "callout", text: "Limits & Continuity → Derivatives" },
  },
  {
    id: "documents",
    label: "Processed Documents",
    value: "3 PDF",
    detail: "142 Pages",
    icon: FileTextIcon,
    // The document count is a neutral fact, not a signal, so it stays in ink.
    valueClassName: "text-on-surface",
    detailClassName: "text-on-surface-variant",
    iconClassName: "bg-primary-container/20 text-primary",
    footer: { kind: "split", left: "26 Topic Nodes", right: "38 Semantic Edges" },
  },
  {
    id: "path",
    label: "Active Path Progress",
    value: "Step 2/5",
    detail: "40% Done",
    icon: RouteIcon,
    valueClassName: "text-tertiary",
    detailClassName: "text-tertiary",
    iconClassName: "bg-tertiary/15 text-tertiary",
    barClassName: "bg-tertiary",
    footer: {
      kind: "progress-caption",
      percent: 40,
      caption: "Now:",
      highlight: "Reviewing One-Sided Limits",
    },
  },
];

export const uploadCenter = {
  title: "Document Upload & Automatic DAG Extraction Center",
  description:
    "Uploaded course materials are analyzed with Gemini 1.5 Pro; concepts and prerequisite networks are processed into an acyclic graph (DAG) with Kahn's algorithm.",
  dropTitle: "Drag in or choose a textbook, midterm notes or slides PDF",
  dropHint:
    "Max. 50 MB • Standard PDF format • Automatic Gemini 1.5 Pro topic extraction, Kahn topological sorting & question generation",
  capabilities: [
    { label: "Kahn Algorithm Active", active: true },
    { label: "Powered by MongoDB Vector Search", active: false },
  ],
};

export type DocumentStatus =
  | { kind: "done"; label: string }
  | { kind: "processing"; label: string; percent: number }
  | { kind: "draft"; label: string };

export interface DocumentAction {
  label: string;
  variant: "neutral" | "primary" | "success" | "busy";
}

export interface IngestedDocument {
  id: string;
  name: string;
  source: string;
  size: string;
  pages: number;
  status: DocumentStatus;
  time: string;
  actions: DocumentAction[];
}

export const documents: IngestedDocument[] = [
  {
    id: "calculus",
    name: "Calculus_Early_Transcendentals_Ch2-3.pdf",
    source: "James Stewart",
    size: "12.8 MB",
    pages: 48,
    status: { kind: "done", label: "Processed (22 Topics, 31 Prerequisite Edges)" },
    time: "14 min ago",
    actions: [
      { label: "View Graph", variant: "neutral" },
      { label: "Start Exam", variant: "primary" },
    ],
  },
  {
    id: "physics",
    name: "Physics101_Week4_Kinematics.pdf",
    source: "Serway Physics I",
    size: "6.4 MB",
    pages: 24,
    status: { kind: "processing", label: "Processing (Chunks & Embeddings)", percent: 78 },
    time: "2 min ago",
    actions: [{ label: "Processing...", variant: "busy" }],
  },
  {
    id: "linear-algebra",
    name: "Linear_Algebra_Vector_Spaces.pdf",
    source: "Department Notes",
    size: "9.1 MB",
    pages: 36,
    status: { kind: "draft", label: "Draft (18 Topics Extracted - Awaiting Teacher Approval)" },
    time: "3 hours ago",
    actions: [
      { label: "Edit", variant: "neutral" },
      { label: "Verify & Add", variant: "success" },
    ],
  },
];

export const pendingUpload = {
  name: "MATH101_Week5_Intro_to_Integrals.pdf",
  pages: 32,
  size: "8.4 MB",
  topic: "Riemann Sums",
  queueLabel: "Queued",
  eta: "18 seconds",
  steps: [
    { label: "PDF Chunking & Text Normalization", state: "done", detail: "Completed (128 chunks)" },
    { label: "Gemini 1.5 Pro Topic Extraction & DAG Prerequisite Detection", state: "running", detail: "%64" },
    { label: "Kahn Acyclicity Check & MongoDB Atlas Save", state: "pending", detail: "Waiting" },
  ] satisfies { label: string; state: "done" | "running" | "pending"; detail: string }[],
};

export type NodeStatus = "mastered" | "review" | "bottleneck" | "unmeasured" | "locked";

export interface GraphNode {
  id: string;
  title: string;
  status: NodeStatus;
  badge: string;
  meta: string;
  detail: string;
  /** Position and width in graph-world pixels (see GRAPH_WORLD). */
  x: number;
  y: number;
  width: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  /** Text color; the edge, arrow and label draw in currentColor. */
  className: string;
  critical?: boolean;
  label?: string;
  dashed?: boolean;
}

export const GRAPH_WORLD = { width: 640, height: 440 };

export const knowledgeGraph = {
  title: "Calculus I: Knowledge Graph (DAG) Preview",
  subtitle: "Kahn-verified directed acyclic graph • Live node states",
  filters: [
    {
      status: "mastered",
      label: "Mastered (92%)",
      className: "bg-success/15 text-success",
      dotClassName: "bg-success",
    },
    {
      status: "review",
      label: "Review (52%)",
      className: "bg-tertiary/15 text-tertiary",
      dotClassName: "bg-tertiary",
    },
    {
      status: "bottleneck",
      label: "Bottleneck (28%)",
      className: "bg-error/15 text-error",
      dotClassName: "bg-error",
    },
    {
      status: "locked",
      label: "Locked / No evidence",
      className: "bg-surface-container-highest text-on-surface-variant",
      dotClassName: "bg-outline",
    },
  ] satisfies { status: NodeStatus; label: string; className: string; dotClassName: string }[],
  nodes: [
    {
      id: "functions",
      title: "Basic Functions",
      status: "mastered",
      badge: "92% Mastery",
      meta: "",
      detail: "16 Correct / 0 Wrong • Strong",
      x: 40,
      y: 40,
      width: 176,
    },
    {
      id: "limit",
      title: "Limit Concept",
      status: "review",
      badge: "52% Mastery",
      meta: "8 Evidence",
      detail: "Weak on one-sided limits",
      x: 176,
      y: 176,
      width: 192,
    },
    {
      id: "continuity",
      title: "Definition of Continuity",
      status: "unmeasured",
      badge: "Not measured",
      meta: "0 Evidence",
      detail: "3 Diagnostic Questions Pending",
      x: 420,
      y: 176,
      width: 192,
    },
    {
      id: "derivative-rules",
      title: "Derivative Rules",
      status: "bottleneck",
      badge: "28% Mastery",
      meta: "Bottleneck!",
      detail: "3 Wrong in a Row (Tangent Slope)",
      x: 96,
      y: 340,
      width: 224,
    },
    {
      id: "chain-rule",
      title: "Chain Rule",
      status: "locked",
      badge: "Locked",
      meta: "Awaiting Prerequisite",
      detail: "Needs derivative mastery > 70%",
      x: 420,
      y: 340,
      width: 192,
    },
  ] satisfies GraphNode[],
  edges: [
    { from: "functions", to: "limit", className: "text-success", label: "Prerequisite (Required)", dashed: true },
    { from: "limit", to: "continuity", className: "text-tertiary", label: "Direct Link" },
    { from: "limit", to: "derivative-rules", className: "text-error", critical: true, label: "Bottleneck Cause" },
    { from: "continuity", to: "derivative-rules", className: "text-outline", dashed: true },
    { from: "derivative-rules", to: "chain-rule", className: "text-outline", label: "Locked Branch" },
  ] satisfies GraphEdge[],
  diagnosis: {
    title: "Gemini 1.5 Graph Diagnosis",
    lead: "Recommendation:",
    text: "Struggles with derivatives detected. Root cause:",
    highlight: "52% mastery in Limits",
    tail: "Complete the Limits prerequisite first.",
    action: "Start Prerequisite Path",
    dismiss: "Dismiss",
  },
  telemetry: {
    cycles: "0 Cycles (Acyclic)",
    depth: "4 Levels",
    lastSync: "14:38:12",
  },
};

export interface LearningStep {
  id: string;
  badge: string;
  badgeClassName: string;
  metaClassName: string;
  /** Shows an alert icon in the badge. */
  urgent?: boolean;
  meta: string;
  title: string;
  description?: string;
  action: { label: string; icon?: "tutor" | "quiz"; variant: "primary" | "neutral" };
  duration: string;
  locked?: boolean;
}

export const learningPath: { title: string; tag: string; steps: LearningStep[] } = {
  title: "Recommended Study Path",
  tag: "AI Optimize",
  steps: [
    {
      id: "one-sided-limits",
      badge: "Priority 1 • Weak Prerequisite",
      badgeClassName: "bg-error/15 text-error",
      metaClassName: "text-on-surface-variant",
      urgent: true,
      meta: "Pages 34–39",
      title: "Computing One-Sided Limits and Indeterminate Forms",
      description: "A targeted summary from Calculus Early Transcendentals Ch 2.2.",
      action: { label: "Study Now (RAG Tutor)", icon: "tutor", variant: "primary" },
      duration: "About 12 min",
    },
    {
      id: "continuity-test",
      badge: "Priority 2 • Missing Evidence",
      badgeClassName: "bg-tertiary/15 text-tertiary",
      metaClassName: "text-tertiary",
      meta: "3 questions needed",
      title: "Definition of Continuity Diagnostic Test",
      description: "Answer 3 diagnostic questions to raise the Bayesian confidence above 85%.",
      action: { label: "Take Diagnostic Test", icon: "quiz", variant: "neutral" },
      duration: "5 min",
    },
    {
      id: "derivative-rules",
      badge: "Target Topic • Locked",
      badgeClassName: "bg-surface-container-highest text-on-surface-variant",
      metaClassName: "text-on-surface-variant",
      meta: "After steps 1 and 2",
      title: "Differentiation Rules and the Tangent Line",
      action: { label: "Reassess", variant: "neutral" },
      duration: "Locked",
      locked: true,
    },
  ],
};

export const diagnosticQuestion = {
  title: "Quick Diagnostic Question (Adaptive Snippet)",
  chapter: "Calculus Ch2",
  number: 1,
  promptBefore: "Find the limit below and decide whether the function is continuous at",
  promptHighlight: "x = 2",
  promptAfter: ":",
  difficulty: "Difficulty: Medium",
  expression: { limit: "lim(x → 2)", numerator: "(x² - 4)", denominator: "(x - 2)" },
  options: [
    { id: "a", text: "A) Limit = 4, and the function is continuous at x=2." },
    {
      id: "b",
      text: "B) Limit = 4, but the function is undefined at x=2, so it is discontinuous (removable discontinuity).",
    },
    { id: "c", text: "C) It is a 0/0 indeterminate form, so the limit does not exist." },
    { id: "d", text: "D) Limit = 2, and the function is continuous." },
  ],
  correctOptionId: "b",
  explanationTitle: "RAG Hint:",
  explanationBefore: "Factoring gives",
  explanationCode: "(x-2)(x+2)/(x-2) = x+2",
  explanationMiddle: "→ the limit is 4. But",
  explanationCode2: "f(2)",
  explanationAfter: "is undefined, so the function is not continuous there.",
  footnote: "A correct answer adds +1 evidence to the Bayesian graph.",
  submitLabel: "Submit Answer & Update Graph",
  correctLabel: "Verified! Graph Updated",
  wrongLabel: "Wrong answer. Review the explanation.",
};
