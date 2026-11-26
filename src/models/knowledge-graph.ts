import mongoose from "mongoose";

export interface KnowledgeGraph {
  documentId: mongoose.Types.ObjectId;
  nodes: TopicNode[];
  edges: TopicEdge[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TopicNode {
  id: string;
  label: string;
  description: string;
  sourcePages: number[];
}

export interface TopicEdge {
  source: string;
  target: string;
}

const knowledgeGraphSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  nodes: [{ type: mongoose.Schema.Types.ObjectId, ref: "TopicNode" }],
  edges: [{ type: mongoose.Schema.Types.ObjectId, ref: "TopicEdge" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const topicNodeSchema = new mongoose.Schema({
  label: { type: String, required: true },
  description: { type: String, required: true },
  sourcePages: [{ type: Number, required: true }],
});

const topicEdgeSchema = new mongoose.Schema({
  source: { type: String, required: true },
  target: { type: String, required: true },
});

// Dev hot-reload / serverless re-evaluation re-runs this module while
// mongoose.models persists, and mongoose.model() throws OverwriteModelError
// on a second registration. Reuse the registered model when present.
export const KnowledgeGraph =
  mongoose.models.KnowledgeGraph ||
  mongoose.model("KnowledgeGraph", knowledgeGraphSchema);

export const TopicNode =
  mongoose.models.TopicNode || mongoose.model("TopicNode", topicNodeSchema);

export const TopicEdge =
  mongoose.models.TopicEdge || mongoose.model("TopicEdge", topicEdgeSchema);
