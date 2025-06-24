// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

export type MessageRole = "user" | "assistant" | "tool";

export interface Message {
  id: string;
  threadId: string;
  agent?:
    | "coordinator"
    | "planner"
    | "researcher"
    | "coder"
    | "reporter"
    | "podcast"
    | "multi_model_comparison";
  role: MessageRole;
  isStreaming?: boolean;
  content: string;
  contentChunks: string[];
  reasoningContent?: string;
  reasoningContentChunks?: string[];
  toolCalls?: ToolCallRuntime[];
  options?: Option[];
  finishReason?: "stop" | "interrupt" | "tool_calls";
  interruptFeedback?: string;
  resources?: Array<Resource>;
  
  multiModelOutputs?: Record<string, ModelOutput>;
  comparisonResults?: ModelComparisonResults;
}

export interface Option {
  text: string;
  value: string;
}

export interface ToolCallRuntime {
  id: string;
  name: string;
  args: Record<string, unknown>;
  argsChunks?: string[];
  result?: string;
}

export interface Resource {
  uri: string;
  title: string;
}

export interface ModelOutput {
  model_id: string;
  normalized_output: string;
  execution_metrics: {
    latency: number;
    cost: number;
    tokens: number;
  };
  evaluation_scores: {
    faithfulness_score: number;
    logic_score: number;
    information_density: number;
    total_score: number;
  };
}

export interface ModelComparisonResults {
  ranking: Array<{model_id: string; total_score: number}>;
  detailed_comparison: Record<string, ModelOutput>;
  summary: {
    total_models: number;
    best_model: string | null;
    average_latency: number;
    total_cost: number;
  };
}
