'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Search,
  FileJson,
  Brain,
  Workflow,
  ArrowRight
} from 'lucide-react';

const demos = [
  {
    title: 'Text Generation',
    description: 'Generate text with AI models. Includes streaming and system prompts.',
    icon: Sparkles,
    href: '/demos/text-generation',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    features: ['Streaming', 'System Prompts', 'Temperature Control']
  },
  {
    title: 'Web Search',
    description: 'Search the web with OpenAI\'s Responses API. Get real-time info with citations.',
    icon: Search,
    href: '/demos/web-search',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    features: ['Citations', 'Domain Filtering', 'Location-Aware'],
    badge: 'New'
  },
  {
    title: 'Structured Data',
    description: 'Extract structured JSON data from text using Zod schemas.',
    icon: FileJson,
    href: '/demos/structured-data',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    features: ['Type-Safe', 'Zod Schemas', 'Validation']
  },
  {
    title: 'Embeddings & Search',
    description: 'Generate embeddings and perform semantic similarity search.',
    icon: Brain,
    href: '/demos/embeddings',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    features: ['Vector Search', 'Similarity', 'Clustering']
  },
  {
    title: 'Workflow Chains',
    description: 'Chain multiple AI operations together in complex workflows.',
    icon: Workflow,
    href: '/demos/workflows',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    features: ['Sequential', 'Parallel', 'Conditional']
  },
];

export default function DemosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Workers Demos
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explore the capabilities of the @repo/ai-workers package with interactive examples
          </p>
          <div className="mt-6 flex gap-4 justify-center">
            <Badge variant="secondary" className="text-sm">
              OpenAI GPT-4o-mini
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Embeddings
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Web Search
            </Badge>
          </div>
        </div>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {demos.map((demo) => {
            const Icon = demo.icon;
            return (
              <Card
                key={demo.href}
                className="hover:shadow-lg transition-shadow duration-300 group relative overflow-hidden"
              >
                {demo.badge && (
                  <Badge
                    className="absolute top-4 right-4 z-10"
                    variant="default"
                  >
                    {demo.badge}
                  </Badge>
                )}

                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${demo.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${demo.color}`} />
                  </div>
                  <CardTitle className="text-2xl group-hover:text-blue-600 transition-colors">
                    {demo.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {demo.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Features */}
                    <div className="flex flex-wrap gap-2">
                      {demo.features.map((feature) => (
                        <Badge
                          key={feature}
                          variant="outline"
                          className="text-xs"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Link href={demo.href}>
                      <Button
                        className="w-full group-hover:bg-blue-600 transition-colors"
                        variant="default"
                      >
                        Try Demo
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>About AI Workers Package</CardTitle>
              <CardDescription>
                A comprehensive TypeScript library for building AI-powered applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                The <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">@repo/ai-workers</code> package
                provides a unified interface for working with AI models, web search, embeddings, and complex workflows.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <h3 className="font-semibold mb-2">Core Features</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>✓ Text generation & streaming</li>
                    <li>✓ Structured data extraction</li>
                    <li>✓ Vector embeddings</li>
                    <li>✓ Semantic search</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Advanced</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>✓ Web search with citations</li>
                    <li>✓ Workflow orchestration</li>
                    <li>✓ Context management</li>
                    <li>✓ Error handling</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Link href="https://github.com/yourusername/ai-workflows" target="_blank">
                  <Button variant="outline" size="sm">
                    View Documentation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
