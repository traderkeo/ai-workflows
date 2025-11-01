'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileJson, Loader2, Copy, Check, Zap } from 'lucide-react';
import { ModelSelector, type ModelId } from '@/components/ui/model-selector';

const schemas = {
  contact: {
    name: 'Contact Information',
    description: 'Extract contact details from text',
    example: 'John Doe, senior developer at Acme Corp. Email: john.doe@acme.com, phone: +1-555-0123',
    fields: ['name', 'email', 'phone (optional)', 'company (optional)'],
  },
  product: {
    name: 'Product Details',
    description: 'Extract product information',
    example: 'iPhone 15 Pro Max - $1,199. Premium smartphone with A17 Pro chip, titanium design, and USB-C. Features: 5x zoom camera, action button, fast charging. Currently in stock.',
    fields: ['name', 'price', 'category', 'features[]', 'inStock'],
  },
  event: {
    name: 'Event Information',
    description: 'Extract event details',
    example: 'Annual Tech Conference 2024 will be held on March 15th at the Convention Center in San Francisco. Expecting around 500 attendees. Tags: technology, networking, innovation.',
    fields: ['title', 'date', 'location', 'attendees', 'tags[]'],
  },
  article: {
    name: 'Article Metadata',
    description: 'Extract article information',
    example: 'Understanding TypeScript Generics by Sarah Johnson. A comprehensive guide to using generic types in TypeScript for better code reusability. Keywords: typescript, generics, programming, web development. Category: Web Development. Estimated reading time: 8 minutes.',
    fields: ['title', 'author', 'summary', 'keywords[]', 'category', 'estimatedReadTime'],
  },
};

export default function StructuredDataDemo() {
  const [schemaType, setSchemaType] = useState<keyof typeof schemas>('contact');
  const [model, setModel] = useState<ModelId>('gpt-4o-mini');
  const [inputText, setInputText] = useState('');
  const [useStreaming, setUseStreaming] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [partialResult, setPartialResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const currentSchema = schemas[schemaType];

  const handleExtract = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setResult(null);
    setPartialResult(null);

    try {
      const response = await fetch('/api/demos/structured-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputText,
          schemaType,
          model,
          stream: useStreaming,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Extraction failed');
      }

      if (useStreaming) {
        // Handle streaming response
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

              if (data.partial) {
                setPartialResult(data.partial);
              }

              if (data.done) {
                setResult({ object: data.object, usage: data.usage });
              }
            }
          }
        }
      } else {
        // Non-streaming
        const data = await response.json();
        setResult(data);
      }
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = () => {
    setInputText(currentSchema.example);
  };

  const copyToClipboard = () => {
    if (result?.object) {
      navigator.clipboard.writeText(JSON.stringify(result.object, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
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
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <FileJson className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold">Structured Data Extraction</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Extract structured JSON data from unstructured text using Zod schemas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Schema Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Schema</CardTitle>
                <CardDescription>Choose the type of data to extract</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={schemaType} onValueChange={(value) => setSchemaType(value as keyof typeof schemas)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(schemas).map(([key, schema]) => (
                      <SelectItem key={key} value={key}>
                        {schema.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">{currentSchema.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {currentSchema.fields.map((field) => (
                      <Badge key={field} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadExample}
                  className="w-full"
                >
                  Load Example
                </Button>
              </CardContent>
            </Card>

            {/* Input Text */}
            <Card>
              <CardHeader>
                <CardTitle>Input Text</CardTitle>
                <CardDescription>Paste or type unstructured text</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ModelSelector value={model} onChange={setModel} />

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

                <Textarea
                  placeholder="Enter text to extract structured data from..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={8}
                  className="resize-none font-mono text-sm"
                />

                <Button
                  onClick={handleExtract}
                  disabled={isLoading || !inputText.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : (
                    <FileJson className="mr-2 w-4 h-4" />
                  )}
                  Extract Data
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Extracted Data</CardTitle>
                    <CardDescription>Structured JSON output</CardDescription>
                  </div>
                  {result?.object && (
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
                {result?.usage && (
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Tokens: {result.usage.totalTokens}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Schema: {result.schema}
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 min-h-[500px] max-h-[600px] overflow-y-auto">
                  {!result && !partialResult && !isLoading ? (
                    <div className="text-center py-12 text-gray-400">
                      <FileJson className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Extracted JSON will appear here...</p>
                    </div>
                  ) : result?.error ? (
                    <div className="text-red-400">
                      <p className="font-mono text-sm">Error: {result.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Show streaming indicator and partial data */}
                      {isLoading && partialResult && (
                        <div className="flex items-center gap-2 text-yellow-400 text-sm mb-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Streaming...</span>
                        </div>
                      )}

                      {/* Show partial or final result */}
                      <pre className="text-green-400 font-mono text-sm leading-relaxed overflow-x-auto">
                        {JSON.stringify(
                          result?.object || partialResult || {},
                          null,
                          2
                        )}
                      </pre>

                      {/* Show incomplete fields indicator */}
                      {isLoading && partialResult && (
                        <div className="text-gray-500 text-xs italic">
                          Fields are being filled progressively...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Schema Visualization */}
                {result?.object && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm mb-3">Extracted Fields</h4>
                    <div className="space-y-2">
                      {Object.entries(result.object).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {key}
                          </Badge>
                          <span className="text-gray-600 dark:text-gray-400">
                            {Array.isArray(value)
                              ? `Array (${value.length})`
                              : typeof value === 'object'
                              ? 'Object'
                              : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>About Structured Data Extraction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Type-Safe</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Zod schemas ensure type safety and validation
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Flexible</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Works with any unstructured text input
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Reliable</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Automatic validation and error handling
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
