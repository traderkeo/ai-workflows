'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Brain, Loader2, Plus, X, Search } from 'lucide-react';

export default function EmbeddingsDemo() {
  const [activeTab, setActiveTab] = useState('semantic-search');

  // Single embedding state
  const [singleText, setSingleText] = useState('');
  const [singleResult, setSingleResult] = useState<any>(null);

  // Semantic search state
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<string[]>([
    'The cat sat on the mat',
    'Dogs are loyal companions',
    'Machine learning is transforming technology',
    'Python is a popular programming language',
    'JavaScript powers modern web applications',
  ]);
  const [newDoc, setNewDoc] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);

  const examples = {
    search: [
      { query: 'programming languages', docs: ['Python', 'JavaScript', 'TypeScript'] },
      { query: 'pets and animals', docs: ['cats', 'dogs', 'birds'] },
      { query: 'AI and technology', docs: ['machine learning', 'neural networks', 'automation'] },
    ],
  };

  // Single embedding
  const handleGenerateEmbedding = async () => {
    if (!singleText.trim()) return;

    setIsLoading(true);
    setSingleResult(null);

    try {
      const response = await fetch('/api/demos/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'single-embedding',
          text: singleText,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      setSingleResult(data);
    } catch (error: any) {
      setSingleResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Semantic search
  const handleSemanticSearch = async () => {
    if (!searchQuery.trim() || documents.length === 0) return;

    setIsLoading(true);
    setSearchResults(null);

    try {
      // First, generate embeddings for documents
      const embeddingsResponse = await fetch('/api/demos/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch-embeddings',
          texts: documents,
        }),
      });

      if (!embeddingsResponse.ok) {
        throw new Error('Failed to generate embeddings');
      }

      const embeddingsData = await embeddingsResponse.json();

      // Prepare documents with embeddings
      const docsWithEmbeddings = documents.map((text, i) => ({
        text,
        embedding: embeddingsData.embeddings[i],
      }));

      // Perform semantic search
      const searchResponse = await fetch('/api/demos/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'semantic-search',
          query: searchQuery,
          documents: docsWithEmbeddings,
          topK: 5,
        }),
      });

      if (!searchResponse.ok) {
        throw new Error('Search failed');
      }

      const searchData = await searchResponse.json();
      setSearchResults(searchData);
    } catch (error: any) {
      setSearchResults({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const addDocument = () => {
    if (newDoc.trim()) {
      setDocuments([...documents, newDoc.trim()]);
      setNewDoc('');
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const loadSearchExample = (example: typeof examples.search[0]) => {
    setSearchQuery(example.query);
    setDocuments(example.docs);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
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
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <Brain className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-4xl font-bold">Embeddings & Semantic Search</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Generate vector embeddings and perform semantic similarity search
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="semantic-search">
              <Search className="w-4 h-4 mr-2" />
              Semantic Search
            </TabsTrigger>
            <TabsTrigger value="single-embedding">
              <Brain className="w-4 h-4 mr-2" />
              Generate Embedding
            </TabsTrigger>
          </TabsList>

          {/* Semantic Search Tab */}
          <TabsContent value="semantic-search">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Examples</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {examples.search.map((example, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => loadSearchExample(example)}
                      >
                        {example.query}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>Add documents to search through</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {documents.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded">
                          <span className="text-sm flex-1 truncate">{doc}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeDocument(i)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new document..."
                        value={newDoc}
                        onChange={(e) => setNewDoc(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addDocument()}
                      />
                      <Button size="sm" onClick={addDocument}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <Label htmlFor="search-query">Search Query</Label>
                      <Input
                        id="search-query"
                        placeholder="What are you looking for?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                      />
                    </div>

                    <Button
                      onClick={handleSemanticSearch}
                      disabled={isLoading || !searchQuery.trim() || documents.length === 0}
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
              <div>
                <Card className="min-h-[500px]">
                  <CardHeader>
                    <CardTitle>Search Results</CardTitle>
                    <CardDescription>Ranked by semantic similarity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!searchResults ? (
                      <div className="text-center py-12 text-gray-400">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Search results will appear here...</p>
                      </div>
                    ) : searchResults.error ? (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-600 dark:text-red-400">{searchResults.error}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="mb-4">
                          <Badge variant="secondary">
                            Query: {searchResults.query}
                          </Badge>
                          <Badge variant="secondary" className="ml-2">
                            {searchResults.count} results
                          </Badge>
                        </div>

                        {searchResults.results.map((result: any, i: number) => (
                          <Card key={i} className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-sm font-semibold text-orange-600 dark:text-orange-400">
                                {i + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm mb-2">{result.text}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    Similarity: {(result.similarity * 100).toFixed(1)}%
                                  </Badge>
                                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className="bg-orange-500 h-2 rounded-full transition-all"
                                      style={{ width: `${result.similarity * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Single Embedding Tab */}
          <TabsContent value="single-embedding">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Input Text</CardTitle>
                  <CardDescription>Enter text to generate embedding vector</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter any text to convert to vector embedding..."
                    value={singleText}
                    onChange={(e) => setSingleText(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />

                  <Button
                    onClick={handleGenerateEmbedding}
                    disabled={isLoading || !singleText.trim()}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    ) : (
                      <Brain className="mr-2 w-4 h-4" />
                    )}
                    Generate Embedding
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Embedding Vector</CardTitle>
                  {singleResult && !singleResult.error && (
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">
                        Dimensions: {singleResult.dimensions}
                      </Badge>
                      <Badge variant="secondary">
                        Tokens: {singleResult.usage?.tokens || 0}
                      </Badge>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {!singleResult ? (
                    <div className="text-center py-12 text-gray-400">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Embedding vector will appear here...</p>
                    </div>
                  ) : singleResult.error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <p className="text-red-600 dark:text-red-400">{singleResult.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-900 rounded-lg p-4">
                        <p className="text-green-400 font-mono text-xs mb-2">
                          First 10 values (of {singleResult.dimensions}):
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                          {singleResult.preview.map((val: number, i: number) => (
                            <div key={i} className="bg-gray-800 rounded px-2 py-1 text-xs text-green-300 font-mono">
                              {val.toFixed(4)}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
                        <p className="font-medium mb-2">What is an embedding?</p>
                        <p className="text-gray-600 dark:text-gray-400">
                          An embedding is a numerical vector representation of text. Similar texts have similar vectors,
                          enabling semantic search and similarity comparisons.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
