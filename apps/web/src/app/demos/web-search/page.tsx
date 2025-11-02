'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, Loader2, ExternalLink, MapPin, Filter } from 'lucide-react';
import { ModelSelector, type ModelId } from '@/components/ui/model-selector';

export default function WebSearchDemo() {
  const [query, setQuery] = useState('');
  const [model, setModel] = useState<ModelId>('gpt-4o-mini');
  const [mode, setMode] = useState('simple');
  const [domains, setDomains] = useState('');
  const [location, setLocation] = useState({ country: 'US', city: '', region: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const examples = [
    { query: 'Latest AI news today', mode: 'simple' },
    { query: 'TypeScript best practices', mode: 'domain-filtered', domains: 'typescriptlang.org,github.com,stackoverflow.com' },
    { query: 'Best restaurants near me', mode: 'location-aware', city: 'San Francisco', region: 'California' },
    { query: 'Recent quantum computing research', mode: 'domain-filtered', domains: 'nature.com,science.org,arxiv.org' },
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const body: any = {
        query,
        model,
        mode,
        includeSources: true,
      };

      if (mode === 'domain-filtered' && domains) {
        body.domains = domains.split(',').map(d => d.trim());
      }

      if (mode === 'location-aware') {
        body.location = location;
      }

      const response = await fetch('/api/demos/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Search failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = (example: typeof examples[0]) => {
    setQuery(example.query);
    setMode(example.mode);
    if (example.domains) {
      setDomains(example.domains);
    }
    if (example.city) {
      setLocation(prev => ({ ...prev, city: example.city || '', region: example.region || '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
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
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Search className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold">Web Search</h1>
            <Badge variant="default">New</Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Search the web using OpenAI&apos;s Responses API with citations and sources
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {examples.map((example, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => loadExample(example)}
                  >
                    <div className="truncate">
                      <div className="font-medium text-xs">{example.query}</div>
                      <div className="text-xs text-gray-500">{example.mode}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Search Form */}
            <Card>
              <CardHeader>
                <CardTitle>Search Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ModelSelector value={model} onChange={setModel} />

                {/* Query */}
                <div className="space-y-2">
                  <Label htmlFor="query">Search Query *</Label>
                  <Input
                    id="query"
                    placeholder="What do you want to search for?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                {/* Mode Tabs */}
                <Tabs value={mode} onValueChange={setMode}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="simple">Simple</TabsTrigger>
                    <TabsTrigger value="domain-filtered">
                      <Filter className="w-3 h-3 mr-1" />
                      Filtered
                    </TabsTrigger>
                    <TabsTrigger value="location-aware">
                      <MapPin className="w-3 h-3 mr-1" />
                      Location
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="domain-filtered" className="space-y-2">
                    <Label htmlFor="domains">Allowed Domains (comma-separated)</Label>
                    <Input
                      id="domains"
                      placeholder="e.g., nature.com, science.org"
                      value={domains}
                      onChange={(e) => setDomains(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Limit search to specific domains</p>
                  </TabsContent>

                  <TabsContent value="location-aware" className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="San Francisco"
                          value={location.city}
                          onChange={(e) => setLocation(prev => ({ ...prev, city: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="region">Region</Label>
                        <Input
                          id="region"
                          placeholder="California"
                          value={location.region}
                          onChange={(e) => setLocation(prev => ({ ...prev, region: e.target.value }))}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Search Button */}
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !query.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 w-4 h-4" />
                  )}
                  Search
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            <Card className="min-h-[600px]">
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                {result && !result.error && (
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">
                      Citations: {result.citations?.length || 0}
                    </Badge>
                    {result.sources && (
                      <Badge variant="secondary">
                        Sources: {result.sources.length}
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      Search Calls: {result.searchCalls?.length || 0}
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!result ? (
                  <div className="text-center py-12 text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Enter a search query to get started</p>
                  </div>
                ) : result.error ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{result.error}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Main Result */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {result.text}
                      </p>
                    </div>

                    {/* Citations */}
                    {result.citations && result.citations.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Citations ({result.citations.length})</h3>
                        <div className="space-y-2">
                          {result.citations.map((citation: any, i: number) => (
                            <Card key={i} className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400 flex-shrink-0">
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm mb-1 truncate">
                                    {citation.title}
                                  </h4>
                                  <a
                                    href={citation.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                                  >
                                    {citation.url}
                                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                  </a>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sources (if available) */}
                    {result.sources && result.sources.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">All Sources Consulted ({result.sources.length})</h3>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <div className="flex flex-wrap gap-2">
                            {result.sources.map((source: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {typeof source === 'string' ? source : JSON.stringify(source)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
