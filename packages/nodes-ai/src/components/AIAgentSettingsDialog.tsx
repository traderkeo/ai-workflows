import React, { useState, useEffect } from 'react';
import { Settings, Plus, X, Image, Mic, Volume2, Eye, Wrench, Zap, FileJson, Brain, Copy, Check } from 'lucide-react';
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
import { Field } from './ui/field';
import type { AIAgentNodeData } from '../types';
import { MODEL_CONFIGS, getModelConfig, modelSupportsMode, modelSupportsCapability, getCapabilityInfo, type GenerationMode } from '../config/modelCapabilities';
import { FileAttachment } from './FileAttachment';
import { ImageSourceSelector } from './ImageSourceSelector';
import { getAvailableVariablesWithInfo } from '../utils/variableResolver';

interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

interface AIAgentSettingsDialogProps {
  data: AIAgentNodeData;
  onUpdate: (field: keyof AIAgentNodeData, value: any) => void;
  children?: React.ReactNode;
  nodeId?: string;
  nodes?: any[];
  edges?: any[];
}

export const AIAgentSettingsDialog: React.FC<AIAgentSettingsDialogProps> = ({
  data,
  onUpdate,
  children,
  nodeId,
  nodes = [],
  edges = [],
}) => {
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>(
    data.schemaFields || [{ name: '', type: 'string', description: '' }]
  );
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  const mode = data.mode || 'text';
  const selectedModel = data.model || 'gpt-4o-mini';
  const modelConfig = getModelConfig(selectedModel);

  // Get available variables with their info
  const availableVariables = nodeId ? getAvailableVariablesWithInfo(nodeId, nodes, edges) : [];

  // Validate mode against model capabilities when model changes
  useEffect(() => {
    if (selectedModel && mode) {
      if (!modelSupportsMode(selectedModel, mode as GenerationMode)) {
        // Auto-switch to first supported mode if current mode is not supported
        const supportedModes = modelConfig?.supportedModes || ['text'];
        if (supportedModes.length > 0 && supportedModes[0] !== mode) {
          onUpdate('mode', supportedModes[0]);
        }
      }

      // If switching to a model that doesn't support edit/variation, reset to generate
      if (mode === 'image') {
        const supportsEditAndVariation = selectedModel === 'dall-e-2' || selectedModel === 'gpt-image-1';
        if (!supportsEditAndVariation && (data.imageOperation === 'edit' || data.imageOperation === 'variation')) {
          onUpdate('imageOperation', 'generate');
        }
      }
    }
  }, [selectedModel]);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVariable(text);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'audio':
        return '🔊';
      case 'text':
        return '📝';
      case 'number':
        return '🔢';
      case 'boolean':
        return '✓';
      case 'array':
        return '📋';
      case 'object':
        return '{}';
      default:
        return '📄';
    }
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
              {/* Model (moved to top) */}
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
                      <SelectLabel style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>OpenAI - GPT-5</SelectLabel>
                      <SelectItem value="gpt-5-pro" style={{ fontFamily: 'inherit', fontSize: '14px' }}>GPT-5 Pro</SelectItem>
                      <SelectItem value="gpt-5" style={{ fontFamily: 'inherit', fontSize: '14px' }}>GPT-5</SelectItem>
                      <SelectItem value="gpt-5-mini" style={{ fontFamily: 'inherit', fontSize: '14px' }}>GPT-5 Mini</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>OpenAI - GPT-4.1</SelectLabel>
                      <SelectItem value="gpt-4.1" style={{ fontFamily: 'inherit', fontSize: '14px' }}>GPT-4.1</SelectItem>
                      <SelectItem value="gpt-4.1-mini" style={{ fontFamily: 'inherit', fontSize: '14px' }}>GPT-4.1 Mini</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>OpenAI - GPT-4o</SelectLabel>
                      <SelectItem value="gpt-4o" style={{ fontFamily: 'inherit', fontSize: '14px' }}>GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini" style={{ fontFamily: 'inherit', fontSize: '14px' }}>GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-4o-audio-preview" style={{ fontFamily: 'inherit', fontSize: '14px' }}>GPT-4o Audio</SelectItem>
                      <SelectItem value="gpt-4-turbo" style={{ fontFamily: 'inherit', fontSize: '14px' }}>GPT-4 Turbo</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>OpenAI - Reasoning</SelectLabel>
                      <SelectItem value="o3" style={{ fontFamily: 'inherit', fontSize: '14px' }}>O3</SelectItem>
                      <SelectItem value="o3-mini" style={{ fontFamily: 'inherit', fontSize: '14px' }}>O3 Mini</SelectItem>
                      <SelectItem value="o1" style={{ fontFamily: 'inherit', fontSize: '14px' }}>O1</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>OpenAI - Specialized</SelectLabel>
                      <SelectItem value="dall-e-3" style={{ fontFamily: 'inherit', fontSize: '14px' }}>DALL-E 3</SelectItem>
                      <SelectItem value="dall-e-2" style={{ fontFamily: 'inherit', fontSize: '14px' }}>DALL-E 2</SelectItem>
                      <SelectItem value="tts-1" style={{ fontFamily: 'inherit', fontSize: '14px' }}>TTS-1</SelectItem>
                      <SelectItem value="tts-1-hd" style={{ fontFamily: 'inherit', fontSize: '14px' }}>TTS-1 HD</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>Anthropic</SelectLabel>
                      <SelectItem value="claude-3-5-sonnet-20241022" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="claude-3-5-haiku-20241022" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Claude 3.5 Haiku</SelectItem>
                      <SelectItem value="claude-3-opus-20240229" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-3-sonnet-20240229" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Claude 3 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku-20240307" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Claude 3 Haiku</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>Google</SelectLabel>
                      <SelectItem value="gemini-2.5-pro" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="gemini-2.5-flash" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="gemini-2.0-flash" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Gemini 2.0 Flash</SelectItem>
                      <SelectItem value="gemini-1.5-pro" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="gemini-1.5-flash" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Gemini 1.5 Flash</SelectItem>
                      <SelectItem value="gemini-1.5-flash-8b" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Gemini 1.5 Flash 8B</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Model Capabilities Display */}
                {modelConfig && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '6px',
                    border: '1px solid rgba(176, 38, 255, 0.2)',
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-muted, #888)',
                      marginBottom: '8px',
                      fontFamily: 'inherit',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                    }}>
                      Model Capabilities
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {modelConfig.capabilities.map((capability) => {
                        const capInfo = getCapabilityInfo(capability);
                        return (
                          <div
                            key={capability}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              background: `${capInfo.color}15`,
                              border: `1px solid ${capInfo.color}40`,
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 500,
                              color: capInfo.color,
                              fontFamily: 'inherit',
                            }}
                          >
                            <span>{capInfo.icon}</span>
                            <span>{capInfo.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Mode (moved below model) */}
              <div>
                <Label style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  fontFamily: 'inherit',
                  marginBottom: '8px',
                  display: 'block',
                }}>
                  Generation Mode
                </Label>
                <Select
                  value={mode}
                  onValueChange={(value) => onUpdate('mode', value as AIAgentNodeData['mode'])}
                >
                  <SelectTrigger style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 400 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="text"
                      disabled={!modelSupportsMode(selectedModel, 'text')}
                      style={{ fontFamily: 'inherit', fontSize: '14px' }}
                    >
                      Text Generation
                    </SelectItem>
                    <SelectItem
                      value="structured"
                      disabled={!modelSupportsMode(selectedModel, 'structured')}
                      style={{ fontFamily: 'inherit', fontSize: '14px' }}
                    >
                      Structured Data
                    </SelectItem>
                    <SelectItem
                      value="image"
                      disabled={!modelSupportsMode(selectedModel, 'image')}
                      style={{ fontFamily: 'inherit', fontSize: '14px' }}
                    >
                      Image Generation
                    </SelectItem>
                    <SelectItem
                      value="audio"
                      disabled={!modelSupportsMode(selectedModel, 'audio')}
                      style={{ fontFamily: 'inherit', fontSize: '14px' }}
                    >
                      Audio Generation
                    </SelectItem>
                    <SelectItem
                      value="speech"
                      disabled={!modelSupportsMode(selectedModel, 'speech')}
                      style={{ fontFamily: 'inherit', fontSize: '14px' }}
                    >
                      Text-to-Speech
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Image Operation Selector (only for image mode) */}
              {mode === 'image' && (
                <div style={{ marginBottom: '16px' }}>
                  <Label style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    fontFamily: 'inherit',
                    marginBottom: '8px',
                    display: 'block',
                  }}>
                    Image Operation
                  </Label>
                  <Select
                    value={data.imageOperation || 'generate'}
                    onValueChange={(value) => onUpdate('imageOperation', value as AIAgentNodeData['imageOperation'])}
                  >
                    <SelectTrigger style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 400 }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generate" style={{ fontFamily: 'inherit', fontSize: '14px' }}>
                        Generate - Create new image from text
                      </SelectItem>
                      {/* Edit and Variation only work with DALL-E 2 and GPT-Image-1 */}
                      {(selectedModel === 'dall-e-2' || selectedModel === 'gpt-image-1') && (
                        <>
                          <SelectItem value="edit" style={{ fontFamily: 'inherit', fontSize: '14px' }}>
                            Edit - Modify existing image
                          </SelectItem>
                          <SelectItem value="variation" style={{ fontFamily: 'inherit', fontSize: '14px' }}>
                            Variation - Create variant of image
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Image Source Selector (for edit and variation operations) */}
              {mode === 'image' && (data.imageOperation === 'edit' || data.imageOperation === 'variation') && (
                <div style={{ marginBottom: '16px' }}>
                  <ImageSourceSelector
                    value={data.imageSource || ''}
                    onUpdate={(value) => onUpdate('imageSource', value)}
                    availableImages={availableVariables.filter(v => v.type === 'image')}
                    label="Source Image"
                    helperText={data.imageOperation === 'edit' ? 'Image to edit with your prompt' : 'Image to create variations of'}
                    required={true}
                  />
                </div>
              )}

              {/* Mask Selector (for edit operation only) */}
              {mode === 'image' && data.imageOperation === 'edit' && (
                <div style={{ marginBottom: '16px' }}>
                  <ImageSourceSelector
                    value={data.imageMask || ''}
                    onUpdate={(value) => onUpdate('imageMask', value)}
                    availableImages={availableVariables.filter(v => v.type === 'image')}
                    label="Mask Image (Optional)"
                    helperText="Transparent areas indicate where to edit. Leave empty to edit entire image."
                    required={false}
                  />
                </div>
              )}

              {/* Available Variables */}
              <div style={{ marginBottom: '16px' }}>
                <Label style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '8px',
                  display: 'block',
                  letterSpacing: '0.01em',
                }}>
                  Available Variables {availableVariables.length > 0 && `(${availableVariables.length})`}
                </Label>
                {availableVariables.length > 0 ? (
                  <>
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color, #333)',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    }}>
                      {availableVariables.map((varInfo, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 12px',
                          borderBottom: idx < availableVariables.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontSize: '16px', lineHeight: '1', paddingTop: '2px' }}>
                          {getTypeIcon(varInfo.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px',
                          }}>
                            <code style={{
                              fontSize: '12px',
                              fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
                              color: 'var(--cyber-neon-cyan, #00f0ff)',
                              fontWeight: 500,
                            }}>
                              {varInfo.variable}
                            </code>
                            <button
                              onClick={() => copyToClipboard(varInfo.variable)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: copiedVariable === varInfo.variable ? 'var(--cyber-neon-green, #39ff14)' : 'var(--text-muted, #888)',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s',
                              }}
                              title="Copy variable"
                            >
                              {copiedVariable === varInfo.variable ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-muted, #888)',
                            marginBottom: '2px',
                            fontWeight: 400,
                          }}>
                            from: {varInfo.nodeLabel}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary, #aaa)',
                            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {varInfo.preview}
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-muted, #666)',
                      marginTop: '6px',
                      fontStyle: 'italic',
                    }}>
                      💡 Use these variables in your prompt by typing or copying them
                    </div>
                  </>
                ) : (
                  <div style={{
                    padding: '20px',
                    border: '1px dashed var(--border-color, #333)',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: 'var(--text-muted, #888)',
                  }}>
                    <div style={{ marginBottom: '8px', opacity: 0.5 }}>📦</div>
                    <div>No variables available yet</div>
                    <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                      Connect nodes with outputs or run nodes to create variables
                    </div>
                  </div>
                )}
              </div>

              {/* Prompt */}
              <Field label="Prompt">
                <textarea
                  className="ai-node-input ai-node-textarea"
                  value={data.prompt || ''}
                  onChange={(e) => onUpdate('prompt', e.target.value)}
                  placeholder={
                    mode === 'text'
                      ? 'Enter your prompt... Use {{variableName}} to reference outputs from other nodes'
                      : mode === 'structured'
                      ? 'Describe the structured data you need... Use {{variableName}} to reference outputs'
                      : mode === 'image'
                      ? 'Describe the image you want to generate... Use {{variableName}} to reference data'
                      : mode === 'speech'
                      ? 'Enter the text you want to convert to speech... Use {{variableName}} to reference text'
                      : mode === 'audio'
                      ? 'Enter your audio generation prompt...'
                      : 'Enter your prompt...'
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
              </Field>

              {/* File Attachments (only for vision-capable models in text/structured modes) */}
              {(mode === 'text' || mode === 'structured') && modelSupportsCapability(selectedModel, 'vision') && (
                <Field label="Attachments (Optional)" htmlFor="file-upload">
                  <FileAttachment
                    attachments={data.attachments}
                    onUpdate={(attachments) => onUpdate('attachments', attachments)}
                    acceptedTypes="all"
                    maxFiles={5}
                  />
                </Field>
              )}

              {/* Instructions (only for text and structured modes) */}
              {(mode === 'text' || mode === 'structured') && (
                <Field label="Instructions (System Prompt)" helperText="Optional system instructions for the AI">
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
                </Field>
              )}


              {/* Speech Generation Settings */}
              {mode === 'speech' && (
                <>
                  <div>
                    <Label style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                      fontFamily: 'inherit',
                      marginBottom: '8px',
                      display: 'block',
                    }}>
                      Voice
                    </Label>
                    <Select
                      value={data.voice || 'alloy'}
                      onValueChange={(value) => onUpdate('voice', value as AIAgentNodeData['voice'])}
                    >
                      <SelectTrigger style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 400 }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alloy" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Alloy</SelectItem>
                        <SelectItem value="echo" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Echo</SelectItem>
                        <SelectItem value="fable" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Fable</SelectItem>
                        <SelectItem value="onyx" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Onyx</SelectItem>
                        <SelectItem value="nova" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Nova</SelectItem>
                        <SelectItem value="shimmer" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Shimmer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <Label style={{
                        marginBottom: 0,
                        fontSize: '13px',
                        fontWeight: 500,
                        letterSpacing: '0.01em',
                        fontFamily: 'inherit',
                      }}>
                        Speech Speed
                      </Label>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--cyber-neon-cyan)',
                        fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
                        letterSpacing: '0.01em',
                      }}>
                        {data.speechSpeed ?? 1.0}x
                      </span>
                    </div>
                    <Slider
                      value={[data.speechSpeed ?? 1.0]}
                      onValueChange={(values) => onUpdate('speechSpeed', values[0])}
                      min={0.25}
                      max={4.0}
                      step={0.25}
                    />
                    <p style={{
                      fontSize: '12px',
                      fontWeight: 400,
                      color: 'var(--text-muted, #888)',
                      marginTop: '8px',
                      fontFamily: 'inherit',
                      letterSpacing: '0.01em',
                    }}>
                      Adjust playback speed: 0.25x (slowest) to 4.0x (fastest)
                    </p>
                  </div>
                </>
              )}
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
              {/* Image Generation Advanced Settings */}
              {mode === 'image' && (
                <>
                  <div>
                    <Label style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                      fontFamily: 'inherit',
                      marginBottom: '8px',
                      display: 'block',
                    }}>
                      Image Size
                    </Label>
                    <Select
                      value={data.imageSize || '1024x1024'}
                      onValueChange={(value) => onUpdate('imageSize', value as AIAgentNodeData['imageSize'])}
                    >
                      <SelectTrigger style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 400 }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024x1024" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Square (1024x1024)</SelectItem>
                        <SelectItem value="1792x1024" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Landscape (1792x1024)</SelectItem>
                        <SelectItem value="1024x1792" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Portrait (1024x1792)</SelectItem>
                        <SelectItem value="auto" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                      fontFamily: 'inherit',
                      marginBottom: '8px',
                      display: 'block',
                    }}>
                      Quality
                    </Label>
                    <Select
                      value={data.imageQuality || 'standard'}
                      onValueChange={(value) => onUpdate('imageQuality', value as AIAgentNodeData['imageQuality'])}
                    >
                      <SelectTrigger style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 400 }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Standard</SelectItem>
                        <SelectItem value="hd" style={{ fontFamily: 'inherit', fontSize: '14px' }}>HD</SelectItem>
                        <SelectItem value="high" style={{ fontFamily: 'inherit', fontSize: '14px' }}>High (gpt-image-1)</SelectItem>
                        <SelectItem value="medium" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Medium (gpt-image-1)</SelectItem>
                        <SelectItem value="low" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Low (gpt-image-1)</SelectItem>
                        <SelectItem value="auto" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                      fontFamily: 'inherit',
                      marginBottom: '8px',
                      display: 'block',
                    }}>
                      Style
                    </Label>
                    <Select
                      value={data.imageStyle || 'natural'}
                      onValueChange={(value) => onUpdate('imageStyle', value as AIAgentNodeData['imageStyle'])}
                    >
                      <SelectTrigger style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 400 }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="natural" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Natural</SelectItem>
                        <SelectItem value="vivid" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Vivid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                      fontFamily: 'inherit',
                      marginBottom: '8px',
                      display: 'block',
                    }}>
                      Background
                    </Label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Select
                        value={data.imageBackground === 'transparent' || data.imageBackground === 'opaque' || data.imageBackground === 'auto' || !data.imageBackground ? (data.imageBackground || 'auto') : 'custom'}
                        onValueChange={(value) => {
                          if (value === 'custom') {
                            onUpdate('imageBackground', '#ffffff');
                          } else {
                            onUpdate('imageBackground', value);
                          }
                        }}
                      >
                        <SelectTrigger style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 400, flex: 1 }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Auto</SelectItem>
                          <SelectItem value="transparent" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Transparent (gpt-image-1)</SelectItem>
                          <SelectItem value="opaque" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Opaque (gpt-image-1)</SelectItem>
                          <SelectItem value="custom" style={{ fontFamily: 'inherit', fontSize: '14px' }}>Custom Color</SelectItem>
                        </SelectContent>
                      </Select>
                      {data.imageBackground && data.imageBackground !== 'auto' && data.imageBackground !== 'transparent' && data.imageBackground !== 'opaque' && (
                        <input
                          type="color"
                          value={data.imageBackground}
                          onChange={(e) => onUpdate('imageBackground', e.target.value)}
                          style={{
                            width: '48px',
                            height: '38px',
                            border: '1px solid rgba(176, 38, 255, 0.4)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: 'transparent',
                          }}
                        />
                      )}
                    </div>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: 400,
                      color: 'var(--text-muted, #888)',
                      marginTop: '8px',
                      fontFamily: 'inherit',
                      letterSpacing: '0.01em',
                    }}>
                      Background color or transparency (gpt-image-1 only)
                    </p>
                  </div>

                  <div>
                    <Label style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                      fontFamily: 'inherit',
                      marginBottom: '8px',
                      display: 'block',
                    }}>
                      Output Format
                    </Label>
                    <Select
                      value={data.imageOutputFormat || 'png'}
                      onValueChange={(value) => onUpdate('imageOutputFormat', value as AIAgentNodeData['imageOutputFormat'])}
                    >
                      <SelectTrigger style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 400 }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png" style={{ fontFamily: 'inherit', fontSize: '14px' }}>PNG</SelectItem>
                        <SelectItem value="jpeg" style={{ fontFamily: 'inherit', fontSize: '14px' }}>JPEG (gpt-image-1)</SelectItem>
                        <SelectItem value="webp" style={{ fontFamily: 'inherit', fontSize: '14px' }}>WebP (gpt-image-1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Temperature (for non-image modes) */}
              {mode !== 'image' && (
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
              )}

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
