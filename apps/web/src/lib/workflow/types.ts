export type WorkflowNodeType = 'trigger' | 'action' | 'logic' | 'transform';

export interface WorkflowNodeData {
  nodeType: WorkflowNodeType;
  label: string;
  description: string;
  icon: string;
  config: Record<string, any>;
  handles: {
    target: boolean;
    source: boolean;
  };
}

export interface NodeTemplate {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: string;
  category: string;
  defaultConfig: Record<string, any>;
  configSchema?: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'boolean' | 'code';
  placeholder?: string;
  options?: { label: string; value: string }[];
  default?: any;
  required?: boolean;
}

export const NODE_TEMPLATES: NodeTemplate[] = [
  // Triggers
  {
    type: 'trigger',
    label: 'Webhook',
    description: 'Trigger workflow from HTTP request',
    icon: '🔔',
    category: 'Triggers',
    defaultConfig: { method: 'POST', path: '/webhook' },
    configSchema: [
      { key: 'method', label: 'HTTP Method', type: 'select', options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
      ]},
      { key: 'path', label: 'Path', type: 'text', placeholder: '/webhook' },
    ],
  },
  {
    type: 'trigger',
    label: 'Schedule',
    description: 'Trigger on a schedule',
    icon: '⏰',
    category: 'Triggers',
    defaultConfig: { cron: '0 * * * *' },
    configSchema: [
      { key: 'cron', label: 'Cron Expression', type: 'text', placeholder: '0 * * * *' },
    ],
  },
  {
    type: 'trigger',
    label: 'Manual',
    description: 'Manually trigger workflow',
    icon: '▶️',
    category: 'Triggers',
    defaultConfig: {},
  },

  // Actions
  {
    type: 'action',
    label: 'HTTP Request',
    description: 'Make an HTTP request',
    icon: '🌐',
    category: 'Actions',
    defaultConfig: { method: 'GET', url: '' },
    configSchema: [
      { key: 'method', label: 'Method', type: 'select', options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
      ]},
      { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com' },
      { key: 'headers', label: 'Headers', type: 'code', placeholder: '{"Content-Type": "application/json"}' },
      { key: 'body', label: 'Body', type: 'code', placeholder: '{"key": "value"}' },
    ],
  },
  {
    type: 'action',
    label: 'AI Generate',
    description: 'Generate content with AI',
    icon: '🤖',
    category: 'Actions',
    defaultConfig: { model: 'gpt-4', prompt: '' },
    configSchema: [
      { key: 'model', label: 'Model', type: 'select', options: [
        { label: 'GPT-4', value: 'gpt-4' },
        { label: 'GPT-3.5', value: 'gpt-3.5-turbo' },
        { label: 'Claude', value: 'claude-3-opus' },
      ]},
      { key: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'Enter your prompt...' },
      { key: 'temperature', label: 'Temperature', type: 'number', default: 0.7 },
    ],
  },
  {
    type: 'action',
    label: 'Email',
    description: 'Send an email',
    icon: '📧',
    category: 'Actions',
    defaultConfig: { to: '', subject: '', body: '' },
    configSchema: [
      { key: 'to', label: 'To', type: 'text', placeholder: 'user@example.com' },
      { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject' },
      { key: 'body', label: 'Body', type: 'textarea', placeholder: 'Email body...' },
    ],
  },
  {
    type: 'action',
    label: 'Database Query',
    description: 'Execute a database query',
    icon: '🗄️',
    category: 'Actions',
    defaultConfig: { query: '', database: 'postgres' },
    configSchema: [
      { key: 'database', label: 'Database', type: 'select', options: [
        { label: 'PostgreSQL', value: 'postgres' },
        { label: 'MySQL', value: 'mysql' },
        { label: 'MongoDB', value: 'mongodb' },
      ]},
      { key: 'query', label: 'Query', type: 'code', placeholder: 'SELECT * FROM users' },
    ],
  },

  // Logic
  {
    type: 'logic',
    label: 'Condition',
    description: 'Branch based on condition',
    icon: '🔀',
    category: 'Logic',
    defaultConfig: { condition: '', operator: '===' },
    configSchema: [
      { key: 'condition', label: 'Condition', type: 'code', placeholder: 'data.value > 10' },
      { key: 'operator', label: 'Operator', type: 'select', options: [
        { label: 'Equals', value: '===' },
        { label: 'Not Equals', value: '!==' },
        { label: 'Greater Than', value: '>' },
        { label: 'Less Than', value: '<' },
      ]},
    ],
  },
  {
    type: 'logic',
    label: 'Switch',
    description: 'Route to multiple paths',
    icon: '🎛️',
    category: 'Logic',
    defaultConfig: { cases: [] },
    configSchema: [
      { key: 'expression', label: 'Expression', type: 'code', placeholder: 'data.type' },
    ],
  },
  {
    type: 'logic',
    label: 'Delay',
    description: 'Wait for a period of time',
    icon: '⏱️',
    category: 'Logic',
    defaultConfig: { duration: 1000, unit: 'ms' },
    configSchema: [
      { key: 'duration', label: 'Duration', type: 'number', default: 1 },
      { key: 'unit', label: 'Unit', type: 'select', options: [
        { label: 'Milliseconds', value: 'ms' },
        { label: 'Seconds', value: 's' },
        { label: 'Minutes', value: 'm' },
      ]},
    ],
  },

  // Transform
  {
    type: 'transform',
    label: 'Map Data',
    description: 'Transform data structure',
    icon: '🔄',
    category: 'Transform',
    defaultConfig: { mapping: '{}' },
    configSchema: [
      { key: 'mapping', label: 'Mapping', type: 'code', placeholder: '{ "newKey": data.oldKey }' },
    ],
  },
  {
    type: 'transform',
    label: 'Filter',
    description: 'Filter array items',
    icon: '🔍',
    category: 'Transform',
    defaultConfig: { condition: '' },
    configSchema: [
      { key: 'condition', label: 'Filter Condition', type: 'code', placeholder: 'item.value > 10' },
    ],
  },
  {
    type: 'transform',
    label: 'Aggregate',
    description: 'Aggregate data',
    icon: '📊',
    category: 'Transform',
    defaultConfig: { operation: 'sum' },
    configSchema: [
      { key: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Sum', value: 'sum' },
        { label: 'Average', value: 'avg' },
        { label: 'Count', value: 'count' },
        { label: 'Min', value: 'min' },
        { label: 'Max', value: 'max' },
      ]},
      { key: 'field', label: 'Field', type: 'text', placeholder: 'value' },
    ],
  },
];
