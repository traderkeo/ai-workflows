import React, { useState } from 'react';
import { Settings, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from './ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Label } from './ui/Label';
import { Slider } from './ui/Slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from './ui/Select';
import type { AIAgentNodeData } from '../types';

interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

interface AIAgentSettingsDialogProps {
  data: AIAgentNodeData;
  onUpdate: (field: keyof AIAgentNodeData, value: any) => void;
  children?: React.ReactNode;
}

export const AIAgentSettingsDialog: React.FC<AIAgentSettingsDialogProps> = ({
  data,
  onUpdate,
  children,
}) => {
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>(
    data.schemaFields || [{ name: '', type: 'string', description: '' }]
  );

  const mode = data.mode || 'text';

  const handleSchemaFieldsChange = (newFields: SchemaField[]) => {
    setSchemaFields(newFields);
    onUpdate('schemaFields', newFields);
  };

  const addSchemaField = () => {
    const newFields = [...schemaFields, { name: '', type: 'string' as const, description: '' }];
    handleSchemaFieldsChange(newFields);
  };

  const removeSchemaField = (index: number) => {
    const newFields = schemaFields.filter((_, i) => i !== index);
    handleSchemaFieldsChange(newFields);
  };

  const updateSchemaField = (index: number, field: Partial<SchemaField>) => {
    const newFields = schemaFields.map((f, i) => (i === index ? { ...f, ...field } : f));
    handleSchemaFieldsChange(newFields);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <button className="ai-node-button" style={{ padding: '6px 12px', fontSize: '11px' }}>
            <Settings size={14} style={{ marginRight: '4px' }} />
            Settings
          </button>
        )}
      </DialogTrigger>
      <DialogContent style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)' }}>
        <DialogHeader>
          <DialogTitle style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            letterSpacing: '0.01em',
            fontFamily: 'inherit',
          }}>
            AI Agent Configuration
          </DialogTitle>
          <DialogDescription style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--text-muted, #888)',
            letterSpacing: '0.01em',
            fontFamily: 'inherit',
            marginTop: '4px',
          }}>
            Configure your AI agent settings, model parameters, and structured data schema.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="config">
          <TabsList style={{ fontFamily: 'inherit' }}>
            <TabsTrigger value="config" style={{ 
              fontSize: '13px', 
              fontWeight: 500, 
              letterSpacing: '0.01em',
              fontFamily: 'inherit',
            }}>
              Configuration
            </TabsTrigger>
            {mode === 'structured' && (
              <TabsTrigger value="schema" style={{ 
                fontSize: '13px', 
                fontWeight: 500, 
                letterSpacing: '0.01em',
                fontFamily: 'inherit',
              }}>
                Schema
              </TabsTrigger>
            )}
            <TabsTrigger value="advanced" style={{ 
              fontSize: '13px', 
              fontWeight: 500, 
              letterSpacing: '0.01em',
              fontFamily: 'inherit',
            }}>
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'inherit' }}>
              {/* Mode */}
              <div>
                <Label style={{ 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  letterSpacing: '0.01em',
                  fontFamily: 'inherit',
                  marginBottom: '8px',
                  display: 'block',
                }}>
                  Mode
                </Label>
                <Select
                  value={mode}
                  onValueChange={(value) => onUpdate('mode', value as 'text' | 'structured')}
                >
                  <SelectTrigger style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 400 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Text Generation</SelectItem>
                    <SelectItem value="structured" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Structured Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Model */}
              <div>
                <Label style={{ 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  letterSpacing: '0.01em',
                  fontFamily: 'inherit',
                  marginBottom: '8px',
                  display: 'block',
                }}>
                  Model
                </Label>
                <Select
                  value={data.model || 'gpt-4o-mini'}
                  onValueChange={(value) => onUpdate('model', value)}
                >
                  <SelectTrigger style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 400 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>OpenAI</SelectLabel>
                      <SelectItem value="gpt-4o" style={{ fontFamily: 'inherit', fontSize: '14px' }}>GPT-4o (Most Capable)</SelectItem>
                      <SelectItem value="gpt-4o-mini" style={{ fontFamily: 'inherit', fontSize: '14px' }}>GPT-4o Mini (Fast)</SelectItem>
                      <SelectItem value="gpt-4-turbo" style={{ fontFamily: 'inherit', fontSize: '14px' }}>GPT-4 Turbo</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>Anthropic</SelectLabel>
                      <SelectItem value="claude-3-5-sonnet-20241022" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Claude 3.5 Sonnet (Latest)</SelectItem>
                      <SelectItem value="claude-3-5-haiku-20241022" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Claude 3.5 Haiku (Fast)</SelectItem>
                      <SelectItem value="claude-3-opus-20240229" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-3-sonnet-20240229" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Claude 3 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku-20240307" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Claude 3 Haiku</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>Google</SelectLabel>
                      <SelectItem value="gemini-2.5-pro" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Gemini 2.5 Pro (Latest)</SelectItem>
                      <SelectItem value="gemini-2.5-flash" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="gemini-2.0-flash" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Gemini 2.0 Flash</SelectItem>
                      <SelectItem value="gemini-1.5-pro" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="gemini-1.5-flash" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Gemini 1.5 Flash</SelectItem>
                      <SelectItem value="gemini-1.5-flash-8b" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Gemini 1.5 Flash 8B</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Prompt */}
              <div>
                <Label style={{ 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  letterSpacing: '0.01em',
                  fontFamily: 'inherit',
                  marginBottom: '8px',
                  display: 'block',
                }}>
                  Prompt
                </Label>
                <textarea
                  className="ai-node-input ai-node-textarea"
                  value={data.prompt || ''}
                  onChange={(e) => onUpdate('prompt', e.target.value)}
                  placeholder={
                    mode === 'text'
                      ? 'Enter your prompt...'
                      : 'Describe the structured data you need...'
                  }
                  rows={6}
                  style={{ 
                    resize: 'vertical', 
                    minHeight: '120px',
                    fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
                    fontSize: '13px',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                  }}
                />
              </div>

              {/* Instructions */}
              <div>
                <Label style={{ 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  letterSpacing: '0.01em',
                  fontFamily: 'inherit',
                  marginBottom: '8px',
                  display: 'block',
                }}>
                  Instructions (System Prompt)
                </Label>
                <textarea
                  className="ai-node-input ai-node-textarea"
                  value={data.instructions || ''}
                  onChange={(e) => onUpdate('instructions', e.target.value)}
                  placeholder="Optional system instructions for the AI..."
                  rows={4}
                  style={{ 
                    resize: 'vertical',
                    fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
                    fontSize: '13px',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                  }}
                />
              </div>
            </div>
          </TabsContent>

          {/* Schema Tab (only for structured mode) */}
          {mode === 'structured' && (
            <TabsContent value="schema">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'inherit' }}>
                {/* Schema Name */}
                <div>
                  <Label style={{ 
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    fontFamily: 'inherit',
                    marginBottom: '8px',
                    display: 'block',
                  }}>
                    Schema Name
                  </Label>
                  <input
                    type="text"
                    className="ai-node-input"
                    value={data.schemaName || ''}
                    onChange={(e) => onUpdate('schemaName', e.target.value)}
                    placeholder="e.g., UserProfile"
                    style={{
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      fontWeight: 400,
                    }}
                  />
                </div>

                {/* Schema Description */}
                <div>
                  <Label style={{ 
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    fontFamily: 'inherit',
                    marginBottom: '8px',
                    display: 'block',
                  }}>
                    Schema Description
                  </Label>
                  <input
                    type="text"
                    className="ai-node-input"
                    value={data.schemaDescription || ''}
                    onChange={(e) => onUpdate('schemaDescription', e.target.value)}
                    placeholder="Brief description of the schema..."
                    style={{
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      fontWeight: 400,
                    }}
                  />
                </div>

                {/* Schema Fields */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <Label style={{ 
                      marginBottom: 0,
                      fontSize: '13px',
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                      fontFamily: 'inherit',
                    }}>
                      Schema Fields
                    </Label>
                    <button
                      onClick={addSchemaField}
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(176, 38, 255, 0.15)',
                        border: '1px solid rgba(176, 38, 255, 0.4)',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        fontFamily: 'inherit',
                        letterSpacing: '0.01em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.4)';
                      }}
                    >
                      <Plus size={14} /> Add Field
                    </button>
                  </div>

                  {schemaFields.map((field, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '12px',
                        padding: '12px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '6px',
                        border: '1px solid rgba(176, 38, 255, 0.2)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="text"
                          className="ai-node-input"
                          value={field.name}
                          onChange={(e) => updateSchemaField(index, { name: e.target.value })}
                          placeholder="Field name"
                          style={{ 
                            flex: 1,
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            fontWeight: 400,
                          }}
                        />
                        <select
                          className="ai-node-select"
                          value={field.type}
                          onChange={(e) => updateSchemaField(index, { type: e.target.value as SchemaField['type'] })}
                          style={{ 
                            flex: 1,
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            fontWeight: 400,
                          }}
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="object">Object</option>
                          <option value="array">Array</option>
                        </select>
                        {schemaFields.length > 1 && (
                          <button
                            onClick={() => removeSchemaField(index)}
                            style={{
                              padding: '8px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.5)',
                              borderRadius: '6px',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.7)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                            }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        className="ai-node-input"
                        value={field.description || ''}
                        onChange={(e) => updateSchemaField(index, { description: e.target.value })}
                        placeholder="Description (optional)"
                        style={{ 
                          fontFamily: 'inherit',
                          fontSize: '13px',
                          fontWeight: 400,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}

          {/* Advanced Tab */}
          <TabsContent value="advanced">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Temperature */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                  <Label style={{ 
                    marginBottom: 0,
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    fontFamily: 'inherit',
                  }}>
                    Temperature
                  </Label>
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: 500,
                    color: 'var(--cyber-neon-cyan)', 
                    fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
                    letterSpacing: '0.01em',
                  }}>
                    {data.temperature ?? 0.7}
                  </span>
                </div>
                <Slider
                  value={[data.temperature ?? 0.7]}
                  onValueChange={(values) => onUpdate('temperature', values[0])}
                  min={0}
                  max={2}
                  step={0.1}
                />
                <p style={{ 
                  fontSize: '12px', 
                  fontWeight: 400,
                  color: 'var(--text-muted, #888)', 
                  marginTop: '8px',
                  fontFamily: 'inherit',
                  letterSpacing: '0.01em',
                }}>
                  Controls randomness: 0 is focused and deterministic, 2 is more creative and random.
                </p>
              </div>

              {/* Max Tokens (only for text mode) */}
              {mode === 'text' && (
                <div>
                  <Label style={{ 
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    fontFamily: 'inherit',
                    marginBottom: '8px',
                    display: 'block',
                  }}>
                    Max Tokens
                  </Label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="number"
                      className="ai-node-input"
                      value={data.maxTokens ?? 1000}
                      onChange={(e) => onUpdate('maxTokens', parseInt(e.target.value))}
                      min="1"
                      max="4000"
                      style={{ 
                        flex: 1,
                        fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
                        fontSize: '13px',
                        fontWeight: 400,
                      }}
                    />
                    <button
                      onClick={() => onUpdate('maxTokens', 500)}
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(176, 38, 255, 0.15)',
                        border: '1px solid rgba(176, 38, 255, 0.4)',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        fontFamily: 'inherit',
                        letterSpacing: '0.01em',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.4)';
                      }}
                    >
                      500
                    </button>
                    <button
                      onClick={() => onUpdate('maxTokens', 1000)}
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(176, 38, 255, 0.15)',
                        border: '1px solid rgba(176, 38, 255, 0.4)',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        fontFamily: 'inherit',
                        letterSpacing: '0.01em',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.4)';
                      }}
                    >
                      1000
                    </button>
                    <button
                      onClick={() => onUpdate('maxTokens', 2000)}
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(176, 38, 255, 0.15)',
                        border: '1px solid rgba(176, 38, 255, 0.4)',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        fontFamily: 'inherit',
                        letterSpacing: '0.01em',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.4)';
                      }}
                    >
                      2000
                    </button>
                    <button
                      onClick={() => onUpdate('maxTokens', 4000)}
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(176, 38, 255, 0.15)',
                        border: '1px solid rgba(176, 38, 255, 0.4)',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        fontFamily: 'inherit',
                        letterSpacing: '0.01em',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.4)';
                      }}
                    >
                      4000
                    </button>
                  </div>
                  <p style={{ 
                    fontSize: '12px',
                    fontWeight: 400,
                    color: 'var(--text-muted, #888)',
                    fontFamily: 'inherit',
                    letterSpacing: '0.01em',
                  }}>
                    Maximum number of tokens to generate in the response.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
