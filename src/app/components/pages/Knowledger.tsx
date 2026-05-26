import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown, ArrowLeft, ArrowRight,
  Download, Copy, Code2, Globe, FileText, Database, Table2, BarChart2,
  CheckSquare, Package, Workflow, Bot, MessageSquare, Shield, GitMerge,
  Brain, Bookmark, X, Plus, Tag, Zap, Link2, Search, Eye, Layers,
  Hash, Star, AlertTriangle, CheckCircle, Clock, MoreHorizontal,
  Maximize2, Minimize2, RefreshCw, Settings, Lock, Sparkles,
  ArrowUpRight, Info, Network, Filter, BookOpen, Route,
  ThumbsUp, ThumbsDown, Edit2, Check, Dot, Activity, TrendingUp,
  GitBranch, Circle, Square, CornerDownRight, AlignLeft, MapPin,
} from "lucide-react";

// ─── Design Tokens ────────────────────────────────────────────────
const C = {
  bgApp: "#F4F6FB", bgSurface: "#FFFFFF", bgSubtle: "#F1F5F9",
  bgHover: "#EEF2FF", bgCode: "#0D1117",
  sidebar: "#0B111E", sidebarBorder: "rgba(255,255,255,0.07)",
  txt: "#0F172A", txtSec: "#475569", txtMuted: "#94A3B8", txtInv: "#F8FAFC",
  accent: "#6366F1", accentHov: "#4F46E5", accentLight: "#EEF2FF",
  border: "#E2E8F0", borderLight: "#F1F5F9",
  success: "#10B981", successBg: "#DCFCE7", successTxt: "#15803D",
  warning: "#F59E0B", warningBg: "#FEF9C3", warningTxt: "#92400E",
  danger: "#EF4444", dangerBg: "#FEE2E2", dangerTxt: "#B91C1C",
  info: "#3B82F6", infoBg: "#DBEAFE", infoTxt: "#1D4ED8",
  purple: "#A855F7", purpleBg: "#F3E8FF", purpleTxt: "#7E22CE",
  teal: "#14B8A6", tealBg: "#CCFBF1", tealTxt: "#0F766E",
  orange: "#F97316", orangeBg: "#FFEDD5", orangeTxt: "#C2410C",
  pink: "#EC4899", pinkBg: "#FCE7F3", pinkTxt: "#BE185D",
  cyan: "#06B6D4", cyanBg: "#CFFAFE", cyanTxt: "#0E7490",
};

// ─── Node Type Definitions ────────────────────────────────────────
const NT = {
  domain:   { color: "#6366F1", bg: "#EEF2FF",  label: "Domain",   Icon: Globe },
  document: { color: "#3B82F6", bg: "#DBEAFE",  label: "Document", Icon: FileText },
  dataset:  { color: "#10B981", bg: "#DCFCE7",  label: "Dataset",  Icon: Database },
  table:    { color: "#F59E0B", bg: "#FEF3C7",  label: "Table",    Icon: Table2 },
  metric:   { color: "#A855F7", bg: "#F3E8FF",  label: "Metric",   Icon: BarChart2 },
  task:     { color: "#EC4899", bg: "#FCE7F3",  label: "Task",     Icon: CheckSquare },
  project:  { color: "#06B6D4", bg: "#CFFAFE",  label: "Project",  Icon: Package },
  workflow: { color: "#8B5CF6", bg: "#EDE9FE",  label: "Workflow", Icon: Workflow },
  persona:  { color: "#F97316", bg: "#FFEDD5",  label: "Persona",  Icon: Bot },
  faq:      { color: "#84CC16", bg: "#ECFCCB",  label: "FAQ",      Icon: MessageSquare },
  policy:   { color: "#EF4444", bg: "#FEE2E2",  label: "Policy",   Icon: Shield },
  decision: { color: "#0EA5E9", bg: "#E0F2FE",  label: "Decision", Icon: GitMerge },
  training: { color: "#14B8A6", bg: "#CCFBF1",  label: "Training", Icon: Brain },
  memory:   { color: "#6366F1", bg: "#EEF2FF",  label: "Memory",   Icon: Bookmark },
};

const EDGE_TYPES = {
  "semantic":   { color: "#6366F1", label: "Semantic similarity", style: "solid" },
  "cites":      { color: "#3B82F6", label: "Citation",            style: "solid" },
  "part-of":    { color: "#10B981", label: "Part of domain",      style: "solid" },
  "governs":    { color: "#EF4444", label: "Governs / Policy",    style: "dashed" },
  "trained-on": { color: "#14B8A6", label: "Trained on",          style: "dashed" },
  "depends":    { color: "#F59E0B", label: "Dependency",          style: "dotted" },
  "references": { color: "#8B5CF6", label: "References",          style: "solid" },
  "generates":  { color: "#F97316", label: "Generates",           style: "dashed" },
};

// ─── Rich Knowledge Graph Data ────────────────────────────────────
const NODES = {
  "domain-product": {
    id: "domain-product", type: "domain", label: "Product",
    desc: "Core product knowledge domain. Covers roadmaps, feature definitions, user research, competitive intelligence, and strategic decisions.",
    meta: {
      tags: [
        { tag: "roadmap", weight: 0.97, source: "human" },
        { tag: "strategy", weight: 0.94, source: "human" },
        { tag: "features", weight: 0.91, source: "ai" },
        { tag: "user-research", weight: 0.88, source: "human" },
        { tag: "competitive", weight: 0.76, source: "ai" },
        { tag: "q4-planning", weight: 0.82, source: "human" },
        { tag: "launch", weight: 0.71, source: "ai" },
      ],
      coverage: 94, freshness: 87, confidence: 0.96,
      source: "Confluence + Notion", lastIndexed: "2h ago",
      aiAssisted: true, status: "Public", owner: "Product Team",
      vectorDims: 1536, embeddingModel: "text-embedding-3-large",
    },
    edges: [
      { to: "domain-engineering", type: "semantic",   strength: 0.74, sharedTags: ["features", "launch", "api"] },
      { to: "domain-customer",    type: "semantic",   strength: 0.81, sharedTags: ["user-research", "features"] },
      { to: "doc-q4-roadmap",     type: "part-of",    strength: 0.99, sharedTags: ["roadmap", "q4-planning"] },
      { to: "doc-feature-faq",    type: "part-of",    strength: 0.95, sharedTags: ["features"] },
      { to: "wf-onboarding",      type: "references", strength: 0.68, sharedTags: ["launch", "features"] },
      { to: "persona-analyst",    type: "references", strength: 0.72, sharedTags: ["strategy", "roadmap"] },
      { to: "mem-sprint",         type: "part-of",    strength: 0.84, sharedTags: ["q4-planning", "strategy"] },
    ],
    documents: [
      { id: "doc-q4-roadmap",  title: "Q4 2024 Roadmap",       status: "Confidential", relevance: 0.99 },
      { id: "doc-feature-faq", title: "Feature FAQ",            status: "Public",       relevance: 0.95 },
      { id: "doc-ai-ux",       title: "AI-native UX Spec",      status: "Confidential", relevance: 0.88 },
      { id: "doc-competitive",  title: "Competitive Analysis",  status: "Internal",     relevance: 0.76 },
    ],
  },
  "domain-engineering": {
    id: "domain-engineering", type: "domain", label: "Engineering",
    desc: "Technical documentation, API references, architecture decisions, runbooks, and engineering standards.",
    meta: {
      tags: [
        { tag: "api", weight: 0.98, source: "human" },
        { tag: "architecture", weight: 0.93, source: "human" },
        { tag: "typescript", weight: 0.89, source: "ai" },
        { tag: "backend", weight: 0.87, source: "ai" },
        { tag: "authentication", weight: 0.82, source: "ai" },
        { tag: "scalability", weight: 0.78, source: "ai" },
      ],
      coverage: 78, freshness: 91, confidence: 0.91,
      source: "GitHub + Notion", lastIndexed: "45m ago",
      aiAssisted: true, status: "Internal", owner: "Engineering",
      vectorDims: 1536, embeddingModel: "text-embedding-3-large",
    },
    edges: [
      { to: "domain-product",    type: "semantic",   strength: 0.74, sharedTags: ["features", "launch"] },
      { to: "doc-api-ref",       type: "part-of",    strength: 0.98, sharedTags: ["api"] },
      { to: "ds-events",         type: "references", strength: 0.71, sharedTags: ["backend", "api"] },
      { to: "dec-ship-v3",       type: "part-of",    strength: 0.92, sharedTags: ["api", "architecture"] },
      { to: "tr-support",        type: "trained-on", strength: 0.65, sharedTags: ["api"] },
    ],
    documents: [
      { id: "doc-api-ref",       title: "API Reference v3.1",      status: "Public",   relevance: 0.98 },
      { id: "doc-eng-onboard",   title: "Engineering Onboarding",  status: "Internal", relevance: 0.84 },
      { id: "doc-arch-decision", title: "Architecture Decision Log",status: "Internal", relevance: 0.77 },
    ],
  },
  "domain-customer": {
    id: "domain-customer", type: "domain", label: "Customer",
    desc: "Customer success, support knowledge, user research findings, CRM insights, and satisfaction metrics.",
    meta: {
      tags: [
        { tag: "support", weight: 0.96, source: "human" },
        { tag: "customer-success", weight: 0.93, source: "human" },
        { tag: "user-feedback", weight: 0.89, source: "ai" },
        { tag: "churn", weight: 0.72, source: "ai" },
        { tag: "onboarding", weight: 0.85, source: "human" },
        { tag: "NPS", weight: 0.77, source: "ai" },
      ],
      coverage: 71, freshness: 65, confidence: 0.88,
      source: "Zendesk + Notion", lastIndexed: "3h ago",
      aiAssisted: true, status: "Public", owner: "Customer Success",
      vectorDims: 1536, embeddingModel: "text-embedding-3-large",
    },
    edges: [
      { to: "domain-product",  type: "semantic",   strength: 0.81, sharedTags: ["onboarding", "user-feedback"] },
      { to: "ds-user-metrics", type: "part-of",    strength: 0.94, sharedTags: ["churn", "NPS"] },
      { to: "doc-user-res",    type: "part-of",    strength: 0.96, sharedTags: ["user-feedback"] },
      { to: "persona-support", type: "generates",  strength: 0.89, sharedTags: ["support"] },
      { to: "tr-support",      type: "trained-on", strength: 0.88, sharedTags: ["support"] },
    ],
    documents: [
      { id: "doc-user-res",    title: "User Research 2024",        status: "Internal", relevance: 0.96 },
      { id: "doc-onboard-guide", title: "Customer Onboarding Guide", status: "Public", relevance: 0.88 },
    ],
  },
  "domain-legal": {
    id: "domain-legal", type: "domain", label: "Legal & Compliance",
    desc: "Legal policies, compliance requirements, data governance rules, privacy standards, and contractual obligations.",
    meta: {
      tags: [
        { tag: "privacy", weight: 0.98, source: "human" },
        { tag: "gdpr", weight: 0.95, source: "human" },
        { tag: "compliance", weight: 0.94, source: "human" },
        { tag: "data-retention", weight: 0.91, source: "human" },
        { tag: "pii", weight: 0.88, source: "ai" },
        { tag: "legal-review", weight: 0.82, source: "human" },
      ],
      coverage: 89, freshness: 77, confidence: 0.97,
      source: "Legal CMS", lastIndexed: "1d ago",
      aiAssisted: false, status: "Confidential", owner: "Legal Team",
      vectorDims: 1536, embeddingModel: "text-embedding-3-large",
    },
    edges: [
      { to: "pol-retention",  type: "part-of",  strength: 0.98, sharedTags: ["data-retention", "compliance"] },
      { to: "pol-privacy",    type: "part-of",  strength: 0.99, sharedTags: ["privacy", "gdpr"] },
      { to: "ds-events",      type: "governs",  strength: 0.87, sharedTags: ["data-retention", "pii"] },
      { to: "ds-user-metrics",type: "governs",  strength: 0.91, sharedTags: ["pii", "gdpr"] },
    ],
    documents: [
      { id: "pol-privacy",    title: "Privacy Policy v4.0",   status: "Public",      relevance: 0.99 },
      { id: "pol-retention",  title: "Data Retention Policy", status: "Public",      relevance: 0.98 },
    ],
  },
  "doc-q4-roadmap": {
    id: "doc-q4-roadmap", type: "document", label: "Q4 2024 Roadmap",
    desc: "Strategic Q4 2024 product roadmap. Covers three launch tracks: AI-native UX, enterprise scalability, and trust & safety. Contains OKR alignment and cross-functional dependencies.",
    meta: {
      tags: [
        { tag: "q4-planning", weight: 0.99, source: "human" },
        { tag: "roadmap", weight: 0.98, source: "human" },
        { tag: "ai-ux", weight: 0.91, source: "ai" },
        { tag: "enterprise", weight: 0.87, source: "ai" },
        { tag: "OKR", weight: 0.85, source: "human" },
        { tag: "2024", weight: 0.83, source: "human" },
        { tag: "launch-tracks", weight: 0.88, source: "ai" },
      ],
      coverage: 100, freshness: 92, confidence: 0.99,
      source: "Notion /product/roadmaps", lastIndexed: "2h ago",
      aiAssisted: false, status: "Confidential", owner: "Alex Kim",
      chunkCount: 24, vectorDims: 1536, fileSize: "248 KB",
      embeddingModel: "text-embedding-3-large", accessLevel: "Summary Only for AI",
    },
    edges: [
      { to: "domain-product",   type: "part-of",    strength: 0.99, sharedTags: ["roadmap", "q4-planning"] },
      { to: "doc-feature-faq",  type: "semantic",   strength: 0.79, sharedTags: ["ai-ux", "launch-tracks"] },
      { to: "mem-sprint",       type: "references", strength: 0.92, sharedTags: ["q4-planning", "OKR"] },
      { to: "persona-analyst",  type: "references", strength: 0.71, sharedTags: ["roadmap", "strategy"] },
    ],
    documents: [],
    chunks: [
      { id: "chunk-1", text: "Executive Summary — Three core themes for Q4 2024...", tags: ["strategy", "q4-planning"], relevance: 0.97 },
      { id: "chunk-2", text: "Priority 1: AI-native UX — conversational interface for knowledge queries...", tags: ["ai-ux", "launch"], relevance: 0.94 },
      { id: "chunk-3", text: "Priority 2: Enterprise Scalability — multi-tenant architecture...", tags: ["enterprise", "architecture"], relevance: 0.89 },
    ],
  },
  "ds-events": {
    id: "ds-events", type: "dataset", label: "Events DB",
    desc: "Production event stream. Captures all user interactions: page views, clicks, sign-ups, API calls. Source of truth for product analytics and ML feature engineering.",
    meta: {
      tags: [
        { tag: "events", weight: 0.99, source: "human" },
        { tag: "analytics", weight: 0.95, source: "ai" },
        { tag: "clickstream", weight: 0.91, source: "human" },
        { tag: "pii", weight: 0.88, source: "ai" },
        { tag: "ml-features", weight: 0.82, source: "ai" },
        { tag: "time-series", weight: 0.79, source: "ai" },
      ],
      coverage: 100, freshness: 98, confidence: 0.94,
      source: "Snowflake / events_v2", lastIndexed: "1h ago",
      aiAssisted: true, status: "Internal", owner: "Data Platform",
      rowCount: "184M", tableCount: 12, sizeGB: 2.4,
      embeddingModel: "text-embedding-3-large",
    },
    edges: [
      { to: "domain-engineering", type: "references", strength: 0.71, sharedTags: ["api", "analytics"] },
      { to: "domain-legal",       type: "governs",    strength: 0.87, sharedTags: ["pii", "data-retention"] },
      { to: "ds-user-metrics",    type: "depends",    strength: 0.88, sharedTags: ["analytics", "time-series"] },
      { to: "met-dau",            type: "generates",  strength: 0.95, sharedTags: ["analytics"] },
    ],
    documents: [],
    chunks: [],
  },
  "ds-user-metrics": {
    id: "ds-user-metrics", type: "dataset", label: "User Metrics",
    desc: "Aggregated user behaviour metrics. DAU, MAU, retention cohorts, conversion funnels. Updated nightly.",
    meta: {
      tags: [
        { tag: "metrics", weight: 0.98, source: "human" },
        { tag: "DAU", weight: 0.95, source: "human" },
        { tag: "retention", weight: 0.92, source: "ai" },
        { tag: "conversion", weight: 0.89, source: "ai" },
        { tag: "cohort", weight: 0.84, source: "ai" },
        { tag: "pii", weight: 0.71, source: "ai" },
      ],
      coverage: 100, freshness: 85, confidence: 0.91,
      source: "dbt / metrics layer", lastIndexed: "8h ago",
      aiAssisted: true, status: "Restricted", owner: "Analytics",
      rowCount: "12M", tableCount: 3,
    },
    edges: [
      { to: "domain-customer",  type: "part-of",  strength: 0.94, sharedTags: ["retention", "conversion"] },
      { to: "domain-legal",     type: "governs",  strength: 0.91, sharedTags: ["pii"] },
      { to: "ds-events",        type: "depends",  strength: 0.88, sharedTags: ["analytics"] },
      { to: "met-conversion",   type: "generates",strength: 0.96, sharedTags: ["conversion"] },
    ],
    documents: [],
  },
  "persona-analyst": {
    id: "persona-analyst", type: "persona", label: "Analyst Agent",
    desc: "Strategic analysis persona with broad read access. Specialised in quarterly reporting, planning briefs, and cross-domain synthesis.",
    meta: {
      tags: [
        { tag: "analysis", weight: 0.97, source: "human" },
        { tag: "reporting", weight: 0.94, source: "human" },
        { tag: "cross-domain", weight: 0.89, source: "ai" },
        { tag: "read-only", weight: 0.99, source: "human" },
        { tag: "planning", weight: 0.86, source: "human" },
      ],
      coverage: 88, freshness: 99, confidence: 0.95,
      status: "Allowed", owner: "Platform",
      accessDomains: 4, restrictedDomains: 2,
    },
    edges: [
      { to: "domain-product",  type: "references", strength: 0.72, sharedTags: ["planning", "roadmap"] },
      { to: "domain-customer", type: "references", strength: 0.68, sharedTags: ["analysis"] },
      { to: "doc-q4-roadmap",  type: "references", strength: 0.71, sharedTags: ["planning", "roadmap"] },
    ],
    documents: [],
  },
  "tr-support": {
    id: "tr-support", type: "training", label: "Support Examples v4",
    desc: "847 curated QA pairs from real support interactions. Used for fine-tuning and RAG grounding of the Support Bot persona.",
    meta: {
      tags: [
        { tag: "support", weight: 0.99, source: "human" },
        { tag: "QA-pairs", weight: 0.96, source: "human" },
        { tag: "fine-tuning", weight: 0.92, source: "human" },
        { tag: "RAG-grounding", weight: 0.88, source: "ai" },
        { tag: "customer", weight: 0.85, source: "ai" },
        { tag: "api-questions", weight: 0.77, source: "ai" },
      ],
      coverage: 94, freshness: 89, confidence: 0.94,
      exampleCount: 847, qualityScore: 94,
      status: "Internal", owner: "Dana Wu",
    },
    edges: [
      { to: "domain-customer",    type: "trained-on", strength: 0.88, sharedTags: ["support", "customer"] },
      { to: "domain-engineering", type: "trained-on", strength: 0.65, sharedTags: ["api-questions"] },
      { to: "persona-support",    type: "generates",  strength: 0.91, sharedTags: ["support"] },
    ],
    documents: [],
  },
  "pol-privacy": {
    id: "pol-privacy", type: "policy", label: "Privacy Policy v4.0",
    desc: "Public-facing privacy policy. Governs data collection, processing, retention, and user rights under GDPR, CCPA, and applicable regulations.",
    meta: {
      tags: [
        { tag: "privacy", weight: 0.99, source: "human" },
        { tag: "gdpr", weight: 0.97, source: "human" },
        { tag: "ccpa", weight: 0.91, source: "human" },
        { tag: "public", weight: 0.99, source: "human" },
        { tag: "user-rights", weight: 0.88, source: "ai" },
        { tag: "data-collection", weight: 0.85, source: "ai" },
      ],
      coverage: 100, freshness: 77, confidence: 0.99,
      source: "Legal CMS", lastIndexed: "1d ago",
      status: "Public", aiAssisted: false,
    },
    edges: [
      { to: "domain-legal",    type: "part-of",  strength: 0.99, sharedTags: ["privacy", "gdpr"] },
      { to: "pol-retention",   type: "semantic", strength: 0.84, sharedTags: ["data-collection", "gdpr"] },
      { to: "ds-user-metrics", type: "governs",  strength: 0.91, sharedTags: ["gdpr", "pii"] },
    ],
    documents: [],
  },
  "wf-onboarding": {
    id: "wf-onboarding", type: "workflow", label: "Onboarding Brief Gen",
    desc: "Automated workflow: triggered when a new employee joins. Traverses product and engineering domains, applies access filters, then generates a personalised knowledge brief.",
    meta: {
      tags: [
        { tag: "onboarding", weight: 0.99, source: "human" },
        { tag: "automated", weight: 0.97, source: "human" },
        { tag: "brief-generation", weight: 0.94, source: "human" },
        { tag: "access-filtering", weight: 0.91, source: "ai" },
        { tag: "slack", weight: 0.88, source: "human" },
      ],
      coverage: 95, freshness: 99, confidence: 0.93,
      status: "Internal", successRate: 98, runsThisMonth: 48,
    },
    edges: [
      { to: "domain-product",     type: "references", strength: 0.68, sharedTags: ["onboarding"] },
      { to: "domain-engineering", type: "references", strength: 0.71, sharedTags: ["onboarding"] },
      { to: "tr-support",         type: "trained-on", strength: 0.54, sharedTags: ["brief-generation"] },
    ],
    documents: [],
  },
  "mem-sprint": {
    id: "mem-sprint", type: "memory", label: "Sprint Decisions",
    desc: "Persistent memory of sprint-level decisions, trade-offs, and context notes added by the team. Auto-summarised weekly.",
    meta: {
      tags: [
        { tag: "decisions", weight: 0.96, source: "ai" },
        { tag: "sprint", weight: 0.94, source: "human" },
        { tag: "context", weight: 0.89, source: "ai" },
        { tag: "q4-planning", weight: 0.82, source: "human" },
        { tag: "trade-offs", weight: 0.78, source: "ai" },
      ],
      coverage: 91, freshness: 94, confidence: 0.87,
      status: "Summary Only", aiAssisted: true,
    },
    edges: [
      { to: "domain-product",  type: "part-of",    strength: 0.84, sharedTags: ["q4-planning"] },
      { to: "doc-q4-roadmap",  type: "references", strength: 0.92, sharedTags: ["q4-planning", "OKR"] },
      { to: "domain-engineering", type: "semantic", strength: 0.61, sharedTags: ["decisions"] },
    ],
    documents: [],
  },
  "doc-feature-faq": {
    id: "doc-feature-faq", type: "faq", label: "Feature FAQ",
    desc: "Curated FAQ about product features. Covers top 40 questions from sales, support, and customer onboarding. Updated monthly.",
    meta: {
      tags: [
        { tag: "FAQ", weight: 0.99, source: "human" },
        { tag: "features", weight: 0.95, source: "human" },
        { tag: "sales-enablement", weight: 0.88, source: "ai" },
        { tag: "public", weight: 0.99, source: "human" },
      ],
      coverage: 88, freshness: 71, confidence: 0.92,
      status: "Public", chunkCount: 40,
    },
    edges: [
      { to: "domain-product", type: "part-of",  strength: 0.95, sharedTags: ["features"] },
      { to: "doc-q4-roadmap", type: "semantic", strength: 0.79, sharedTags: ["features"] },
    ],
    documents: [],
  },
  "met-dau": {
    id: "met-dau", type: "metric", label: "DAU",
    desc: "Daily Active Users. Core product health metric. Computed from events stream, segmented by plan tier and geography.",
    meta: {
      tags: [
        { tag: "DAU", weight: 0.99, source: "human" },
        { tag: "engagement", weight: 0.92, source: "ai" },
        { tag: "kpi", weight: 0.90, source: "human" },
        { tag: "daily", weight: 0.88, source: "human" },
      ],
      coverage: 100, freshness: 99,
      status: "Internal",
    },
    edges: [
      { to: "ds-events",      type: "depends",   strength: 0.95, sharedTags: ["analytics"] },
      { to: "ds-user-metrics",type: "part-of",   strength: 0.88, sharedTags: ["metrics"] },
    ],
    documents: [],
  },
  "persona-support": {
    id: "persona-support", type: "persona", label: "Support Bot",
    desc: "Customer-facing support agent. Trained on support examples and customer domain. Limited to public and summary-level access.",
    meta: {
      tags: [
        { tag: "support", weight: 0.99, source: "human" },
        { tag: "customer-facing", weight: 0.97, source: "human" },
        { tag: "limited-access", weight: 0.95, source: "human" },
        { tag: "RAG", weight: 0.88, source: "ai" },
      ],
      coverage: 71, freshness: 99,
      status: "Allowed", accessDomains: 2, restrictedDomains: 4,
    },
    edges: [
      { to: "domain-customer", type: "references", strength: 0.89, sharedTags: ["support"] },
      { to: "tr-support",      type: "trained-on", strength: 0.91, sharedTags: ["support", "RAG"] },
    ],
    documents: [],
  },
  "dec-ship-v3": {
    id: "dec-ship-v3", type: "decision", label: "Ship v3 API",
    desc: "Architecture decision record for v3 API release. Covers breaking changes, migration path, deprecation timeline, and rollout strategy.",
    meta: {
      tags: [
        { tag: "ADR", weight: 0.98, source: "human" },
        { tag: "api-v3", weight: 0.97, source: "human" },
        { tag: "breaking-changes", weight: 0.94, source: "human" },
        { tag: "migration", weight: 0.91, source: "ai" },
        { tag: "deprecation", weight: 0.88, source: "ai" },
      ],
      coverage: 100, freshness: 88,
      status: "Internal",
    },
    edges: [
      { to: "domain-engineering", type: "part-of",    strength: 0.92, sharedTags: ["api", "architecture"] },
      { to: "doc-api-ref",        type: "references", strength: 0.96, sharedTags: ["api-v3"] },
    ],
    documents: [],
  },
  "doc-api-ref": {
    id: "doc-api-ref", type: "document", label: "API Reference v3.1",
    desc: "Complete API reference for v3.1. Includes all endpoints, request/response schemas, authentication flows, rate limits, and SDK examples.",
    meta: {
      tags: [
        { tag: "api", weight: 0.99, source: "human" },
        { tag: "reference", weight: 0.98, source: "human" },
        { tag: "authentication", weight: 0.91, source: "ai" },
        { tag: "sdk", weight: 0.88, source: "ai" },
        { tag: "public", weight: 0.99, source: "human" },
        { tag: "developer", weight: 0.92, source: "ai" },
      ],
      coverage: 100, freshness: 95,
      status: "Public", chunkCount: 67,
    },
    edges: [
      { to: "domain-engineering", type: "part-of",    strength: 0.98, sharedTags: ["api"] },
      { to: "dec-ship-v3",        type: "cites",      strength: 0.96, sharedTags: ["api-v3"] },
    ],
    documents: [],
  },
  "pol-retention": {
    id: "pol-retention", type: "policy", label: "Data Retention Policy",
    desc: "Defines retention periods for all data categories. Default 90 days for event data; 7 years for financial records; immediate deletion on user request.",
    meta: {
      tags: [
        { tag: "data-retention", weight: 0.99, source: "human" },
        { tag: "compliance", weight: 0.97, source: "human" },
        { tag: "deletion", weight: 0.91, source: "human" },
        { tag: "financial-records", weight: 0.88, source: "human" },
      ],
      coverage: 100, freshness: 77,
      status: "Public", aiAssisted: false,
    },
    edges: [
      { to: "domain-legal", type: "part-of",  strength: 0.98, sharedTags: ["compliance", "data-retention"] },
      { to: "pol-privacy",  type: "semantic", strength: 0.84, sharedTags: ["gdpr", "compliance"] },
    ],
    documents: [],
  },
  "met-conversion": {
    id: "met-conversion", type: "metric", label: "Conversion Rate",
    desc: "Free-to-paid conversion rate. Tracked daily, segmented by acquisition channel and onboarding cohort.",
    meta: {
      tags: [
        { tag: "conversion", weight: 0.99, source: "human" },
        { tag: "kpi", weight: 0.94, source: "human" },
        { tag: "revenue", weight: 0.88, source: "ai" },
        { tag: "funnel", weight: 0.85, source: "ai" },
      ],
      coverage: 100, freshness: 85,
      status: "Internal",
    },
    edges: [
      { to: "ds-user-metrics", type: "depends", strength: 0.96, sharedTags: ["conversion"] },
    ],
    documents: [],
  },
  "doc-user-res": {
    id: "doc-user-res", type: "document", label: "User Research 2024",
    desc: "Mixed-methods research report. Interviews, surveys, and usability sessions with 120 users across 3 segments.",
    meta: {
      tags: [
        { tag: "user-research", weight: 0.99, source: "human" },
        { tag: "interviews", weight: 0.94, source: "human" },
        { tag: "usability", weight: 0.91, source: "ai" },
        { tag: "insights", weight: 0.88, source: "ai" },
        { tag: "2024", weight: 0.85, source: "human" },
      ],
      coverage: 100, freshness: 82,
      status: "Internal",
    },
    edges: [
      { to: "domain-customer", type: "part-of",  strength: 0.96, sharedTags: ["user-research"] },
      { to: "domain-product",  type: "semantic", strength: 0.74, sharedTags: ["insights", "user-research"] },
    ],
    documents: [],
  },
};

// ─── Mermaid Generator ────────────────────────────────────────────
function generateMermaid(centerNode, nodes, depth = 2) {
  const visited = new Set();
  const lines = ["graph LR"];
  const sanitize = (s) => s.replace(/[^a-zA-Z0-9_]/g, "_");
  const quote = (s) => `["${s.replace(/"/g, "'")}"]`;
  const nodeIds = new Set();

  const traverse = (nodeId, currentDepth) => {
    if (visited.has(nodeId) || currentDepth > depth) return;
    visited.add(nodeId);
    const node = nodes[nodeId];
    if (!node) return;
    const nid = sanitize(nodeId);
    if (!nodeIds.has(nid)) {
      const typeLabel = NT[node.type]?.label || node.type;
      lines.push(`  ${nid}${quote(`${node.label}\\n[${typeLabel}]`)}`);
      nodeIds.add(nid);
    }
    node.edges?.forEach(edge => {
      const tid = sanitize(edge.to);
      const target = nodes[edge.to];
      if (!target) return;
      if (!nodeIds.has(tid)) {
        const typeLabel = NT[target.type]?.label || target.type;
        lines.push(`  ${tid}${quote(`${target.label}\\n[${typeLabel}]`)}`);
        nodeIds.add(tid);
      }
      const edgeLabel = EDGE_TYPES[edge.type]?.label || edge.type;
      const arrow = edge.type === "governs" || edge.type === "trained-on" ? "-.->" : "-->";
      lines.push(`  ${nid} ${arrow}|"${edgeLabel}"| ${tid}`);
      traverse(edge.to, currentDepth + 1);
    });
  };

  traverse(centerNode, 0);
  // Styling
  lines.push("");
  lines.push("  %% Styles");
  Object.entries(NT).forEach(([type, t]) => {
    const color = t.color.replace("#", "");
    lines.push(`  classDef ${type} fill:#${color}22,stroke:#${color},color:#${color}`);
  });
  // Apply styles
  visited.forEach(nodeId => {
    const node = nodes[nodeId];
    if (node) lines.push(`  class ${sanitize(nodeId)} ${node.type}`);
  });

  return lines.join("\n");
}

// ─── Tiny shared components ───────────────────────────────────────
const Chip = ({ label }) => {
  const map = {
    "Public": { bg: "#DCFCE7", txt: "#15803D" },
    "Internal": { bg: "#DBEAFE", txt: "#1D4ED8" },
    "Confidential": { bg: "#FEF9C3", txt: "#92400E" },
    "Restricted": { bg: "#FEE2E2", txt: "#B91C1C" },
    "Allowed": { bg: "#CCFBF1", txt: "#0F766E" },
    "Denied": { bg: "#FEE2E2", txt: "#B91C1C" },
    "Summary Only": { bg: "#F3E8FF", txt: "#7E22CE" },
    "Ready": { bg: "#DCFCE7", txt: "#15803D" },
    "human": { bg: "#DBEAFE", txt: "#1D4ED8" },
    "ai": { bg: "#EDE9FE", txt: "#6D28D9" },
  };
  const s = map[label] || { bg: "#F1F5F9", txt: "#64748B" };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: s.bg, color: s.txt, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
};

const NodeIcon = ({ type, size = 14, color }) => {
  const t = NT[type];
  if (!t) return null;
  const Icon = t.Icon;
  return <Icon size={size} color={color || t.color} />;
};

const NodeBadge = ({ type }) => {
  const t = NT[type] || NT.document;
  const Icon = t.Icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: t.bg, color: t.color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
      <Icon size={11} />{t.label}
    </span>
  );
};

const WeightBar = ({ weight, color }) => (
  <div style={{ flex: 1, height: 4, background: C.borderLight, borderRadius: 2, overflow: "hidden", maxWidth: 60 }}>
    <div style={{ width: `${weight * 100}%`, height: "100%", background: color || C.accent, borderRadius: 2 }} />
  </div>
);

// ─── Node Diagram (SVG) ───────────────────────────────────────────
const NodeDiagram = ({ centerNode, nodes, onNavigate, highlightId }) => {
  const node = nodes[centerNode];
  if (!node) return null;

  const cx = 400, cy = 240;
  const edges = node.edges || [];
  const maxNodes = Math.min(edges.length, 8);
  const radius = 165;

  const positions = edges.slice(0, maxNodes).map((_, i) => {
    const angle = (i / maxNodes) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });

  return (
    <svg width="100%" viewBox="0 0 800 480" style={{ overflow: "visible" }}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
        </marker>
        <marker id="arr-dashed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round" />
        </marker>
        {edges.slice(0, maxNodes).map((e, i) => (
          <marker key={i} id={`arr-${i}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke={EDGE_TYPES[e.type]?.color || "#CBD5E1"} strokeWidth="1.5" strokeLinecap="round" />
          </marker>
        ))}
      </defs>

      {/* Grid dots */}
      {Array.from({ length: 25 }, (_, i) => Array.from({ length: 15 }, (_, j) => (
        <circle key={`${i}-${j}`} cx={i * 34} cy={j * 34} r={1.2} fill="#DDE3EE" opacity={0.6} />
      )))}

      {/* Edges */}
      {edges.slice(0, maxNodes).map((edge, i) => {
        const pos = positions[i];
        const et = EDGE_TYPES[edge.type];
        const dx = pos.x - cx, dy = pos.y - cy;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len, uy = dy / len;
        const x1 = cx + ux * 46, y1 = cy + uy * 46;
        const x2 = pos.x - ux * 36, y2 = pos.y - uy * 36;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 18;
        const isDashed = et?.style === "dashed" || et?.style === "dotted";
        const isHighlight = edge.to === highlightId;

        return (
          <g key={i}>
            <path
              d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
              fill="none"
              stroke={isHighlight ? et?.color || C.accent : isDashed ? (et?.color || "#94A3B8") + "80" : (et?.color || "#CBD5E1") + "90"}
              strokeWidth={isHighlight ? 2.5 : edge.strength * 2.2}
              strokeDasharray={isDashed ? "5,4" : et?.style === "dotted" ? "2,4" : "none"}
              markerEnd={`url(#arr-${i})`}
              opacity={isHighlight ? 1 : 0.6}
            />
            {/* Strength bubble */}
            <circle cx={mx} cy={my} r={12} fill={C.bgSurface} stroke={(et?.color || "#CBD5E1") + "50"} strokeWidth={0.5} />
            <text x={mx} y={my} textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: "9px", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fill: et?.color || C.txtMuted }}>
              {Math.round(edge.strength * 100)}
            </text>
          </g>
        );
      })}

      {/* Peripheral nodes */}
      {edges.slice(0, maxNodes).map((edge, i) => {
        const pos = positions[i];
        const target = nodes[edge.to];
        if (!target) return null;
        const nt = NT[target.type] || NT.document;
        const Icon = nt.Icon;
        const isHighlight = edge.to === highlightId;

        return (
          <g key={i} onClick={() => onNavigate(edge.to)} style={{ cursor: "pointer" }}>
            <circle cx={pos.x} cy={pos.y} r={isHighlight ? 36 : 30}
              fill={isHighlight ? nt.color + "25" : nt.bg}
              stroke={isHighlight ? nt.color : nt.color + "70"}
              strokeWidth={isHighlight ? 2 : 1.5}
            />
            <foreignObject x={pos.x - 11} y={pos.y - 18} width={22} height={22}>
              <Icon size={18} color={nt.color} style={{ display: "block" }} />
            </foreignObject>
            {/* Label */}
            {target.label.split(" ").slice(0, 2).map((word, wi) => (
              <text key={wi} x={pos.x} y={pos.y + 38 + wi * 13}
                textAnchor="middle" dominantBaseline="central"
                style={{ fontSize: "10px", fontFamily: "'DM Sans', sans-serif", fontWeight: isHighlight ? 700 : 500, fill: isHighlight ? nt.color : C.txtSec }}>
                {word}
              </text>
            ))}
            {/* Edge type label */}
            <text x={pos.x} y={pos.y - 43}
              textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: "8.5px", fontFamily: "'DM Sans', sans-serif", fill: (EDGE_TYPES[edge.type]?.color || C.txtMuted) + "CC" }}>
              {edge.type}
            </text>
          </g>
        );
      })}

      {/* Center node */}
      <circle cx={cx} cy={cy} r={52} fill={C.bgSurface} stroke={C.accent} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={58} fill="none" stroke={C.accent} strokeWidth={0.5} strokeOpacity={0.3} />
      <foreignObject x={cx - 16} y={cy - 28} width={32} height={32}>
        {(() => { const t = NT[node.type]; const Icon = t?.Icon || Globe; return <Icon size={28} color={t?.color || C.accent} style={{ display: "block" }} />; })()}
      </foreignObject>
      <text x={cx} y={cy + 20} textAnchor="middle"
        style={{ fontSize: "12px", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fill: C.txt }}>
        {node.label.split(" ").slice(0, 2).join(" ")}
      </text>
      <text x={cx} y={cy + 35} textAnchor="middle"
        style={{ fontSize: "9px", fontFamily: "'DM Sans', sans-serif", fill: C.txtMuted }}>
        {edges.length} connections
      </text>
    </svg>
  );
};

// ─── Mermaid Export Modal ─────────────────────────────────────────
const MermaidModal = ({ nodeId, nodes, onClose }) => {
  const [depth, setDepth] = useState(2);
  const [copied, setCopied] = useState(false);
  const code = useMemo(() => generateMermaid(nodeId, nodes, depth), [nodeId, nodes, depth]);

  const copy = () => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: C.bgSurface, borderRadius: 16, width: 760, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${C.border}` }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.txt, margin: 0, fontFamily: "'Sora', sans-serif" }}>Mermaid Export</h2>
            <p style={{ fontSize: 12, color: C.txtMuted, margin: "3px 0 0", fontFamily: "'DM Sans', sans-serif" }}>Exportable diagram syntax for {nodes[nodeId]?.label}</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: C.txtSec, fontFamily: "'DM Sans', sans-serif" }}>Depth</span>
              {[1, 2, 3].map(d => (
                <button key={d} onClick={() => setDepth(d)} style={{
                  width: 28, height: 28, borderRadius: 6, border: `1px solid ${depth === d ? C.accent : C.border}`,
                  background: depth === d ? C.accentLight : "transparent", cursor: "pointer",
                  fontSize: 12, fontWeight: depth === d ? 700 : 400, color: depth === d ? C.accent : C.txtSec,
                }}>{d}</button>
              ))}
            </div>
            <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: copied ? C.successBg : C.bgSubtle, cursor: "pointer", fontSize: 12, fontWeight: 600, color: copied ? C.successTxt : C.txtSec, fontFamily: "'DM Sans', sans-serif" }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgSubtle, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} color={C.txtSec} />
            </button>
          </div>
        </div>
        {/* Preview */}
        <div style={{ background: "#0D1117", padding: 24, flex: 1, overflow: "auto" }}>
          <pre style={{ margin: 0, fontSize: 12, fontFamily: "monospace", color: "#E6EDF3", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {code.split("\n").map((line, i) => {
              let color = "#E6EDF3";
              if (line.trim().startsWith("graph")) color = "#FF7B72";
              else if (line.includes("-->") || line.includes("-.->")) color = "#79C0FF";
              else if (line.includes("classDef")) color = "#A5D6FF";
              else if (line.includes("class ")) color = "#D2A8FF";
              else if (line.includes("%%")) color = "#8B949E";
              else if (line.includes("[\"")) color = "#FFA657";
              return <span key={i} style={{ color, display: "block" }}>{line}</span>;
            })}
          </pre>
        </div>
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
          <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgSubtle, cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.txtSec, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Download size={13} />Download .mmd
          </button>
          <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgSubtle, cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.txtSec, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <ArrowUpRight size={13} />Open in Mermaid Live
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Tag Editor ───────────────────────────────────────────────────
const TagEditor = ({ tags, onAdd, onUpdate }) => {
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState("");

  const submit = () => {
    if (!newTag.trim()) return;
    onAdd({ tag: newTag.trim().toLowerCase().replace(/\s+/g, "-"), weight: 0.75, source: "human" });
    setNewTag(""); setAdding(false);
  };

  return (
    <div>
      {tags.map((t, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
          <span style={{
            padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
            background: t.source === "human" ? C.infoBg : C.purpleBg,
            color: t.source === "human" ? C.infoTxt : C.purpleTxt,
            fontFamily: "'DM Sans', sans-serif",
          }}>#{t.tag}</span>
          <WeightBar weight={t.weight} color={NT[Object.keys(NT)[0]]?.color} />
          <span style={{ fontSize: 10, color: C.txtMuted, minWidth: 28, textAlign: "right" }}>{Math.round(t.weight * 100)}%</span>
          <Chip label={t.source} />
          <button onClick={() => onUpdate(i, { ...t, weight: Math.min(1, t.weight + 0.05) })} style={{ border: "none", background: "none", cursor: "pointer", padding: "2px 4px", color: C.success, fontSize: 10, fontWeight: 700 }}>▲</button>
          <button onClick={() => onUpdate(i, { ...t, weight: Math.max(0, t.weight - 0.05) })} style={{ border: "none", background: "none", cursor: "pointer", padding: "2px 4px", color: C.danger, fontSize: 10, fontWeight: 700 }}>▼</button>
        </div>
      ))}
      {adding ? (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input autoFocus value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="new-tag-name" style={{ flex: 1, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.accent}`, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", color: C.txt }} />
          <button onClick={submit} style={{ padding: "4px 10px", borderRadius: 6, background: C.accent, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Add</button>
          <button onClick={() => setAdding(false)} style={{ padding: "4px 8px", borderRadius: 6, background: C.bgSubtle, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 12 }}>✕</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 0", border: "none", background: "none", cursor: "pointer", fontSize: 11, color: C.accent, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginTop: 6 }}>
          <Plus size={12} />Add meta tag
        </button>
      )}
    </div>
  );
};

// ─── Main Explorer ────────────────────────────────────────────────
export default function GraphExplorer() {
  const [nodes, setNodes] = useState(NODES);
  const [currentId, setCurrentId] = useState("domain-product");
  const [history, setHistory] = useState(["domain-product"]);
  const [histIdx, setHistIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [highlightEdge, setHighlightEdge] = useState(null);
  const [showMermaid, setShowMermaid] = useState(false);
  const [activeTab, setActiveTab] = useState("Meta");
  const [diagramDepth, setDiagramDepth] = useState(1);
  const [stepMode, setStepMode] = useState("relations"); // "relations" | "documents" | "chunks"

  const node = nodes[currentId];
  const edges = node?.edges || [];
  const docs = node?.documents || [];
  const chunks = node?.chunks || [];

  const navigateTo = useCallback((id) => {
    if (!nodes[id]) return;
    setCurrentId(id);
    setHistory(prev => [...prev.slice(0, histIdx + 1), id]);
    setHistIdx(prev => prev + 1);
    setStepIdx(0);
    setHighlightEdge(null);
  }, [histIdx, nodes]);

  const goBack = () => {
    if (histIdx > 0) { setHistIdx(histIdx - 1); setCurrentId(history[histIdx - 1]); setStepIdx(0); }
  };
  const goFwd = () => {
    if (histIdx < history.length - 1) { setHistIdx(histIdx + 1); setCurrentId(history[histIdx + 1]); setStepIdx(0); }
  };

  const stepItems = stepMode === "relations" ? edges : stepMode === "documents" ? docs : chunks;
  const currentStep = stepItems[stepIdx];

  const prevStep = () => {
    const newIdx = (stepIdx - 1 + stepItems.length) % stepItems.length;
    setStepIdx(newIdx);
    if (stepMode === "relations") setHighlightEdge(stepItems[newIdx]?.to || null);
  };
  const nextStep = () => {
    const newIdx = (stepIdx + 1) % stepItems.length;
    setStepIdx(newIdx);
    if (stepMode === "relations") setHighlightEdge(stepItems[newIdx]?.to || null);
  };

  // Sync highlight when step changes
  useEffect(() => {
    if (stepMode === "relations" && edges[stepIdx]) setHighlightEdge(edges[stepIdx].to);
    else setHighlightEdge(null);
  }, [stepIdx, stepMode, currentId]);

  const updateNodeTag = (nodeId, tagIdx, newTag) => {
    setNodes(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        meta: {
          ...prev[nodeId].meta,
          tags: prev[nodeId].meta.tags.map((t, i) => i === tagIdx ? newTag : t),
        },
      },
    }));
  };

  const addNodeTag = (nodeId, tag) => {
    setNodes(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        meta: {
          ...prev[nodeId].meta,
          tags: [...(prev[nodeId].meta.tags || []), tag],
        },
      },
    }));
  };

  if (!node) return <div style={{ padding: 40, color: C.txtMuted }}>Node not found</div>;

  const nt = NT[node.type] || NT.document;
  const meta = node.meta || {};
  const tags = meta.tags || [];

  const stepLabel = stepMode === "relations" ? `${stepIdx + 1} / ${edges.length} relations` :
    stepMode === "documents" ? `${stepIdx + 1} / ${docs.length} documents` :
    `${stepIdx + 1} / ${chunks.length} chunks`;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "'DM Sans', sans-serif", background: C.bgApp }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap'); * { box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; height: 4px; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }`}</style>

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", height: 54, background: C.bgSurface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {/* Nav */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { Icon: ArrowLeft, action: goBack, disabled: histIdx === 0 },
            { Icon: ArrowRight, action: goFwd, disabled: histIdx >= history.length - 1 },
          ].map(({ Icon, action, disabled }, i) => (
            <button key={i} onClick={action} disabled={disabled} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: disabled ? C.bgSubtle : C.bgSurface, cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: disabled ? 0.4 : 1 }}>
              <Icon size={13} color={C.txtSec} />
            </button>
          ))}
        </div>

        {/* Breadcrumb trail */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, flex: 1, overflow: "hidden" }}>
          {history.slice(Math.max(0, histIdx - 3), histIdx + 1).map((id, i, arr) => {
            const n = nodes[id];
            const isLast = i === arr.length - 1;
            return (
              <span key={id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <ChevronRight size={12} color={C.txtMuted} />}
                <button onClick={() => { setCurrentId(id); setHistIdx(history.indexOf(id)); setStepIdx(0); }} style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "3px 7px", borderRadius: 5, border: "none",
                  background: isLast ? (NT[n?.type]?.bg || C.accentLight) : "transparent",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>
                  {n && <NodeIcon type={n.type} size={12} color={isLast ? (NT[n.type]?.color) : C.txtMuted} />}
                  <span style={{ fontSize: 12, fontWeight: isLast ? 700 : 400, color: isLast ? (NT[n?.type]?.color || C.accent) : C.txtMuted, whiteSpace: "nowrap" }}>{n?.label?.split(" ").slice(0, 3).join(" ") || id}</span>
                </button>
              </span>
            );
          })}
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", background: C.bgSubtle, borderRadius: 7, padding: 2, border: `1px solid ${C.border}` }}>
            {["relations", "documents", "chunks"].map(m => (
              <button key={m} onClick={() => { setStepMode(m); setStepIdx(0); }} style={{
                padding: "3px 10px", borderRadius: 5, border: "none", cursor: "pointer", fontSize: 11, fontWeight: stepMode === m ? 600 : 400,
                background: stepMode === m ? C.bgSurface : "transparent",
                color: stepMode === m ? C.accent : C.txtMuted,
                boxShadow: stepMode === m ? `0 1px 3px rgba(0,0,0,0.08)` : "none",
                transition: "all 0.12s",
              }}>{m}</button>
            ))}
          </div>
          <button onClick={() => setShowMermaid(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgSubtle, cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.txtSec }}>
            <Code2 size={13} />Export Mermaid
          </button>
        </div>
      </div>

      {/* ── Main 3-Panel Layout ──────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT: Current Node Detail ─────────────────────────── */}
        <div style={{ width: 280, borderRight: `1px solid ${C.border}`, background: C.bgSurface, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
          {/* Node header */}
          <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.border}`, background: `linear-gradient(160deg, ${nt.bg} 0%, ${C.bgSurface} 100%)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: nt.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${nt.color}40` }}>
                <NodeIcon type={node.type} size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.txt, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em", lineHeight: 1.3 }}>{node.label}</h3>
                <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                  <NodeBadge type={node.type} />
                  {meta.status && <Chip label={meta.status} />}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11.5, color: C.txtSec, lineHeight: 1.7, margin: 0 }}>{node.desc}</p>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
            {[
              ["Connections", edges.length],
              ["Coverage", meta.coverage ? `${meta.coverage}%` : "—"],
              ["Confidence", meta.confidence ? `${Math.round(meta.confidence * 100)}%` : "—"],
            ].map(([k, v], i) => (
              <div key={i} style={{ flex: 1, padding: "8px 10px", textAlign: "center", borderRight: i < 2 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, fontFamily: "'Sora', sans-serif" }}>{v}</div>
                <div style={{ fontSize: 9, color: C.txtMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{k}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
            {["Meta", "Info", "Access"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                flex: 1, padding: "7px 0", border: "none", background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: activeTab === t ? 700 : 400,
                color: activeTab === t ? C.accent : C.txtMuted,
                borderBottom: activeTab === t ? `2px solid ${C.accent}` : "2px solid transparent", marginBottom: -1,
              }}>{t}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            {activeTab === "Meta" && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.txtMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Vector Meta Tags</div>
                <TagEditor
                  tags={tags}
                  onAdd={tag => addNodeTag(currentId, tag)}
                  onUpdate={(i, t) => updateNodeTag(currentId, i, t)}
                />
                <div style={{ borderTop: `1px solid ${C.borderLight}`, marginTop: 14, paddingTop: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.txtMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Index Info</div>
                  {[
                    meta.source && ["Source", meta.source],
                    meta.vectorDims && ["Dimensions", meta.vectorDims],
                    meta.embeddingModel && ["Model", meta.embeddingModel.split("-").slice(-1)[0]],
                    meta.chunkCount && ["Chunks", meta.chunkCount],
                    meta.lastIndexed && ["Last indexed", meta.lastIndexed],
                    meta.aiAssisted !== undefined && ["AI assisted", meta.aiAssisted ? "Yes" : "No"],
                  ].filter(Boolean).map(([k, v], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.borderLight}` }}>
                      <span style={{ fontSize: 11, color: C.txtMuted }}>{k}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.txt }}>{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {activeTab === "Info" && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.txtMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Properties</div>
                {[
                  meta.owner && ["Owner", meta.owner],
                  meta.fileSize && ["File size", meta.fileSize],
                  meta.rowCount && ["Rows", meta.rowCount],
                  meta.tableCount && ["Tables", meta.tableCount],
                  meta.exampleCount && ["Examples", meta.exampleCount],
                  meta.qualityScore && ["Quality", `${meta.qualityScore}%`],
                  meta.accessDomains && ["Access domains", meta.accessDomains],
                  meta.successRate && ["Success rate", `${meta.successRate}%`],
                  meta.runsThisMonth && ["Runs / month", meta.runsThisMonth],
                ].filter(Boolean).map(([k, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.borderLight}` }}>
                    <span style={{ fontSize: 11, color: C.txtMuted }}>{k}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.txt }}>{v}</span>
                  </div>
                ))}
                {/* Freshness bar */}
                {meta.freshness && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: C.txtMuted }}>Freshness</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: meta.freshness >= 85 ? C.successTxt : meta.freshness >= 65 ? C.warningTxt : C.dangerTxt }}>{meta.freshness}%</span>
                    </div>
                    <div style={{ height: 5, background: C.borderLight, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${meta.freshness}%`, height: "100%", background: meta.freshness >= 85 ? C.success : meta.freshness >= 65 ? C.warning : C.danger, borderRadius: 3 }} />
                    </div>
                  </div>
                )}
              </>
            )}
            {activeTab === "Access" && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.txtMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Access Control</div>
                {[
                  ["Analyst Agent", "Allowed"],
                  ["Support Bot", node.type === "policy" || meta.status === "Public" ? "Allowed" : "Summary Only"],
                  ["External API", meta.status === "Public" ? "Allowed" : "Denied"],
                  ["Research Agent", meta.status === "Confidential" ? "Denied" : "Summary Only"],
                ].map(([p, l], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 3 ? `1px solid ${C.borderLight}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Bot size={12} color={C.accent} />
                      </div>
                      <span style={{ fontSize: 11, color: C.txt }}>{p}</span>
                    </div>
                    <Chip label={l} />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── CENTER: Diagram + Step Navigator ─────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Diagram area */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#F8FAFF" }}>
            {/* Dot grid */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #C8D5E8 1.2px, transparent 1.2px)", backgroundSize: "30px 30px", opacity: 0.7 }} />
            <div style={{ position: "absolute", inset: 0 }}>
              <NodeDiagram centerNode={currentId} nodes={nodes} onNavigate={navigateTo} highlightId={highlightEdge} />
            </div>

            {/* Floating depth control */}
            <div style={{ position: "absolute", top: 14, right: 14, background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={12} color={C.txtMuted} />
              <span style={{ fontSize: 10, fontWeight: 700, color: C.txtMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Depth</span>
              {[1, 2].map(d => (
                <button key={d} onClick={() => setDiagramDepth(d)} style={{
                  width: 22, height: 22, borderRadius: 4, border: `1px solid ${diagramDepth === d ? C.accent : C.border}`,
                  background: diagramDepth === d ? C.accentLight : "transparent",
                  cursor: "pointer", fontSize: 10, fontWeight: 700, color: diagramDepth === d ? C.accent : C.txtMuted,
                }}>{d}</button>
              ))}
            </div>

            {/* Edge type legend */}
            <div style={{ position: "absolute", bottom: 14, left: 14, background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.txtMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Relationship Types</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                {Object.entries(EDGE_TYPES).slice(0, 6).map(([key, t]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 16, height: 2, background: t.color, borderRadius: 1, borderTop: t.style === "dashed" ? `2px dashed ${t.color}` : t.style === "dotted" ? `2px dotted ${t.color}` : "none", opacity: 0.8 }} />
                    <span style={{ fontSize: 9, color: C.txtSec }}>{key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Step-Through Bar ──────────────────────────────── */}
          <div style={{ borderTop: `1px solid ${C.border}`, background: C.bgSurface, flexShrink: 0 }}>
            {/* Step info card */}
            {currentStep && (
              <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: 14 }}>
                {stepMode === "relations" && currentStep.to && nodes[currentStep.to] && (() => {
                  const target = nodes[currentStep.to];
                  const nt2 = NT[target.type] || NT.document;
                  return (
                    <>
                      <div style={{ width: 38, height: 38, borderRadius: 9, background: nt2.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${nt2.color}50` }}>
                        <NodeIcon type={target.type} size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>{target.label}</span>
                          <NodeBadge type={target.type} />
                          {target.meta?.status && <Chip label={target.meta.status} />}
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontSize: 10, color: C.txtMuted }}>Relationship:</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: EDGE_TYPES[currentStep.type]?.color || C.accent }}>{currentStep.type}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontSize: 10, color: C.txtMuted }}>Strength:</span>
                            <div style={{ width: 44, height: 4, background: C.borderLight, borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ width: `${currentStep.strength * 100}%`, height: "100%", background: EDGE_TYPES[currentStep.type]?.color || C.accent, borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: C.txtSec }}>{Math.round(currentStep.strength * 100)}%</span>
                          </div>
                          {currentStep.sharedTags?.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ fontSize: 10, color: C.txtMuted }}>Shared tags:</span>
                              {currentStep.sharedTags.slice(0, 3).map((t, i) => (
                                <span key={i} style={{ fontSize: 10, fontWeight: 600, color: C.accent, background: C.accentLight, padding: "1px 6px", borderRadius: 3 }}>#{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => navigateTo(currentStep.to)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgSubtle, cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.txtSec, flexShrink: 0 }}>
                        Dive In <CornerDownRight size={13} />
                      </button>
                    </>
                  );
                })()}

                {stepMode === "documents" && currentStep && (
                  <>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: C.infoBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={18} color={C.info} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>{currentStep.title}</span>
                        {currentStep.status && <Chip label={currentStep.status} />}
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <span style={{ fontSize: 11, color: C.txtMuted }}>Relevance:</span>
                        <div style={{ width: 50, height: 4, background: C.borderLight, borderRadius: 2, overflow: "hidden", alignSelf: "center" }}>
                          <div style={{ width: `${(currentStep.relevance || 0) * 100}%`, height: "100%", background: C.accent, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.txtSec }}>{Math.round((currentStep.relevance || 0) * 100)}%</span>
                      </div>
                    </div>
                    <button onClick={() => nodes[currentStep.id] && navigateTo(currentStep.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgSubtle, cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.txtSec, flexShrink: 0 }}>
                      Open <ArrowUpRight size={13} />
                    </button>
                  </>
                )}

                {stepMode === "chunks" && currentStep && (
                  <>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: C.tealBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <AlignLeft size={18} color={C.teal} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: C.txt, lineHeight: 1.6, marginBottom: 5 }}>{currentStep.text}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {(currentStep.tags || []).map((t, i) => (
                          <span key={i} style={{ fontSize: 10, fontWeight: 600, color: C.accent, background: C.accentLight, padding: "1px 6px", borderRadius: 3 }}>#{t}</span>
                        ))}
                        <span style={{ fontSize: 10, color: C.txtMuted, marginLeft: 4 }}>Relevance: {Math.round((currentStep.relevance || 0) * 100)}%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Navigation controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px" }}>
              <button onClick={prevStep} disabled={stepItems.length === 0} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.bgSubtle, cursor: stepItems.length === 0 ? "not-allowed" : "pointer",
                fontSize: 12, fontWeight: 600, color: C.txtSec, opacity: stepItems.length === 0 ? 0.4 : 1,
              }}><ChevronLeft size={14} />Prev</button>

              {/* Step dots */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                {stepItems.slice(0, 10).map((_, i) => (
                  <button key={i} onClick={() => { setStepIdx(i); if (stepMode === "relations") setHighlightEdge(edges[i]?.to || null); }} style={{
                    width: i === stepIdx ? 20 : 7, height: 7, borderRadius: 4, border: "none", cursor: "pointer",
                    background: i === stepIdx ? C.accent : C.border, transition: "all 0.2s", padding: 0,
                  }} />
                ))}
                {stepItems.length > 10 && <span style={{ fontSize: 10, color: C.txtMuted }}>+{stepItems.length - 10}</span>}
              </div>

              <span style={{ fontSize: 11, color: C.txtMuted, minWidth: 80, textAlign: "center" }}>{stepItems.length > 0 ? stepLabel : `No ${stepMode}`}</span>

              <button onClick={nextStep} disabled={stepItems.length === 0} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.bgSubtle, cursor: stepItems.length === 0 ? "not-allowed" : "pointer",
                fontSize: 12, fontWeight: 600, color: C.txtSec, opacity: stepItems.length === 0 ? 0.4 : 1,
              }}>Next<ChevronRight size={14} /></button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Related Nodes Browser ──────────────────────── */}
        <div style={{ width: 270, borderLeft: `1px solid ${C.border}`, background: C.bgSurface, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ padding: "12px 14px 8px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.txtMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
              {stepMode === "relations" ? "All Connections" : stepMode === "documents" ? "Related Documents" : "Content Chunks"}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 8px" }}>
                <Search size={11} color={C.txtMuted} />
                <input placeholder="Filter..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 11, color: C.txt, width: "100%" }} />
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {stepMode === "relations" && edges.map((edge, i) => {
              const target = nodes[edge.to];
              if (!target) return null;
              const nt2 = NT[target.type] || NT.document;
              const isActive = i === stepIdx;
              return (
                <div key={i}
                  onClick={() => { setStepIdx(i); setHighlightEdge(edge.to); }}
                  style={{
                    padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, cursor: "pointer",
                    background: isActive ? nt2.bg : "transparent",
                    borderLeft: isActive ? `3px solid ${nt2.color}` : "3px solid transparent",
                  }}
                  onMouseEnter={e => !isActive && (e.currentTarget.style.background = C.bgSubtle)}
                  onMouseLeave={e => !isActive && (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: nt2.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <NodeIcon type={target.type} size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{target.label}</div>
                      <div style={{ fontSize: 10, color: nt2.color, fontWeight: 600 }}>{edge.type}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: edge.strength >= 0.8 ? C.successTxt : edge.strength >= 0.6 ? C.warningTxt : C.txtMuted }}>
                        {Math.round(edge.strength * 100)}%
                      </div>
                    </div>
                  </div>
                  {/* Shared tags */}
                  {edge.sharedTags?.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {edge.sharedTags.slice(0, 3).map((t, j) => (
                        <span key={j} style={{ fontSize: 9, fontWeight: 600, color: C.accent, background: C.accentLight, padding: "1px 5px", borderRadius: 3 }}>#{t}</span>
                      ))}
                    </div>
                  )}
                  <button onClick={e => { e.stopPropagation(); navigateTo(edge.to); }} style={{
                    display: "flex", alignItems: "center", gap: 4, marginTop: 6, padding: "2px 0", border: "none", background: "none", cursor: "pointer", fontSize: 10, color: nt2.color, fontWeight: 600,
                  }}>
                    Explore <CornerDownRight size={10} />
                  </button>
                </div>
              );
            })}

            {stepMode === "documents" && docs.map((doc, i) => {
              const isActive = i === stepIdx;
              return (
                <div key={i} onClick={() => setStepIdx(i)} style={{
                  padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, cursor: "pointer",
                  background: isActive ? C.accentLight : "transparent",
                  borderLeft: isActive ? `3px solid ${C.accent}` : "3px solid transparent",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <FileText size={14} color={C.info} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, lineHeight: 1.4, marginBottom: 4 }}>{doc.title}</div>
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        {doc.status && <Chip label={doc.status} />}
                        <span style={{ fontSize: 10, color: C.txtMuted }}>Relevance: {Math.round((doc.relevance || 0) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {stepMode === "chunks" && chunks.map((chunk, i) => {
              const isActive = i === stepIdx;
              return (
                <div key={i} onClick={() => setStepIdx(i)} style={{
                  padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, cursor: "pointer",
                  background: isActive ? C.tealBg : "transparent",
                  borderLeft: isActive ? `3px solid ${C.teal}` : "3px solid transparent",
                }}>
                  <div style={{ fontSize: 11, color: C.txtSec, lineHeight: 1.6, marginBottom: 6 }}>{chunk.text.slice(0, 80)}...</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {(chunk.tags || []).map((t, j) => (
                      <span key={j} style={{ fontSize: 9, fontWeight: 600, color: C.tealTxt, background: C.tealBg, padding: "1px 5px", borderRadius: 3 }}>#{t}</span>
                    ))}
                  </div>
                </div>
              );
            })}

            {stepItems.length === 0 && (
              <div style={{ padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: C.txtMuted, lineHeight: 1.6 }}>No {stepMode} for this node.</div>
                {stepMode !== "relations" && (
                  <button onClick={() => setStepMode("relations")} style={{ marginTop: 10, fontSize: 11, color: C.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    View relations instead
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom: Node glossary quick nav */}
          <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.txtMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>All Nodes (Glossary)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {Object.values(nodes).map(n => {
                const nt2 = NT[n.type] || NT.document;
                const isCurrent = n.id === currentId;
                return (
                  <button key={n.id} onClick={() => navigateTo(n.id)} title={n.label} style={{
                    width: 26, height: 26, borderRadius: 6, border: `1.5px solid ${isCurrent ? nt2.color : nt2.color + "50"}`,
                    background: isCurrent ? nt2.color : nt2.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.1s",
                  }}>
                    <NodeIcon type={n.type} size={13} color={isCurrent ? "#fff" : nt2.color} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mermaid Modal */}
      {showMermaid && <MermaidModal nodeId={currentId} nodes={nodes} onClose={() => setShowMermaid(false)} />}
    </div>
  );
}