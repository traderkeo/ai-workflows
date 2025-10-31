'use client';

import { Panel } from '@/components/ai-elements/panel';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WorkflowNodeData } from './types';
import { ExportMenu } from './ExportMenu';
import type { WorkflowExportData } from './utils/workflowExport';
import type { SavedWorkflow } from './store/useWorkflowStore';

interface ToolbarPanelProps {
  onAddNode: (nodeType: WorkflowNodeData['type']) => void;
  workflowData?: WorkflowExportData;
  onSaveWorkflow?: () => void;
  savedWorkflows?: SavedWorkflow[];
  onLoadWorkflow?: (workflowId: string) => void;
  onDeleteWorkflow?: (workflowId: string) => void;
}

export function ToolbarPanel({
  onAddNode,
  workflowData,
  onSaveWorkflow,
  savedWorkflows = [],
  onLoadWorkflow,
  onDeleteWorkflow,
}: ToolbarPanelProps) {
  return (
    <Panel position="top-left">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => onAddNode('text')}
            //@ts-ignore
            size="sm" 
            variant="secondary"
          >
            + Text Node
          </Button>
          <Button 
            onClick={() => onAddNode('structured')}
            //@ts-ignore
            size="sm" 
            variant="secondary"
          >
            + Structured Node
          </Button>
          <Button 
            onClick={() => onAddNode('conditional')}
            //@ts-ignore
            size="sm" 
            variant="secondary"
          >
            + If/Else Node
          </Button>
          <Button 
            onClick={() => onAddNode('stop')}
            //@ts-ignore
            size="sm" 
            variant="secondary"
          >
            + Stop Node
          </Button>
        </div>
        {(onSaveWorkflow || savedWorkflows.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {onSaveWorkflow && (
              <Button 
                //@ts-ignore
                size="sm" 
                variant="outline"
                onClick={onSaveWorkflow}
              >
                Save Workflow
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  //@ts-ignore
                  size="sm" 
                  variant="outline"
                >
                  Saved Workflows
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                {savedWorkflows.length === 0 && (
                  <DropdownMenuItem disabled>
                    No workflows saved yet
                  </DropdownMenuItem>
                )}
                {savedWorkflows.map((workflow) => (
                  <DropdownMenuItem
                    key={workflow.id}
                    className="flex flex-col items-start gap-1"
                    onSelect={(event) => {
                      event.preventDefault();
                      onLoadWorkflow?.(workflow.id);
                    }}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {workflow.name}
                      </span>
                      {onDeleteWorkflow && (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-destructive"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onDeleteWorkflow(workflow.id);
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(workflow.createdAt).toLocaleString()}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {workflowData && (
          <ExportMenu workflowData={workflowData} />
        )}
      </div>
    </Panel>
  );
}
