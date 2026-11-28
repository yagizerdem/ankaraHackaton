import mongoose from "mongoose";

const knowledgeGraphSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    nodes: [{ type: mongoose.Schema.Types.ObjectId, ref: "TopicNode" }],
    edges: [{ type: mongoose.Schema.Types.ObjectId, ref: "TopicEdge" }],
  },
  { timestamps: true },
);

const topicNodeSchema = new mongoose.Schema(
  {
    graphId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KnowledgeGraph",
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    summary: String,
    keywords: [String],
    learningObjectives: [String],
    misconceptions: [String],
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      required: true,
    },
    estimatedStudyMinutes: Number,
    sourcePages: [Number],
    sourceChunkIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Embedding",
      },
    ],
    importance: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
  },
  { timestamps: true },
);

const topicEdgeSchema = new mongoose.Schema(
  {
    source: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TopicNode",
      required: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TopicNode",
      required: true,
    },
  },
  { timestamps: true },
);

export type KnowledgeGraph = mongoose.InferSchemaType<
  typeof knowledgeGraphSchema
>;
export type KnowledgeGraphDocument = mongoose.HydratedDocument<KnowledgeGraph>;

export type TopicNode = mongoose.InferSchemaType<typeof topicNodeSchema>;
export type TopicNodeDocument = mongoose.HydratedDocument<TopicNode>;

export type TopicEdge = mongoose.InferSchemaType<typeof topicEdgeSchema>;
export type TopicEdgeDocument = mongoose.HydratedDocument<TopicEdge>;

export const KnowledgeGraph =
  (mongoose.models.KnowledgeGraph as mongoose.Model<KnowledgeGraph>) ||
  mongoose.model<KnowledgeGraph>("KnowledgeGraph", knowledgeGraphSchema);

export const TopicNode =
  (mongoose.models.TopicNode as mongoose.Model<TopicNode>) ||
  mongoose.model<TopicNode>("TopicNode", topicNodeSchema);

export const TopicEdge =
  (mongoose.models.TopicEdge as mongoose.Model<TopicEdge>) ||
  mongoose.model<TopicEdge>("TopicEdge", topicEdgeSchema);
