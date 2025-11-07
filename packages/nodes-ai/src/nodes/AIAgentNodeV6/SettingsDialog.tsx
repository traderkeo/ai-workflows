import React, { useState } from 'react';
import { Settings, MessageSquare, Sliders, Wrench, Code, History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ModelSelector } from '../../components/ModelSelector';
import type { AIAgentNodeData } from '../../types';
import type { GenerationMode } from '../../config/modelCapabilities';
import { MenuDock } from './MenuDock';

interface SettingsDialogProps {
  data: AIAgentNodeData;
  nodeId: string;
  updateNode: (nodeId: string, data: Partial<AIAgentNodeData>) => void;
  localPrompt: string;
  setLocalPrompt: (value: string) => void;
  localInstructions: string;
  setLocalInstructions: (value: string) => void;
  debouncedUpdate: (data: Partial<AIAgentNodeData>) => void;
  availableVariables: string[];
  newUserMessage: string;
  setNewUserMessage: (value: string) => void;
}

type BuiltInToolKey = 'calculator' | 'search' | 'dateTime';

const MENU_ITEMS = [
  { id: 'prompt', label: 'Prompt', icon: MessageSquare },
  { id: 'model', label: 'Model', icon: Settings },
  { id: 'parameters', label: 'Params', icon: Sliders },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'custom-tools', label: 'Custom', icon: Code },
  { id: 'history', label: 'History', icon: History },
];

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  data,
  nodeId,
  updateNode,
  localPrompt,
  setLocalPrompt,
  localInstructions,
  setLocalInstructions,
  debouncedUpdate,
  availableVariables,
  newUserMessage,
  setNewUserMessage,
}) => {
  const [activeSection, setActiveSection] = useState('prompt');

  const handleChange = (field: keyof AIAgentNodeData, value: any) => {
    updateNode(nodeId, { [field]: value });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings size={14} /> Settings
        </Button>
      </DialogTrigger>
      <DialogContent style={{ maxWidth: "800px", maxHeight: "85vh", width: "90vw" }}>
        <DialogHeader>
          <DialogTitle>AI Agent Settings</DialogTitle>
        </DialogHeader>

        <div style={{ display: "flex", gap: "16px", marginTop: "16px", overflow: "hidden" }}>
          <MenuDock
            items={MENU_ITEMS}
            activeItem={activeSection}
            onItemChange={setActiveSection}
          />

          <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px", maxHeight: "60vh" }}>
            {/* Prompt & Instructions Section */}
            {activeSection === 'prompt' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--cyber-neon-purple, #b026ff)", margin: "0 0 8px 0", paddingBottom: "8px", borderBottom: "1px solid rgba(176, 38, 255, 0.3)" }}>Prompt & Instructions</h3>
                <div className="ai-node-field">
                  <label className="ai-node-field-label">System Instructions</label>
                  <textarea
                    className="ai-node-input ai-node-textarea nodrag"
                    rows={4}
                    value={localInstructions}
                    onChange={(e) => {
                      setLocalInstructions(e.target.value);
                      debouncedUpdate({ instructions: e.target.value });
                    }}
                    placeholder="You are a helpful agent..."
                  />
                </div>
                <div className="ai-node-field">
                  <label className="ai-node-field-label">Prompt</label>
                  <textarea
                    className="ai-node-input ai-node-textarea nodrag"
                    rows={6}
                    value={localPrompt}
                    onChange={(e) => {
                      setLocalPrompt(e.target.value);
                      debouncedUpdate({ prompt: e.target.value });
                    }}
                    placeholder="Ask the agent... Use variables like {{input}}"
                  />
                  {availableVariables.length > 0 && (
                    <div style={{ marginTop: 8, color: '#888', fontSize: 11 }}>
                      <strong>Available variables:</strong> {availableVariables.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Model Settings Section */}
            {activeSection === 'model' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--cyber-neon-purple, #b026ff)", margin: "0 0 8px 0", paddingBottom: "8px", borderBottom: "1px solid rgba(176, 38, 255, 0.3)" }}>Model Settings</h3>
                <div className="ai-node-field">
                  <label className="ai-node-field-label">Model</label>
                  <ModelSelector
                    value={data.model || 'gpt-4o-mini'}
                    mode={'text' as GenerationMode}
                    onChange={(id) => handleChange('model', id)}
                    allowCustomId
                  />
                </div>
              </div>
            )}

            {/* Parameters Section */}
            {activeSection === 'parameters' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--cyber-neon-purple, #b026ff)", margin: "0 0 8px 0", paddingBottom: "8px", borderBottom: "1px solid rgba(176, 38, 255, 0.3)" }}>Parameters</h3>
                <div className="ai-node-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="ai-node-field-label">Temperature</label>
                    <Input
                      type="number"
                      min={0}
                      max={2}
                      step={0.1}
                      value={data.temperature ?? 0.7}
                      onChange={(e) => handleChange('temperature', parseFloat((e.target as HTMLInputElement).value))}
                    />
                  </div>
                  <div>
                    <label className="ai-node-field-label">Max Tokens</label>
                    <Input
                      type="number"
                      min={1}
                      max={4000}
                      value={data.maxTokens ?? 1000}
                      onChange={(e) => handleChange('maxTokens', parseInt((e.target as HTMLInputElement).value))}
                    />
                  </div>
                </div>
                <div className="ai-node-field">
                  <label className="ai-node-field-label" style={{ marginBottom: 8 }}>Options</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={data.appendAssistantToHistory ?? true}
                        onChange={(e) => handleChange('appendAssistantToHistory', e.target.checked)}
                      />
                      <span>Append Assistant Reply to History</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Built-in Tools Section */}
            {activeSection === 'tools' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--cyber-neon-purple, #b026ff)", margin: "0 0 8px 0", paddingBottom: "8px", borderBottom: "1px solid rgba(176, 38, 255, 0.3)" }}>Built-in Tools</h3>
                <div className="ai-node-field">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(['calculator', 'search', 'dateTime'] as BuiltInToolKey[]).map((k) => (
                      <label
                        key={k}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          border: '1px solid rgba(176,38,255,0.3)',
                          padding: '12px 16px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          background: data.tools?.[k] ? 'rgba(176,38,255,0.1)' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!data.tools?.[k]}
                          onChange={(e) =>
                            handleChange('tools', { ...(data.tools || {}), [k]: e.target.checked })
                          }
                        />
                        <span style={{ textTransform: 'capitalize', fontSize: 14 }}>{k}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Tools Section */}
            {activeSection === 'custom-tools' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--cyber-neon-purple, #b026ff)", margin: "0 0 8px 0", paddingBottom: "8px", borderBottom: "1px solid rgba(176, 38, 255, 0.3)" }}>Custom Tools</h3>
                <div className="ai-node-field">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(data.customTools || []).map((t, i) => (
                      <div
                        key={i}
                        style={{
                          border: '1px solid rgba(176,38,255,0.3)',
                          borderRadius: 8,
                          padding: 12,
                          background: 'rgba(0,0,0,0.2)',
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                          <input
                            className="ai-node-input"
                            value={t.name}
                            onChange={(e) => {
                              const arr = [...(data.customTools || [])];
                              arr[i] = { ...arr[i], name: e.target.value };
                              updateNode(nodeId, { customTools: arr });
                            }}
                            placeholder="Tool name"
                          />
                          <button
                            onClick={() => {
                              const arr = [...(data.customTools || [])];
                              arr.splice(i, 1);
                              updateNode(nodeId, { customTools: arr });
                            }}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(239,68,68,0.2)',
                              border: '1px solid rgba(239,68,68,0.5)',
                              borderRadius: 6,
                              color: '#fff',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          className="ai-node-input"
                          style={{ marginTop: 8 }}
                          value={t.description || ''}
                          onChange={(e) => {
                            const arr = [...(data.customTools || [])];
                            arr[i] = { ...arr[i], description: e.target.value };
                            updateNode(nodeId, { customTools: arr });
                          }}
                          placeholder="Description"
                        />
                        <textarea
                          className="ai-node-input ai-node-textarea nodrag"
                          rows={3}
                          style={{ marginTop: 8 }}
                          value={t.parametersJson || ''}
                          onChange={(e) => {
                            const arr = [...(data.customTools || [])];
                            arr[i] = { ...arr[i], parametersJson: e.target.value };
                            updateNode(nodeId, { customTools: arr });
                          }}
                          placeholder='Parameters JSON (e.g. {"type":"object","properties":{...}})'
                        />
                        <input
                          className="ai-node-input"
                          style={{ marginTop: 8 }}
                          value={t.endpointUrl || ''}
                          onChange={(e) => {
                            const arr = [...(data.customTools || [])];
                            arr[i] = { ...arr[i], endpointUrl: e.target.value };
                            updateNode(nodeId, { customTools: arr });
                          }}
                          placeholder="Webhook URL (optional; allowlisted)"
                        />
                        <div style={{ color: '#888', fontSize: 11, marginTop: 6 }}>
                          Server will POST {`{ args, tool }`} to this URL if provided.
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        updateNode(nodeId, {
                          customTools: [
                            ...(data.customTools || []),
                            { name: 'myTool', description: '', parametersJson: '' },
                          ],
                        })
                      }
                      style={{
                        padding: '10px 16px',
                        background: 'rgba(176,38,255,0.25)',
                        border: '1px solid rgba(176,38,255,0.5)',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Add Tool
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Chat History Section */}
            {activeSection === 'history' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--cyber-neon-purple, #b026ff)", margin: "0 0 8px 0", paddingBottom: "8px", borderBottom: "1px solid rgba(176, 38, 255, 0.3)" }}>Chat History</h3>
                <div className="ai-node-field">
                  <div
                    className="ai-node-field-value"
                    style={{
                      maxHeight: 300,
                      overflowY: 'auto',
                      padding: 12,
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 6,
                      border: '1px solid rgba(176,38,255,0.2)',
                    }}
                  >
                    {(data.messages || []).length === 0 ? (
                      <div style={{ color: '#888', fontSize: 13 }}>No messages yet.</div>
                    ) : (
                      (data.messages || []).map((m, i) => (
                        <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span
                            style={{
                              color: m.role === 'user' ? '#0ff' : '#b026ff',
                              fontSize: 11,
                              textTransform: 'uppercase',
                              fontWeight: 600,
                            }}
                          >
                            {m.role}
                          </span>
                          <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', marginTop: 4 }}>{m.content}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, marginTop: 12 }}>
                    <textarea
                      className="ai-node-input ai-node-textarea nodrag"
                      rows={2}
                      value={newUserMessage}
                      onChange={(e) => setNewUserMessage(e.target.value)}
                      placeholder="Add user message..."
                    />
                    <button
                      onClick={() => {
                        if (!newUserMessage.trim()) return;
                        const msgs = [...(data.messages || []), { role: 'user' as const, content: newUserMessage.trim() }];
                        setNewUserMessage('');
                        updateNode(nodeId, { messages: msgs });
                      }}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(34,197,94,0.25)',
                        border: '1px solid rgba(34,197,94,0.5)',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => updateNode(nodeId, { messages: [] })}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(239,68,68,0.2)',
                        border: '1px solid rgba(239,68,68,0.5)',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
