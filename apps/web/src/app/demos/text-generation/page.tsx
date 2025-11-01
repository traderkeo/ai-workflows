'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Loader2, Copy, Check, Zap } from 'lucide-react';
import { ModelSelector, type ModelId } from '@/components/ui/model-selector';

export default function TextGenerationDemo() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [model, setModel] = useState<ModelId>('gpt-4o-mini');
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([2048]);
  const [useStreaming, setUseStreaming] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [usage, setUsage] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const examples = [
    {
      title: 'Creative Writing',
      prompt: 'Write a short story about a robot learning to paint.',
      system: 'You are a creative storyteller.',
      temp: 0.9,
    },
    {
      title: 'Code Explanation',
      prompt: 'Explain how async/await works in JavaScript.',
      system: 'You are a senior software engineer who explains concepts clearly.',
      temp: 0.3,
    },
    {
      title: 'Marketing Copy',
      prompt: 'Write a compelling product description for eco-friendly water bottles.',
      system: 'You are a marketing copywriter.',
      temp: 0.7,
    },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResult('');
    setUsage(null);

    try {
      if (useStreaming) {
        // Streaming mode
        const response = await fetch('/api/demos/text-generation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            systemPrompt,
            model,
            temperature: temperature[0],
            maxTokens: maxTokens[0],
            stream: true,
          }),
        });

        if (!response.ok) throw new Error('Request failed');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No reader');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.chunk) {
                setResult((prev) => prev + data.chunk);
              }

              if (data.done) {
                setUsage(data.usage);
              }
            }
          }
        }
      } else {
        // Non-streaming mode
        const response = await fetch('/api/demos/text-generation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            systemPrompt,
            model,
            temperature: temperature[0],
            maxTokens: maxTokens[0],
            stream: false,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Request failed');
        }

        const data = await response.json();
        setResult(data.text);
        setUsage(data.usage);
      }
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = (example: typeof examples[0]) => {
    setPrompt(example.prompt);
    setSystemPrompt(example.system);
    setTemperature([example.temp]);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
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
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold">Text Generation</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Generate and stream text using OpenAI models with customizable parameters
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Examples</CardTitle>
                <CardDescription>Try these preset examples</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {examples.map((example, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => loadExample(example)}
                  >
                    {example.title}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt *</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Enter your prompt here..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* System Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="system">System Prompt (Optional)</Label>
                  <Textarea
                    id="system"
                    placeholder="e.g., You are a helpful assistant..."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                {/* Model Selection */}
                <ModelSelector value={model} onChange={setModel} />

                {/* Temperature */}
                <div className="space-y-2">
                  <Label>Temperature: {temperature[0]}</Label>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                  <p className="text-xs text-gray-500">
                    Higher values = more creative, Lower values = more focused
                  </p>
                </div>

                {/* Max Tokens */}
                <div className="space-y-2">
                  <Label>Max Tokens: {maxTokens[0]}</Label>
                  <Slider
                    value={maxTokens}
                    onValueChange={setMaxTokens}
                    min={100}
                    max={4096}
                    step={100}
                  />
                </div>

                {/* Streaming Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Streaming Mode</span>
                  </div>
                  <button
                    onClick={() => setUseStreaming(!useStreaming)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      useStreaming ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        useStreaming ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Action Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 w-4 h-4" />
                  )}
                  Generate Text
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Result</CardTitle>
                  {result && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
                {usage && (
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Tokens: {usage.totalTokens}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Prompt: {usage.promptTokens}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Completion: {usage.completionTokens}
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                  {result ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {result}
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm italic">
                      Generated text will appear here...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
