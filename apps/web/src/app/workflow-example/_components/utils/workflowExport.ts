/**
 * Utility functions for exporting workflows
 */

export interface WorkflowExportData {
  version: string;
  exportedAt: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    type?: string;
  }>;
}

/**
 * Downloads workflow as JSON file
 */
export function downloadWorkflowJSON(data: WorkflowExportData, filename = 'workflow.json') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies workflow JSON to clipboard
 */
export async function copyWorkflowToClipboard(data: WorkflowExportData): Promise<boolean> {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(jsonString);
    return true;
  } catch (error) {
    console.error('Failed to copy workflow to clipboard:', error);
    return false;
  }
}

/**
 * Prints workflow JSON in a formatted way
 */
export function printWorkflowJSON(data: WorkflowExportData) {
  const jsonString = JSON.stringify(data, null, 2);
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Workflow Export</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            background: #1a1a1a;
            color: #e0e0e0;
          }
          pre {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid #444;
          }
          .header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #444;
          }
          .header h1 {
            margin: 0;
            color: #fff;
          }
          .meta {
            color: #888;
            font-size: 14px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Workflow Export</h1>
          <div class="meta">
            Exported: ${new Date(data.exportedAt).toLocaleString()}<br>
            Nodes: ${data.nodes.length} | Edges: ${data.edges.length}
          </div>
        </div>
        <pre>${jsonString}</pre>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
