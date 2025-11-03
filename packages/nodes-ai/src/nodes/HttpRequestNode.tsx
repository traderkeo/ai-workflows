import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import type { HttpRequestNodeData } from '../types';
import { useFlowStore } from '../hooks/useFlowStore';

export const HttpRequestNode: React.FC<NodeProps> = (props) => {
  const { data } = props;
  const nodeData = data as HttpRequestNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);

  const [url, setUrl] = useState(nodeData.url || '');
  const [method, setMethod] = useState<HttpRequestNodeData['method']>(nodeData.method || 'GET');
  const [headers, setHeaders] = useState(JSON.stringify(nodeData.headers || {}, null, 2));
  const [body, setBody] = useState(nodeData.body || '');

  const handleUpdate = () => {
    try {
      const parsedHeaders = headers.trim() ? JSON.parse(headers) : {};
      updateNode(props.id, {
        url,
        method,
        headers: parsedHeaders,
        body: body.trim() || undefined,
      });
    } catch (error) {
      console.error('Invalid JSON headers:', error);
    }
  };

  return (
    <BaseAINode {...props} data={nodeData} icon={<Globe size={16} />}>
      <div className="ai-node-field">
        <span className="ai-node-field-label">Method</span>
        <select
          className="ai-node-input"
          value={method}
          onChange={(e) => {
            const newMethod = e.target.value as HttpRequestNodeData['method'];
            setMethod(newMethod);
            updateNode(props.id, { method: newMethod });
          }}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      <div className="ai-node-field">
        <span className="ai-node-field-label">URL</span>
        <input
          type="text"
          className="ai-node-input"
          placeholder="https://api.example.com/endpoint or {{input}}"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleUpdate}
        />
      </div>

      <div className="ai-node-field">
        <span className="ai-node-field-label">Headers (JSON)</span>
        <textarea
          className="ai-node-input"
          placeholder={'{\n  "Content-Type": "application/json"\n}'}
          value={headers}
          onChange={(e) => setHeaders(e.target.value)}
          onBlur={handleUpdate}
          rows={3}
          style={{ fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)', fontSize: '13px', fontWeight: 400, letterSpacing: '0.01em' }}
        />
      </div>

      {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
        <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
          <span className="ai-node-field-label" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>Body</span>
          <textarea
            className="ai-node-input"
            placeholder="Request body (supports {{input}} and {{nodeId}})"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={handleUpdate}
            rows={4}
            style={{ fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)', fontSize: '13px', fontWeight: 400, letterSpacing: '0.01em' }}
          />
        </div>
      )}

      {nodeData.result && (
        <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
          <span className="ai-node-field-label" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>Response</span>
          <div className="ai-node-field-value">
            <div style={{ marginBottom: '4px', color: 'var(--cyber-neon-purple)', fontSize: '11px', fontWeight: 400, letterSpacing: '0.01em' }}>
              Status: {nodeData.result.status}
            </div>
            <pre
              style={{
                fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
                fontSize: '13px',
                fontWeight: 400,
                letterSpacing: '0.01em',
                maxHeight: '150px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(nodeData.result.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </BaseAINode>
  );
};
