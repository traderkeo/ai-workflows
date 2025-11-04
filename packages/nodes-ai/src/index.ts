// Main components
export { WorkflowBuilder } from './components/WorkflowBuilder';
export { WorkflowCanvas } from './components/WorkflowCanvas';
export { ContextMenu, nodeTemplates } from './components/ContextMenu';
export type { NodeTemplate } from './components/ContextMenu';
export { BaseAINode } from './components/BaseAINode';
export { SavedWorkflowsPanel } from './components/SavedWorkflowsPanel';
export { VariablesPanel } from './components/VariablesPanel';
export { ThemeSettings } from './components/ThemeSettings';
export { CommandPalette } from './components/CommandPalette';
export { ExecutionHistoryPanel } from './components/ExecutionHistoryPanel';
export type { ExecutionRecord } from './components/ExecutionHistoryPanel';
export { FileAttachment } from './components/FileAttachment';
export { ImageSourceSelector } from './components/ImageSourceSelector';

// Context
export { ThemeProvider, useTheme } from './context/ThemeContext';
export type { Theme } from './context/ThemeContext';
export { NotificationProvider, useNotifications } from './context/NotificationContext';

// Node components
export { StartNode } from './nodes/StartNode';
export { StopNode } from './nodes/StopNode';
export { AIAgentNode } from './nodes/AIAgentNode';
export { TextGenerationNode } from './nodes/TextGenerationNode';
export { StructuredDataNode } from './nodes/StructuredDataNode';
export { TransformNode } from './nodes/TransformNode';
export { MergeNode } from './nodes/MergeNode';
export { ConditionNode } from './nodes/ConditionNode';
export { TemplateNode } from './nodes/TemplateNode';
export { HttpRequestNode } from './nodes/HttpRequestNode';
export { LoopNode } from './nodes/LoopNode';
export { FileUploadNode } from './nodes/FileUploadNode';
export { SplitterNode } from './nodes/SplitterNode';
export { AggregatorNode } from './nodes/AggregatorNode';
export { CacheNode } from './nodes/CacheNode';
export { GuardrailNode } from './nodes/GuardrailNode';
export { WebScrapeNode } from './nodes/WebScrapeNode';
export { DocumentIngestNode } from './nodes/DocumentIngestNode';
export { RetrievalQANode } from './nodes/RetrievalQANode';
export { WebSearchNode } from './nodes/WebSearchNode';

// Hooks
export { useFlowStore } from './hooks/useFlowStore';
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
export { clearWorkflowStorage, getStorageStats } from './hooks/indexedDBStorage';

// Utilities
export { executeWorkflow, validateWorkflow } from './utils/executionEngine';
export { autoLayout, centerNodes } from './utils/autoLayout';

// Types
export type {
  AINodeType,
  NodeStatus,
  BaseNodeData,
  StartNodeData,
  StopNodeData,
  AIAgentNodeData,
  TextGenerationNodeData,
  StructuredDataNodeData,
  ToolCallingNodeData,
  EmbeddingNodeData,
  SemanticSearchNodeData,
  TransformNodeData,
  ConditionalNodeData,
  ParallelNodeData,
  RetryNodeData,
  HttpRequestNodeData,
  LoopNodeData,
  AINodeData,
  AINode,
  AIEdge,
  FlowState,
  ExecutionContext,
  WorkflowMetadata,
  SavedWorkflow,
} from './types';

// Import styles - users should import this in their app
import './styles/index.css';
