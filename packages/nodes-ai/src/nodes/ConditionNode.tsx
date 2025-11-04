import React, { useMemo, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { GitBranch, Loader2, Play } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables, getAvailableVariablesWithInfo } from '../utils/variableResolver';
import { Button } from '../components/ui/Button';

export interface ConditionNodeData {
  label: string;
  name?: string;
  status?: 'idle' | 'running' | 'success' | 'error' | 'warning';
  // Input & variables
  input?: string; // Supports variable templates e.g. {{input}}, {{nodeName}}, {{nodeName.prop}}
  lastResolvedInput?: string; // Preview/debug
  // Condition settings
  conditionType: 'length' | 'contains' | 'regex' | 'numeric' | 'custom';
  // Length
  minLength?: number;
  maxLength?: number;
  // Contains
  containsText?: string;
  caseSensitive?: boolean;
  // Regex
  regexPattern?: string;
  regexFlags?: string; // e.g. i, m, g
  // Numeric compare
  numericOperator?: '>' | '>=' | '<' | '<=' | '==' | '!=';
  numericValue?: number;
  // Custom code
  conditionCode?: string; // JS returning boolean, arg: input
  // Results
  result?: boolean; // Mirrors conditionMet so downstream nodes can reference {{thisNode}}
  conditionMet?: boolean;
  executionTime?: number;
  error?: string;
}

export const ConditionNode: React.FC<NodeProps> = (props) => {
  const data = props.data as unknown as ConditionNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);

  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleChange = (field: keyof ConditionNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  // Available variables for quick reference
  const availableVariables = useMemo(() => getAvailableVariablesWithInfo(props.id, nodes as any, edges as any), [props.id, nodes, edges]);

  const evaluateCondition = (input: string): boolean => {
    const type = data.conditionType || 'length';

    if (type === 'length') {
      const min = data.minLength ?? 0;
      const max = data.maxLength ?? undefined;
      const len = input?.length ?? 0;
      return len >= min && (max === undefined || len <= max);
    }

    if (type === 'contains') {
      const needle = String(data.containsText ?? '');
      if (!needle) return false;
      if (data.caseSensitive) {
        return input.includes(needle);
      }
      return input.toLowerCase().includes(needle.toLowerCase());
    }

    if (type === 'regex') {
      if (!data.regexPattern) return false;
      try {
        const re = new RegExp(data.regexPattern, data.regexFlags);
        return re.test(input);
      } catch {
        throw new Error('Invalid regular expression');
      }
    }

    if (type === 'numeric') {
      const n = Number(input);
      if (Number.isNaN(n)) return false;
      const op = data.numericOperator || '>';
      const val = Number(data.numericValue ?? 0);
      switch (op) {
        case '>': return n > val;
        case '>=': return n >= val;
        case '<': return n < val;
        case '<=': return n <= val;
        case '==': return n == val; // eslint-disable-line eqeqeq
        case '!=': return n != val; // eslint-disable-line eqeqeq
        default: return false;
      }
    }

    if (type === 'custom') {
      const code = (data.conditionCode || 'return Boolean(input);').trim();
      try {
        // Execute user code in a very limited scope: function(input) { ... }
        // Must return a boolean
        // Note: This runs in the browser context; keep code small and synchronous
        // eslint-disable-next-line no-new-func
        const fn = new Function('input', code) as (input: any) => any;
        const out = fn(input);
        return Boolean(out);
      } catch (e: any) {
        throw new Error(e?.message || 'Custom condition error');
      }
    }

    return false;
  };

  const handleEvaluate = () => {
    const started = performance.now();
    setIsEvaluating(true);
    updateNode(props.id, { status: 'running', error: undefined });

    try {
      const inputTemplate = data.input ?? '{{input}}';
      const resolvedInput = resolveVariables(inputTemplate, props.id, nodes as any, edges as any);

      const ok = evaluateCondition(resolvedInput);

      const elapsed = Math.max(0, Math.round(performance.now() - started));
      updateNode(props.id, {
        conditionMet: ok,
        result: ok,
        lastResolvedInput: resolvedInput,
        status: 'success',
        executionTime: elapsed,
      });
    } catch (err: any) {
      updateNode(props.id, {
        status: 'error',
        error: err?.message || String(err),
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Footer matching AIAgentNode style
  const statusColors: Record<string, string> = {
    idle: '#4a4a5a',
    running: '#00f0ff',
    success: '#39ff14',
    error: '#ff0040',
    warning: '#ffff00',
  };
  const statusLabels: Record<string, string> = {
    idle: 'Idle',
    running: 'Running',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
  };
  const status = data.status || 'idle';
  const statusColor = statusColors[status];

  const customFooter = (data.executionTime !== undefined) && (
    <div className="ai-node-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', paddingBottom: '10px', fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            color: statusColor,
            borderColor: statusColor,
            boxShadow: `0 0 5px ${statusColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: 500,
            padding: '3px 8px',
            border: '1px solid',
            borderRadius: '4px',
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
          }}
        >
          {status === 'running' && <Loader2 size={10} className="animate-spin" />}
          {statusLabels[status]}
        </div>
        <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-muted, #888)', fontFamily: 'inherit', letterSpacing: '0.01em' }}>
          Execution Time: {data.executionTime}ms
        </span>
      </div>
      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--cyber-neon-purple)', fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)', letterSpacing: '0.02em' }}>
        Condition: {String(data.conditionMet ?? 'n/a').toUpperCase()}
      </div>
    </div>
  );

  return (
    <BaseAINode {...props} data={data} icon={<GitBranch size={20} />} footerContent={customFooter}>
      {/* Input (variable-enabled) */}
      <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
        <label className="ai-node-field-label">Input</label>
        <textarea
          className="ai-node-input ai-node-textarea"
          rows={3}
          value={data.input ?? '{{input}}'}
          onChange={(e) => handleChange('input', e.target.value)}
          placeholder="Use variables like {{input}}, {{nodeName}}, or {{nodeName.prop}}"
          style={{
            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
            fontSize: '13px',
          }}
        />
        {data.lastResolvedInput !== undefined && (
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #888)', marginTop: '4px' }}>
            Resolved: <span className="whitespace-pre-wrap break-words">{data.lastResolvedInput}</span>
          </div>
        )}
        {availableVariables.length > 0 && (
          <div style={{ fontSize: '10px', color: 'var(--cyber-neon-purple)', marginTop: '6px' }}>
            Variables: {availableVariables.slice(0, 5).map(v => v.variable).join('  ')}{availableVariables.length > 5 ? ' …' : ''}
          </div>
        )}
      </div>

      {/* Condition Type */}
      <div className="ai-node-field">
        <label className="ai-node-field-label">Condition Type</label>
        <select
          className="ai-node-select"
          value={data.conditionType || 'length'}
          onChange={(e) => handleChange('conditionType', e.target.value as ConditionNodeData['conditionType'])}
        >
          <option value="length">Text Length</option>
          <option value="contains">Contains Text</option>
          <option value="regex">Regex Match</option>
          <option value="numeric">Numeric Compare</option>
          <option value="custom">Custom JS</option>
        </select>
      </div>

      {/* Length options */}
      {data.conditionType === 'length' && (
        <div className="ai-node-field">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="ai-node-field-label">Min Length</label>
              <input
                type="number"
                className="ai-node-input"
                value={data.minLength ?? 0}
                onChange={(e) => handleChange('minLength', parseInt(e.target.value || '0', 10))}
                min="0"
              />
            </div>
            <div>
              <label className="ai-node-field-label">Max Length (optional)</label>
              <input
                type="number"
                className="ai-node-input"
                value={data.maxLength ?? ''}
                onChange={(e) => handleChange('maxLength', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                min="0"
              />
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
            TRUE when length ≥ min and ≤ max (if set)
          </div>
        </div>
      )}

      {/* Contains options */}
      {data.conditionType === 'contains' && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Search Text</label>
          <input
            type="text"
            className="ai-node-input"
            value={data.containsText ?? ''}
            onChange={(e) => handleChange('containsText', e.target.value)}
            placeholder="e.g., keyword"
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px' }}>
            <input type="checkbox" checked={Boolean(data.caseSensitive)} onChange={(e) => handleChange('caseSensitive', e.target.checked)} />
            Case sensitive
          </label>
        </div>
      )}

      {/* Regex options */}
      {data.conditionType === 'regex' && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Pattern</label>
          <input
            type="text"
            className="ai-node-input"
            value={data.regexPattern ?? ''}
            onChange={(e) => handleChange('regexPattern', e.target.value)}
            placeholder="e.g., ^hello|world$"
          />
          <label className="ai-node-field-label" style={{ marginTop: '8px' }}>Flags</label>
          <input
            type="text"
            className="ai-node-input"
            value={data.regexFlags ?? ''}
            onChange={(e) => handleChange('regexFlags', e.target.value)}
            placeholder="e.g., i, g, m"
          />
        </div>
      )}

      {/* Numeric options */}
      {data.conditionType === 'numeric' && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Compare</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">input</span>
            <select
              className="ai-node-select"
              value={data.numericOperator || '>'}
              onChange={(e) => handleChange('numericOperator', e.target.value as ConditionNodeData['numericOperator'])}
              style={{ width: '110px' }}
            >
              <option value=">">&gt;</option>
              <option value=">=">&gt;=</option>
              <option value="<">&lt;</option>
              <option value="<=">&lt;=</option>
              <option value="==">==</option>
              <option value="!=">!=</option>
            </select>
            <input
              type="number"
              className="ai-node-input"
              value={data.numericValue ?? 0}
              onChange={(e) => handleChange('numericValue', parseFloat(e.target.value || '0'))}
              style={{ width: '120px' }}
            />
          </div>
          <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
            Parses input as a number; non-numeric resolves to FALSE
          </div>
        </div>
      )}

      {/* Custom code */}
      {data.conditionType === 'custom' && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Condition Code</label>
          <textarea
            className="ai-node-input ai-node-textarea"
            value={data.conditionCode || 'return input.length > 100;'}
            onChange={(e) => handleChange('conditionCode', e.target.value)}
            placeholder="// Return true/false\nreturn input.length > 100;"
            rows={4}
            style={{
              fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
              fontSize: '13px',
            }}
          />
          <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
            Function body executed as <code>fn(input)</code>. Must return a boolean.
          </div>
        </div>
      )}

      {/* Live Result */}
      {data.conditionMet !== undefined && (
        <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
          <label className="ai-node-field-label" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>Condition Result</label>
          <div style={{
            padding: '8px',
            background: data.conditionMet
              ? 'rgba(57, 255, 20, 0.1)'
              : 'rgba(255, 0, 64, 0.1)',
            borderRadius: '4px',
            border: data.conditionMet
              ? '1px solid rgba(57, 255, 20, 0.3)'
              : '1px solid rgba(255, 0, 64, 0.3)',
            color: data.conditionMet ? '#39ff14' : '#ff0040',
            fontWeight: 600,
            letterSpacing: '0.01em',
            fontSize: '12px',
            fontFamily: 'inherit',
            textAlign: 'center',
          }}>
            {data.conditionMet ? '✓ TRUE' : '✗ FALSE'}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="ai-node-field flex items-center gap-2">
        <Button
          onClick={handleEvaluate}
          disabled={isEvaluating}
          variant="success"
          size="sm"
          className="flex-1 rounded-full"
        >
          <Play size={14} />
          {isEvaluating ? 'Evaluating...' : 'Evaluate'}
        </Button>
      </div>
    </BaseAINode>
  );
};
