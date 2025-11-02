'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Workflow, Loader2, ArrowRight, GitBranch, RefreshCw, Layers } from 'lucide-react';
import { ModelSelector, type ModelId } from '@/components/ui/model-selector';

const workflows = {
  sequential: {
    name: 'Sequential Chain',
    description: 'Execute nodes one after another, passing output to next',
    icon: ArrowRight,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    example: 'Artificial intelligence is transforming how we work and live. AI systems can now understand language, recognize images, and even create art. The technology continues to evolve rapidly.',
    steps: ['1. Summarize text', '2. Extract keywords', '3. Generate title'],
  },
  parallel: {
    name: 'Parallel Execution',
    description: 'Run multiple nodes simultaneously for faster processing',
    icon: Layers,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    example: 'Hello, how are you today?',
    steps: ['1. Translate to French', '2. Translate to Spanish', '3. Translate to German'],
  },
  conditional: {
    name: 'Conditional Branching',
    description: 'Choose different paths based on conditions',
    icon: GitBranch,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    example: 'AI is cool',
    steps: ['1. Check text length', '2a. Summarize (if long)', '2b. Expand (if short)'],
  },
  retry: {
    name: 'Retry Mechanism',
    description: 'Automatically retry failed operations with backoff',
    icon: RefreshCw,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    example: 'Explain quantum computing',
    steps: ['1. Attempt execution', '2. Retry on failure', '3. Exponential backoff'],
  },
  complex: {
    name: 'Complex Workflow',
    description: 'Combine multiple workflow patterns',
    icon: Workflow,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    example: 'Cloud computing enables scalable applications',
    steps: ['1. Parallel analysis', '2. Technical perspective', '3. Business perspective', '4. Synthesize'],
  },
};

type WorkflowType = keyof typeof workflows;

export default function WorkflowsDemo() {
  // State persists only while on this page - no localStorage
  const [workflowType, setWorkflowType] = useState<WorkflowType>('sequential');
  const [model, setModel] = useState<ModelId>('gpt-4o-mini');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Store results per workflow type
  const [resultsByType, setResultsByType] = useState<Record<WorkflowType, any>>({} as Record<WorkflowType, any>);
  // Store progress per workflow type
  const [progressByType, setProgressByType] = useState<Record<WorkflowType, any[]>>({} as Record<WorkflowType, any[]>);
  // Store streaming text chunks per step (for incremental display)
  const [streamingTextByType, setStreamingTextByType] = useState<Record<WorkflowType, Record<string, string>>>({} as Record<WorkflowType, Record<string, string>>);
  const [currentStep, setCurrentStep] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const progressScrollRef = useRef<HTMLDivElement>(null);

  // Get current result and progress for the selected workflow type
  const result = resultsByType[workflowType] || null;
  const progress = progressByType[workflowType] || [];
  const streamingText = streamingTextByType[workflowType] || {};

  const currentWorkflow = workflows[workflowType];
  const Icon = currentWorkflow.icon;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  // Auto-scroll to bottom when progress or streaming text updates
  useEffect(() => {
    if (progressScrollRef.current && progress.length > 0) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        progressScrollRef.current?.scrollTo({
          top: progressScrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 50);
    }
  }, [progress, streamingText, isLoading]);

  const handleExecute = async () => {
    if (!input.trim()) return;

    // Prevent multiple simultaneous executions
    if (isLoading) {
      console.warn('[Workflows Demo] Already executing, ignoring duplicate request');
      return;
    }

    // Cancel any previous request
    if (abortController) {
      abortController.abort();
    }

    // Capture workflowType at the start to ensure we store results for the correct type
    // even if user switches types during execution
    const executingWorkflowType = workflowType;

    // Validate workflowType before sending
    const validTypes = ['sequential', 'parallel', 'conditional', 'retry', 'complex'];
    if (!validTypes.includes(executingWorkflowType)) {
      console.error(`[Workflows Demo] Invalid workflow type: ${executingWorkflowType}`);
      return;
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    console.log(`[Workflows Demo] Executing ONLY workflow type: ${executingWorkflowType} (input length: ${input.length})`);

    setIsLoading(true);
    // Clear results and progress for this specific workflow type
    setResultsByType((prev) => ({ ...prev, [executingWorkflowType]: null }));
    setProgressByType((prev) => ({ ...prev, [executingWorkflowType]: [] }));
    setStreamingTextByType((prev) => ({ ...prev, [executingWorkflowType]: {} }));
    setCurrentStep('Starting workflow...');

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowType: executingWorkflowType, // Explicitly pass only the selected type
          model,
          input,
        }),
        signal: controller.signal, // Allow cancellation
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      // Handle SSE stream
      reader = response.body?.getReader() || null;
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            let event;
            try {
              event = JSON.parse(line.slice(6));
            } catch (error) {
              console.error('[Workflows Demo] Failed to parse SSE event:', error, 'Line:', line);
              // Skip malformed events
              continue;
            }

            switch (event.type) {
              case 'start':
                setCurrentStep(`Starting ${event.data.workflowType} workflow...`);
                setProgressByType((prev) => ({
                  ...prev,
                  [workflowType]: [
                    ...(prev[workflowType] || []),
                    { type: 'start', message: 'Workflow initiated', timestamp: event.timestamp },
                  ],
                }));
                break;

              case 'progress':
                setCurrentStep(event.data.step);
                setProgressByType((prev) => ({
                  ...prev,
                  [workflowType]: [
                    ...(prev[workflowType] || []),
                    { type: 'progress', message: event.data.step, timestamp: event.timestamp },
                  ],
                }));
                break;

              case 'step-complete':
                setProgressByType((prev) => ({
                  ...prev,
                  [workflowType]: [
                    ...(prev[workflowType] || []),
                    {
                      type: 'step-complete',
                      stepNumber: event.data.stepNumber,
                      stepType: event.data.type,
                      result: event.data.result,
                      timestamp: event.timestamp,
                    },
                  ],
                }));
                break;

              case 'parallel-complete':
              case 'parallel-analysis-complete':
                setProgressByType((prev) => ({
                  ...prev,
                  [workflowType]: [
                    ...(prev[workflowType] || []),
                    {
                      type: 'parallel',
                      results: event.data.results,
                      timestamp: event.timestamp,
                    },
                  ],
                }));
                break;

              case 'condition-evaluated':
                setProgressByType((prev) => ({
                  ...prev,
                  [workflowType]: [
                    ...(prev[workflowType] || []),
                    {
                      type: 'condition',
                      evaluated: true,
                      isLongText: event.data.isLongText,
                      textLength: event.data.textLength,
                      timestamp: event.timestamp,
                    },
                  ],
                }));
                break;

              case 'branch-executed':
                setProgressByType((prev) => ({
                  ...prev,
                  [workflowType]: [
                    ...(prev[workflowType] || []),
                    {
                      type: 'branch',
                      branchTaken: event.data.branchTaken,
                      result: event.data.result,
                      timestamp: event.timestamp,
                    },
                  ],
                }));
                break;

              case 'synthesis-complete':
                setProgressByType((prev) => ({
                  ...prev,
                  [workflowType]: [
                    ...(prev[workflowType] || []),
                    {
                      type: 'synthesis',
                      synthesis: event.data.synthesis,
                      timestamp: event.timestamp,
                    },
                  ],
                }));
                break;

              case 'retry-complete':
                setProgressByType((prev) => ({
                  ...prev,
                  [workflowType]: [
                    ...(prev[workflowType] || []),
                    {
                      type: 'retry',
                      attempts: event.data.attempts,
                      result: event.data.result,
                      timestamp: event.timestamp,
                    },
                  ],
                }));
                break;

              case 'text-chunk':
                // Handle incremental text chunks for streaming display
                // For complex workflow, prioritize stepType-based keys over stepNumber
                // to match progress message lookups
                const chunkKey = event.data.stepType === 'synthesis'
                  ? 'synthesis'
                  : event.data.stepType === 'technical-analysis'
                  ? 'technical'
                  : event.data.stepType === 'business-analysis'
                  ? 'business'
                  : event.data.stepNumber 
                  ? `step-${event.data.stepNumber}` 
                  : event.data.taskNumber 
                  ? `task-${event.data.taskNumber}`
                  : event.data.attempt
                  ? `attempt-${event.data.attempt}`
                  : 'default';
                
                setStreamingTextByType((prev) => ({
                  ...prev,
                  [executingWorkflowType]: {
                    ...(prev[executingWorkflowType] || {}),
                    [chunkKey]: event.data.fullText,
                  },
                }));
                break;

              case 'complete':
                setCurrentStep('Workflow complete!');
                // Store result for this specific workflow type
                try {
                  setResultsByType((prev) => ({ ...prev, [executingWorkflowType]: event.data }));
                  console.log(`[Workflows Demo] Result stored for workflow type: ${executingWorkflowType}`);
                } catch (error) {
                  console.error('[Workflows Demo] Error storing result:', error);
                  const errorMessage = error instanceof Error ? error.message : String(error);
                  setResultsByType((prev) => ({ ...prev, [executingWorkflowType]: { error: 'Failed to process result: ' + errorMessage } }));
                }
                break;

              case 'error':
                throw new Error(event.data.error);
            }
          }
        }
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        console.log('[Workflows Demo] Request aborted');
        return;
      }
      setResultsByType((prev) => ({ ...prev, [workflowType]: { error: error.message } }));
      setCurrentStep('Error occurred');
    } finally {
      // Ensure stream is closed
      if (reader) {
        try {
          await reader.cancel();
          reader.releaseLock();
        } catch (e) {
          // Stream may already be closed
        }
      }
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const loadExample = () => {
    setInput(currentWorkflow.example);
  };

  const renderResult = () => {
    if (!result) {
      return (
        <div className="text-center py-12 text-gray-400">
          <Workflow className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Workflow results will appear here...</p>
        </div>
      );
    }

    if (result.error) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{result.error}</p>
        </div>
      );
    }

    // Get the workflow config for the currently selected type
    const resultWorkflow = workflows[workflowType];

    return (
      <div className="space-y-4">
        {/* Metadata */}
        {result.metadata && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              Nodes: {result.metadata.nodeExecutions}
            </Badge>
            <Badge variant="secondary">
              Tokens: {result.metadata.totalTokens}
            </Badge>
            <Badge variant="secondary">
              Duration: {result.metadata.duration}ms
            </Badge>
          </div>
        )}

        {/* Sequential Results - Only show if result type matches */}
        {workflowType === 'sequential' && result.result?.results && Array.isArray(result.result.results) && (
          <div className="space-y-3">
            {result.result.results.map((step: any, i: number) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600">
                      {i + 1}
                    </div>
                    {workflows.sequential.steps[i] || `Step ${i + 1}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm">
                    {typeof step.result === 'object' && step.result.text
                      ? step.result.text
                      : typeof step.result === 'object' && step.result.object
                      ? JSON.stringify(step.result.object, null, 2)
                      : JSON.stringify(step.result, null, 2)}
                  </div>
                </CardContent>
              </Card>
            ))}
            {result.result.finalOutput && (
              <Card className="border-2 border-blue-500">
                <CardHeader>
                  <CardTitle className="text-sm">Final Output</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 text-sm font-medium">
                    {result.result.finalOutput}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Parallel Results - Only show if result type matches */}
        {workflowType === 'parallel' && result.result?.results && Array.isArray(result.result.results) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.result.results.map((task: any, i: number) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-sm">{workflows.parallel.steps[i] || `Task ${i + 1}`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm">
                    {task.result?.text || task.text || JSON.stringify(task.result || task, null, 2)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Conditional Result - Only show if result type matches */}
        {workflowType === 'conditional' && result.result && !result.result.results && (
          <div className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  Branch Taken:
                  <Badge variant={result.result.branchTaken === 'true' ? 'default' : 'secondary'}>
                    {result.result.branchTaken === 'true' ? 'Long Text (Summarize)' : 'Short Text (Expand)'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm">
                  {result.result.result?.text || result.result.text || JSON.stringify(result.result, null, 2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Retry Result - Only show if result type matches */}
        {workflowType === 'retry' && result.result && !result.result.results && !result.result.synthesis && (
          <div className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  Result
                  <Badge variant={result.result.success ? 'default' : 'destructive'}>
                    {result.result.success ? `Success after ${result.result.attempts} attempt(s)` : `Failed after ${result.result.attempts} attempts`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm">
                  {result.result.result?.text || result.result.text || result.result.error || JSON.stringify(result.result, null, 2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Complex Workflow Result - Only show if result type matches */}
        {workflowType === 'complex' && result.result?.synthesis && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.result.parallelResults?.map((perspective: any, i: number) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {perspective.type === 'technical-analysis' ? 'Technical Perspective' : 'Business Perspective'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm">
                      {(() => {
                        try {
                          return perspective.result?.text || perspective.text || JSON.stringify(perspective.result, null, 2);
                        } catch (error) {
                          console.error('[Workflows Demo] Error rendering perspective result:', error);
                          return String(perspective.result || 'Unable to display result');
                        }
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="border-2 border-pink-500">
              <CardHeader>
                <CardTitle className="text-sm">Synthesized Conclusion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded p-3 text-sm">
                  {result.result.synthesis.text}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/demos">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Demos
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <h1 className="text-4xl font-bold">Workflow Chains</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Orchestrate complex AI workflows with sequential, parallel, and conditional patterns
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Selection */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Type</CardTitle>
                <CardDescription>Choose a workflow pattern</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(workflows).map(([key, workflow]) => {
                  const WorkflowIcon = workflow.icon;
                  const isActive = key === workflowType;

                  return (
                    <Button
                      key={key}
                      variant={isActive ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => {
                        // Switch workflow type - results are now tied to each type
                        if (key !== workflowType) {
                          setWorkflowType(key as WorkflowType);
                          // Results are automatically shown/hidden based on workflowType
                          // via the resultsByType lookup
                        }
                      }}
                    >
                      <WorkflowIcon className={`mr-2 w-4 h-4 ${isActive ? '' : workflow.color}`} />
                      {workflow.name}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${currentWorkflow.color}`} />
                  {currentWorkflow.name}
                </CardTitle>
                <CardDescription>{currentWorkflow.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Workflow Steps:</p>
                  <div className="space-y-1">
                    {currentWorkflow.steps.map((step, i) => (
                      <div key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs flex-shrink-0">
                          {i + 1}
                        </div>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ModelSelector value={model} onChange={setModel} />

                <Textarea
                  placeholder="Enter text to process..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={6}
                  className="resize-none"
                />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadExample}
                    className="flex-1"
                  >
                    Load Example
                  </Button>
                </div>

                <Button
                  onClick={handleExecute}
                  disabled={isLoading || !input.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : (
                    <Workflow className="mr-2 w-4 h-4" />
                  )}
                  Execute Workflow
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Tracker */}
            {progress.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        Workflow Executing
                      </>
                    ) : (
                      <>
                        <Workflow className="w-5 h-5 text-green-500" />
                        Workflow Complete
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>{isLoading ? currentStep : 'All steps completed successfully'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div ref={progressScrollRef} className="space-y-2 max-h-[300px] overflow-y-auto">
                    {progress.map((item, index) => {
                      // Determine if this progress item should be shown (only if it has streaming content)
                      const shouldHideProgress = item.type === 'progress' && (() => {
                        const stepMatch = item.message?.match(/step (\d+)/i) || item.message?.match(/task (\d+)/i);
                        const attemptMatch = item.message?.match(/attempt (\d+)/i);
                        let stepKey = null;
                        let streamingContent = null;
                        
                        if (stepMatch) {
                          const stepNum = stepMatch[1];
                          stepKey = item.message?.includes('task') ? `task-${stepNum}` : `step-${stepNum}`;
                          streamingContent = stepKey ? streamingText[stepKey] : null;
                        } else if (attemptMatch) {
                          // Handle retry attempts
                          const attemptNum = attemptMatch[1];
                          stepKey = `attempt-${attemptNum}`;
                          streamingContent = streamingText[stepKey] || null;
                        }
                        
                        if (!streamingContent) {
                          if (item.message?.includes('Synthesiz')) {
                            streamingContent = streamingText['synthesis'];
                          } else if (item.message?.includes('technical')) {
                            streamingContent = streamingText['technical'];
                          } else if (item.message?.includes('business')) {
                            streamingContent = streamingText['business'];
                          } else if (item.message?.includes('branch') || item.message?.includes('Expand') || item.message?.includes('Summarize')) {
                            streamingContent = streamingText['default'];
                          }
                        }
                        
                        // Hide if no streaming content or not loading
                        return !streamingContent || !isLoading;
                      })();
                      
                      return (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg animate-in fade-in slide-in-from-left ${shouldHideProgress ? 'hidden' : ''}`}
                      >
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          {item.type === 'start' && (
                            <p className="text-sm font-medium">{item.message}</p>
                          )}
                          {item.type === 'progress' && (() => {
                            // Show progress items as step cards when they have streaming content
                            const stepMatch = item.message?.match(/step (\d+)/i) || item.message?.match(/task (\d+)/i);
                            const attemptMatch = item.message?.match(/attempt (\d+)/i);
                            let stepNum = null;
                            let attemptNum = null;
                            let stepKey = null;
                            let streamingContent = null;
                            
                            if (stepMatch) {
                              stepNum = stepMatch[1];
                              stepKey = item.message?.includes('task') ? `task-${stepNum}` : `step-${stepNum}`;
                              streamingContent = stepKey ? streamingText[stepKey] : null;
                            } else if (attemptMatch) {
                              // Handle retry attempts
                              attemptNum = attemptMatch[1];
                              stepKey = `attempt-${attemptNum}`;
                              streamingContent = streamingText[stepKey] || null;
                            }
                            
                            // Check for other streaming types
                            if (!streamingContent) {
                              if (item.message?.includes('Synthesiz')) {
                                streamingContent = streamingText['synthesis'];
                              } else if (item.message?.includes('technical')) {
                                streamingContent = streamingText['technical'];
                              } else if (item.message?.includes('business')) {
                                streamingContent = streamingText['business'];
                              } else if (item.message?.includes('branch') || item.message?.includes('Expand') || item.message?.includes('Summarize')) {
                                streamingContent = streamingText['default'];
                              }
                            }
                            
                            // Only show as a card if there's streaming content
                            if (streamingContent && isLoading) {
                              return (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    {stepNum ? `Step ${stepNum}${item.message?.includes('task') ? ' (Task)' : ''}` : attemptNum ? `Attempt ${attemptNum}` : item.message}
                                  </p>
                                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                      {streamingContent}
                                      <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            
                            // No streaming content, hide this progress item
                            return null;
                          })()}
                          {item.type === 'step-complete' && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                ✓ Step {item.stepNumber || item.taskNumber} Complete {item.stepType && `(${item.stepType})`}
                              </p>
                              {(() => {
                                // Show result text or streaming content
                                const stepKey = item.stepNumber ? `step-${item.stepNumber}` : item.taskNumber ? `task-${item.taskNumber}` : null;
                                const streamingContent = stepKey ? streamingText[stepKey] : null;
                                
                                // Show result if available, otherwise show streaming content
                                const displayText = item.result?.text || streamingContent;
                                const isStreaming = streamingContent && isLoading && !item.result?.text;
                                
                                return displayText ? (
                                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                      {displayText}
                                      {isStreaming && (
                                        <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
                                      )}
                                    </p>
                                  </div>
                                ) : null;
                              })()}
                              {item.result?.data && (
                                <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                                  <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                                    {JSON.stringify(item.result.data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                          {item.type === 'parallel' && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                ✓ Parallel execution completed ({item.results?.length} tasks)
                              </p>
                              {item.results?.map((res: any, idx: number) => {
                                const taskKey = `task-${idx + 1}`;
                                const streamingContent = streamingText[taskKey];
                                const displayText = res.result?.text || streamingContent || JSON.stringify(res.result, null, 2);
                                const isStreaming = streamingContent && isLoading && !res.result?.text;
                                
                                return (
                                  <div key={idx} className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                      Task {idx + 1}:
                                    </p>
                                    <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                      {displayText}
                                      {isStreaming && (
                                        <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
                                      )}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {item.type === 'condition' && (
                            <div>
                              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                Condition evaluated: {item.textLength} characters
                              </p>
                              <Badge variant={item.isLongText ? 'default' : 'secondary'} className="mt-1">
                                {item.isLongText ? 'Long text - Summarize' : 'Short text - Expand'}
                              </Badge>
                            </div>
                          )}
                          {item.type === 'branch' && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                ✓ Branch executed: {item.branchTaken}
                              </p>
                              {(() => {
                                // Check for streaming text (no specific step number for branches)
                                const streamingContent = streamingText['default'];
                                const wasStreamedInProgress = streamingContent && !isLoading && progress.some((p: any) => 
                                  p.type === 'progress' && (p.message?.includes('branch') || p.message?.includes('Expand') || p.message?.includes('Summarize'))
                                );
                                
                                if (wasStreamedInProgress) {
                                  return null; // Don't duplicate
                                }
                                
                                const displayText = item.result?.text || streamingContent;
                                const isStreaming = streamingContent && isLoading;
                                
                                return displayText ? (
                                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                      {displayText}
                                      {isStreaming && (
                                        <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
                                      )}
                                    </p>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          )}
                          {item.type === 'synthesis' && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-pink-600 dark:text-pink-400">
                                ✓ Synthesis complete
                              </p>
                              {(() => {
                                // Check for streaming synthesis text
                                const streamingContent = streamingText['synthesis'];
                                const wasStreamedInProgress = streamingContent && !isLoading && progress.some((p: any) => 
                                  p.type === 'progress' && p.message?.includes('Synthesiz')
                                );
                                
                                if (wasStreamedInProgress) {
                                  return null; // Don't duplicate
                                }
                                
                                const displayText = item.synthesis?.text || streamingContent;
                                const isStreaming = streamingContent && isLoading;
                                
                                return displayText ? (
                                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                      {displayText}
                                      {isStreaming && (
                                        <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
                                      )}
                                    </p>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          )}
                          {item.type === 'retry' && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                ✓ Retry successful (attempts: {item.attempts})
                              </p>
                              {(() => {
                                // Check for streaming text for this attempt
                                const attemptKey = item.attempts ? `attempt-${item.attempts}` : null;
                                const streamingContent = attemptKey ? streamingText[attemptKey] : null;
                                const wasStreamedInProgress = streamingContent && !isLoading && progress.some((p: any) => 
                                  p.type === 'progress' && p.message?.includes(`Attempt ${item.attempts}`)
                                );
                                
                                if (wasStreamedInProgress) {
                                  return null; // Don't duplicate
                                }
                                
                                const displayText = item.result?.text || streamingContent;
                                const isStreaming = streamingContent && isLoading;
                                
                                return displayText ? (
                                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                      {displayText}
                                      {isStreaming && (
                                        <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
                                      )}
                                    </p>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Final Results */}
            <Card className="min-h-[400px]">
              <CardHeader>
                <CardTitle>Workflow Results</CardTitle>
                <CardDescription>
                  {result ? 'Workflow completed successfully' : 'Results will appear here'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderResult()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
