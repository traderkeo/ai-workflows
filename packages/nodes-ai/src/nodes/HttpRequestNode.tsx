import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Globe, Settings, Code, FileText } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import type { HttpRequestNodeData } from '../types';
import { useFlowStore } from '../hooks/useFlowStore';
import { Input } from '../components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CollapsibleSection } from '../components/ui/CollapsibleSection';

const HttpRequestNodeComponent: React.FC<NodeProps> = (props) => {
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
      {/* Request Section */}
      <CollapsibleSection title="Request" icon={<Globe size={14} />} defaultOpen={true}>
        <div className="ai-node-field">
          <span className="ai-node-field-label">Method</span>
          <Select value={method} onValueChange={(v) => { const m = v as HttpRequestNodeData['method']; setMethod(m); updateNode(props.id, { method: m }); }}>
            <SelectTrigger className="w-full"><SelectValue placeholder="HTTP method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ai-node-field">
          <span className="ai-node-field-label">URL</span>
          <Input
            placeholder="https://api.example.com/endpoint or {{input}}"
            value={url}
            onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
            onBlur={handleUpdate}
          />
        </div>
      </CollapsibleSection>

      {/* Headers Section */}
      <CollapsibleSection title="Headers" icon={<Settings size={14} />} defaultOpen={false}>
        <div className="ai-node-field">
          <span className="ai-node-field-label">Headers (JSON)</span>
          <textarea
            className="ai-node-input nodrag"
            placeholder={'{\n  "Content-Type": "application/json"\n}'}
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            onBlur={handleUpdate}
            rows={3}
            style={{ fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)', fontSize: '13px', fontWeight: 400, letterSpacing: '0.01em' }}
          />
        </div>
      </CollapsibleSection>

      {/* Body Section - Only for POST, PUT, PATCH */}
      {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
        <CollapsibleSection title="Body" icon={<Code size={14} />} defaultOpen={false}>
          <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
            <span className="ai-node-field-label" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>Body</span>
            <textarea
              className="ai-node-input nodrag"
              placeholder="Request body (supports {{input}} and {{nodeId}})"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={handleUpdate}
              rows={4}
              style={{ fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)', fontSize: '13px', fontWeight: 400, letterSpacing: '0.01em' }}
            />
          </div>
        </CollapsibleSection>
      )}

      {/* Response Section */}
      {nodeData.result && (
        <CollapsibleSection title="Response" icon={<FileText size={14} />} defaultOpen={true}>
          <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
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
        </CollapsibleSection>
      )}
      {typeof (props.data as any).executionTime === 'number' && (
        <div className="ai-node-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={((props.data as any).status || 'idle') as any} />
            <span style={{ fontSize: 10, color: '#888' }}>Execution Time: {(props.data as any).executionTime}ms</span>
          </div>
        </div>
      )}
    </BaseAINode>
  );
};

export const HttpRequestNode = React.memo(HttpRequestNodeComponent);
HttpRequestNode.displayName = 'HttpRequestNode';
