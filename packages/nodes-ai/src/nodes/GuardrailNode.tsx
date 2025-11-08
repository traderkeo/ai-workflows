import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { ShieldCheck, Play } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables } from '../utils/variableResolver';
import type { GuardrailNodeData } from '../types';
import { Button } from '../components/ui/Button';

const TOXIC_WORDS = ['hate', 'kill', 'violence'];

const GuardrailNodeComponent: React.FC<NodeProps> = (props) => {
  const data = props.data as GuardrailNodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const [isRunning, setIsRunning] = useState(false);

  const handleChange = (field: keyof GuardrailNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const run = () => {
    const start = performance.now();
    setIsRunning(true);
    updateNode(props.id, { status: 'running' });
    try {
      const tpl = data.input ?? '{{input}}';
      const text = resolveVariables(tpl, props.id, nodes as any, edges as any);

      const checks = data.checks || {};
      const violations: Array<{ type: string; detail: string }> = [];

      if (checks.blocklist) {
        const words = (data.blocklistWords || '').split(',').map((w) => w.trim()).filter(Boolean);
        for (const w of words) {
          if (w && text.toLowerCase().includes(w.toLowerCase())) {
            violations.push({ type: 'blocklist', detail: w });
          }
        }
      }

      if (checks.regex) {
        const lines = (data.regexPatterns || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        for (const pattern of lines) {
          try {
            const re = new RegExp(pattern, 'i');
            if (re.test(text)) {
              violations.push({ type: 'regex', detail: pattern });
            }
          } catch {
            // ignore invalid
          }
        }
      }

      if (checks.pii) {
        // very naive PII regexes (emails, phone-like)
        const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
        const phoneRe = /(\+?\d[\d\s\-()]{7,}\d)/;
        if (emailRe.test(text)) violations.push({ type: 'pii', detail: 'email' });
        if (phoneRe.test(text)) violations.push({ type: 'pii', detail: 'phone' });
      }

      if (checks.toxicity) {
        const lower = text.toLowerCase();
        for (const w of TOXIC_WORDS) {
          if (lower.includes(w)) {
            violations.push({ type: 'toxicity', detail: w });
          }
        }
      }

      const passed = violations.length === 0;
      updateNode(props.id, {
        status: 'success',
        result: { passed, violations },
        executionTime: Math.round(performance.now() - start),
      });
    } catch (e: any) {
      updateNode(props.id, { status: 'error', error: e?.message || String(e) });
    } finally {
      setIsRunning(false);
    }
  };

  const checks = data.checks || {};

  return (
    <BaseAINode {...props} data={data} icon={<ShieldCheck size={18} />}> 
      <div className="ai-node-field">
        <label className="ai-node-field-label">Input</label>
        <textarea
          className="ai-node-input ai-node-textarea"
          rows={3}
          value={data.input ?? '{{input}}'}
          onChange={(e) => handleChange('input', e.target.value)}
          placeholder="Text to validate (supports variables)"
        />
      </div>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Checks</label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!checks.blocklist} onChange={(e) => handleChange('checks', { ...checks, blocklist: e.target.checked })} /> Blocklist
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!checks.regex} onChange={(e) => handleChange('checks', { ...checks, regex: e.target.checked })} /> Regex
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!checks.pii} onChange={(e) => handleChange('checks', { ...checks, pii: e.target.checked })} /> PII
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!checks.toxicity} onChange={(e) => handleChange('checks', { ...checks, toxicity: e.target.checked })} /> Toxicity
          </label>
        </div>
      </div>

      {checks.blocklist && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Blocklist Words (comma-separated)</label>
          <input
            type="text"
            className="ai-node-input"
            value={data.blocklistWords ?? ''}
            onChange={(e) => handleChange('blocklistWords', e.target.value)}
          />
        </div>
      )}
      {checks.regex && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Regex Patterns (one per line)</label>
          <textarea
            className="ai-node-input ai-node-textarea"
            rows={3}
            value={data.regexPatterns ?? ''}
            onChange={(e) => handleChange('regexPatterns', e.target.value)}
          />
        </div>
      )}

      {data.result && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Result</label>
          <div className="ai-node-field-value" style={{ maxHeight: 140, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            <div className="text-xs mb-1">Passed: {String(data.result.passed)}</div>
            {data.result.violations.length > 0 && (
              <ul className="text-xs list-disc pl-4">
                {data.result.violations.map((v, i) => (
                  <li key={i}>{v.type}: {v.detail}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="ai-node-field">
        <Button onClick={run} disabled={isRunning} variant="default" size="sm" className="w-full rounded-full">
          <Play size={14} /> {isRunning ? 'Running…' : 'Run'}
        </Button>
      </div>
    </BaseAINode>
  );
};

export const GuardrailNode = React.memo(GuardrailNodeComponent);
GuardrailNode.displayName = 'GuardrailNode';
