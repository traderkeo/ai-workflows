'use client';

import { WorkflowBuilder } from '@repo/nodes-ai';
import '@repo/nodes-ai/styles';

export default function WorkflowBuilderPage() {
  return (
    <div className="w-screen h-screen bg-black">
      <WorkflowBuilder />
    </div>
  );
}
