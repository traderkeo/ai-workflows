'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, Copy, Printer, FileJson } from 'lucide-react';
import type { WorkflowExportData } from './utils/workflowExport';
import { downloadWorkflowJSON, copyWorkflowToClipboard, printWorkflowJSON } from './utils/workflowExport';

interface ExportMenuProps {
  workflowData: WorkflowExportData;
}

export function ExportMenu({ workflowData }: ExportMenuProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyWorkflowToClipboard(workflowData);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadWorkflowJSON(workflowData, `workflow-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handlePrint = () => {
    printWorkflowJSON(workflowData);
  };

  const handleConsole = () => {
    console.log('Workflow Export:', workflowData);
    console.log('Workflow JSON:', JSON.stringify(workflowData, null, 2));
    alert('Workflow JSON has been logged to the console. Open DevTools to view.');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          //@ts-ignore
          size="sm"
          variant="outline"
        >
          <FileJson className="mr-2 h-4 w-4" />
          Export Workflow
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleConsole}>
          <FileJson className="mr-2 h-4 w-4" />
          Log to Console
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
