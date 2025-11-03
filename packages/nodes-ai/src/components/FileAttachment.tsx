import React, { useRef } from 'react';
import { X, FileImage, FileText, Mic } from 'lucide-react';
import type { AIAgentNodeData } from '../types';
import { Input } from './ui/Input';

interface FileAttachmentProps {
  attachments: AIAgentNodeData['attachments'];
  onUpdate: (attachments: AIAgentNodeData['attachments']) => void;
  acceptedTypes?: 'image' | 'pdf' | 'audio' | 'all';
  maxFiles?: number;
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  attachments = [],
  onUpdate,
  acceptedTypes = 'all',
  maxFiles = 5,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptString = () => {
    switch (acceptedTypes) {
      case 'image':
        return 'image/*';
      case 'pdf':
        return 'application/pdf';
      case 'audio':
        return 'audio/*';
      default:
        return 'image/*,application/pdf,audio/*';
    }
  };

  const getFileType = (file: File): 'image' | 'pdf' | 'audio' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'image'; // default
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentAttachments = attachments || [];
    const currentCount = currentAttachments.length;
    if (currentCount >= maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const remainingSlots = maxFiles - currentCount;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    // Convert all files to base64 data URLs using Promise.all
    const filePromises = filesToProcess.map((file) => {
      return new Promise<{ type: 'image' | 'pdf' | 'audio'; url: string; name: string }>((resolve, reject) => {
        const type = getFileType(file);
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const url = e.target?.result as string;
          resolve({
            type,
            url,
            name: file.name,
          });
        };
        
        reader.onerror = () => {
          reject(new Error(`Failed to read file: ${file.name}`));
        };
        
        reader.readAsDataURL(file);
      });
    });

    try {
      const newAttachments = await Promise.all(filePromises);
      // Combine with existing attachments and update once
      onUpdate([...currentAttachments, ...newAttachments]);
    } catch (error) {
      console.error('Error reading files:', error);
      alert('Failed to read one or more files. Please try again.');
    }

    // Reset input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const currentAttachments = attachments || [];
    const newAttachments = currentAttachments.filter((_, i) => i !== index);
    onUpdate(newAttachments);
  };

  const getFileIcon = (type: 'image' | 'pdf' | 'audio') => {
    switch (type) {
      case 'image':
        return <FileImage size={16} />;
      case 'pdf':
        return <FileText size={16} />;
      case 'audio':
        return <Mic size={16} />;
    }
  };

  const currentAttachments = attachments || [];

  return (
    <div className="nopan nodrag" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* File Input */}
      <div className="nopan nodrag">
        <Input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          accept={getAcceptString()}
          multiple
          onChange={handleFileSelect}
          disabled={currentAttachments.length >= maxFiles}
        />
      </div>

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {attachments.map((attachment, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                border: '1px solid rgba(176, 38, 255, 0.2)',
              }}
            >
              {/* File Icon */}
              <div
                style={{
                  flexShrink: 0,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(176, 38, 255, 0.2)',
                  borderRadius: '4px',
                  color: '#b026ff',
                }}
              >
                {getFileIcon(attachment.type)}
              </div>

              {/* File Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#fff',
                    fontFamily: 'inherit',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {attachment.name || 'Unnamed file'}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 400,
                    color: 'var(--text-muted, #888)',
                    fontFamily: 'inherit',
                    textTransform: 'uppercase',
                  }}
                >
                  {attachment.type}
                </div>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemoveAttachment(index)}
                style={{
                  flexShrink: 0,
                  padding: '6px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      <p
        style={{
          fontSize: '11px',
          fontWeight: 400,
          color: 'var(--text-muted, #888)',
          fontFamily: 'inherit',
          letterSpacing: '0.01em',
          margin: 0,
        }}
      >
        {acceptedTypes === 'image'
          ? 'Images (PNG, JPG, GIF, etc.)'
          : acceptedTypes === 'pdf'
          ? 'PDF documents'
          : acceptedTypes === 'audio'
          ? 'Audio files (MP3, WAV, etc.)'
          : 'Images, PDFs, or audio files'}
        {' • '}
        Max {maxFiles} files
        {currentAttachments.length > 0 && ` • ${currentAttachments.length} uploaded`}
      </p>
    </div>
  );
};
