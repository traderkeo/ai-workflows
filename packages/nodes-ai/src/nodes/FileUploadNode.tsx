import React, { useRef, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Upload } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';

export interface FileUploadNodeData {
  label: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  files?: Array<{
    name: string;
    size: number;
    type: string;
  }>;
}

const FileUploadNodeComponent: React.FC<NodeProps> = (props) => {
  const data = props.data as unknown as FileUploadNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localFiles, setLocalFiles] = useState<File[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input onChange triggered!');
    const files = event.target.files;

    if (files && files.length > 0) {
      console.log('Files selected:', files.length);
      const fileArray = Array.from(files);
      setLocalFiles(fileArray);

      const fileInfo = fileArray.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));

      updateNode(props.id, { files: fileInfo });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    console.log('Input clicked!');
    e.stopPropagation();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('Input mousedown!');
    e.stopPropagation();
  };

  return (
    <BaseAINode
      {...props}
      data={data}
      icon={<Upload size={20} />}
      hasInput={false}
      hasOutput={true}
    >
      <div className="ai-node-field nopan nodrag" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
        <label className="ai-node-field-label" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>
          File Upload Test
        </label>

        {/* Method 1: Direct input */}
        <div className="nopan nodrag" style={{ marginBottom: '12px' }}>
          <form>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,audio/*"
            onChange={handleFileChange}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            className="ai-node-input nopan nodrag"
            style={{
              fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
              fontSize: '13px',
              fontWeight: 400,
              letterSpacing: '0.01em',
              cursor: 'pointer',
            }}
          />
          </form>
        </div>

        {/* Method 2: Button trigger */}
        <div className="nopan nodrag">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Button clicked, triggering file input');
              fileInputRef.current?.click();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="nopan nodrag"
            style={{
              padding: '8px 12px',
              background: 'rgba(176, 38, 255, 0.3)',
              border: '1px solid rgba(176, 38, 255, 0.5)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Upload size={14} style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
            Browse Files
          </button>
        </div>

        {/* Display selected files */}
        {localFiles.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', marginBottom: '8px' }}>
              Selected Files ({localFiles.length}):
            </div>
            {localFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  padding: '6px 8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '4px',
                  border: '1px solid rgba(176, 38, 255, 0.2)',
                  fontSize: '11px',
                  marginBottom: '4px',
                }}
              >
                <div style={{ fontWeight: 500, color: '#fff' }}>{file.name}</div>
                <div style={{ color: '#888', fontSize: '10px' }}>
                  {(file.size / 1024).toFixed(2)} KB " {file.type || 'unknown'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Debug info */}
        <div style={{ marginTop: '12px', fontSize: '10px', color: '#666', fontFamily: 'monospace' }}>
          Debug: {localFiles.length} file(s) selected
        </div>
      </div>
    </BaseAINode>
  );
};

export const FileUploadNode = React.memo(FileUploadNodeComponent);
FileUploadNode.displayName = 'FileUploadNode';
