'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Workflow, Loader2, ArrowRight, GitBranch, RefreshCw, Layers } from 'lucide-react';

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
  const [workflowType, setWorkflowType] = useState<WorkflowType>('sequential');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const currentWorkflow = workflows[workflowType];
  const Icon = currentWorkflow.icon;

  const handleExecute = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/demos/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowType,
          input,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
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

        {/* Sequential Results */}
        {workflowType === 'sequential' && result.result?.results && (
          <div className="space-y-3">
            {result.result.results.map((step: any, i: number) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600">
                      {i + 1}
                    </div>
                    {currentWorkflow.steps[i]}
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
          </div>
        )}

        {/* Parallel Results */}
        {workflowType === 'parallel' && result.result?.results && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.result.results.map((task: any, i: number) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-sm">{currentWorkflow.steps[i]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm">
                    {task.text || JSON.stringify(task, null, 2)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Conditional Result */}
        {workflowType === 'conditional' && result.result?.text && (
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
                  {result.result.text}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Retry Result */}
        {workflowType === 'retry' && result.result?.text && (
          <div className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  Result
                  <Badge variant="secondary">
                    Attempts: {result.result.attempts || 1}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm">
                  {result.result.text}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Complex Workflow Result */}
        {workflowType === 'complex' && result.result?.synthesis && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.result.parallelResults?.map((perspective: any, i: number) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {i === 0 ? 'Technical Perspective' : 'Business Perspective'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm">
                      {perspective.text}
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
                      onClick={() => setWorkflowType(key as WorkflowType)}
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
          <div className="lg:col-span-2">
            <Card className="min-h-[600px]">
              <CardHeader>
                <CardTitle>Workflow Results</CardTitle>
                <CardDescription>See how data flows through the workflow</CardDescription>
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
