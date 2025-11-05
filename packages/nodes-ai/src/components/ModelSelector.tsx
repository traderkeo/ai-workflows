import React, { useMemo, useState } from 'react';
import { MODEL_CONFIGS, getModelsByMode, getCapabilityInfo, type GenerationMode } from '../config/modelCapabilities';

interface ModelSelectorProps {
  value?: string;
  mode?: GenerationMode; // filter by supported mode
  onChange: (modelId: string) => void;
  allowCustomId?: boolean;
  placeholder?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  mode,
  onChange,
  allowCustomId = true,
  placeholder = 'Search models…',
}) => {
  const [query, setQuery] = useState('');

  const all = useMemo(() => {
    const arr = mode ? getModelsByMode(mode) : Object.values(MODEL_CONFIGS);
    return arr.filter((m) => !m.disabled);
  }, [mode]);

  const models = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((m) =>
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      (m.description || '').toLowerCase().includes(q)
    );
  }, [all, query]);

  const selected = value ? MODEL_CONFIGS[value] : undefined;

  return (
    <div className="nopan nodrag" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Current selection */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: '#bbb' }}>
          Selected: {selected ? (
            <span style={{ color: '#00f0ff' }}>{selected.name}</span>
          ) : value ? (
            <span style={{ color: '#00f0ff' }}>{value}</span>
          ) : (
            <span style={{ color: '#888' }}>none</span>
          )}
        </div>
        {value && (
          <button type="button" onClick={() => onChange('')} style={{ fontSize: 11, color: '#aaa', background: 'none', border: '1px solid rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: 4 }}>Clear</button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        className="ai-node-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* List */}
      <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid rgba(176,38,255,0.3)', borderRadius: 6, padding: 6, background: 'rgba(0,0,0,0.2)' }}>
        {models.length === 0 && (
          <div style={{ fontSize: 12, color: '#888' }}>No models match “{query}”.</div>
        )}
        {models.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px',
              marginBottom: 6,
              background: value === m.id ? 'rgba(0,240,255,0.12)' : 'transparent',
              border: `1px solid ${value === m.id ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'var(--font-geist-mono, monospace)' }}>{m.id}</div>
              </div>
              <span style={{ fontSize: 10, color: '#0ff', border: '1px solid rgba(0,240,255,0.5)', padding: '2px 6px', borderRadius: 12, textTransform: 'uppercase' }}>{m.provider}</span>
            </div>
            {m.description && (
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{m.description}</div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {(m.capabilities || []).slice(0, 6).map((c) => {
                const info = getCapabilityInfo(c as any);
                return (
                  <span key={c} style={{ fontSize: 10, color: info.color, border: `1px solid ${info.color}55`, padding: '2px 6px', borderRadius: 12 }}>
                    {info.icon} {info.label}
                  </span>
                );
              })}
              {typeof (m as any).contextLength === 'number' && (
                <span style={{ fontSize: 10, color: '#b026ff', border: '1px solid #b026ff55', padding: '2px 6px', borderRadius: 12 }}>Ctx {((m as any).contextLength).toLocaleString()}</span>
              )}
              {typeof m.maxTokens === 'number' && (
                <span style={{ fontSize: 10, color: '#39ff14', border: '1px solid #39ff1455', padding: '2px 6px', borderRadius: 12 }}>Max {m.maxTokens}</span>
              )}
              {(m as any).imagesPerDollar && (
                <span style={{ fontSize: 10, color: '#ff6b00', border: '1px solid #ff6b0055', padding: '2px 6px', borderRadius: 12 }}>~{(m as any).imagesPerDollar}/$</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Custom model id */}
      {allowCustomId && (
        <div>
          <div style={{ fontSize: 12, color: '#bbb', marginBottom: 4 }}>Or enter a custom model ID (Together/OpenAI-compatible):</div>
          <input
            type="text"
            className="ai-node-input"
            placeholder="e.g. meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
            value={value && !MODEL_CONFIGS[value] ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

