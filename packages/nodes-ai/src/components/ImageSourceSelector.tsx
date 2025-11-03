import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Label } from './ui/Label';
import { Image } from './ui/ai-elements/Image';
import type { VariableInfo } from '../utils/variableResolver';

interface ImageSourceSelectorProps {
  value?: string; // Either base64 data URI or variable reference like "{{ai-agent-3.image}}"
  onUpdate: (value: string) => void;
  availableImages: VariableInfo[]; // Image variables from upstream nodes
  label?: string;
  helperText?: string;
  required?: boolean;
}

export const ImageSourceSelector: React.FC<ImageSourceSelectorProps> = ({
  value = '',
  onUpdate,
  availableImages,
  label = 'Source Image',
  helperText = 'Upload an image or select from generated images',
  required = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceType, setSourceType] = useState<'upload' | 'variable'>(
    value?.startsWith('{{') ? 'variable' : 'upload'
  );

  // Helper to parse data URI into base64 and mediaType for Image component
  const parseDataURI = (dataURI: string) => {
    if (!dataURI.startsWith('data:')) {
      return { base64: dataURI, mediaType: 'image/png' };
    }
    const match = dataURI.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { base64: match[2], mediaType: match[1] };
    }
    return { base64: dataURI, mediaType: 'image/png' };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onUpdate(base64);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSourceTypeChange = (type: 'upload' | 'variable') => {
    setSourceType(type);
    if (type === 'variable' && availableImages.length > 0) {
      // Auto-select first available image variable
      onUpdate(availableImages[0].variable);
    } else {
      onUpdate('');
    }
  };

  const handleVariableChange = (variableName: string) => {
    onUpdate(variableName);
  };

  const isVariableValue = value?.startsWith('{{');
  const hasUploadedImage = value && !isVariableValue;

  return (
    <div className="nopan nodrag" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Label style={{
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '0.01em',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        {label}
        {required && <span style={{ color: '#ef4444' }}>*</span>}
      </Label>

      {/* Source Type Selector */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => handleSourceTypeChange('upload')}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: sourceType === 'upload' ? 'rgba(176, 38, 255, 0.25)' : 'rgba(0, 0, 0, 0.3)',
            border: `1px solid ${sourceType === 'upload' ? 'rgba(176, 38, 255, 0.6)' : 'rgba(176, 38, 255, 0.2)'}`,
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <Upload size={14} />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => handleSourceTypeChange('variable')}
          disabled={availableImages.length === 0}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: sourceType === 'variable' ? 'rgba(176, 38, 255, 0.25)' : 'rgba(0, 0, 0, 0.3)',
            border: `1px solid ${sourceType === 'variable' ? 'rgba(176, 38, 255, 0.6)' : 'rgba(176, 38, 255, 0.2)'}`,
            borderRadius: '6px',
            color: availableImages.length === 0 ? '#666' : '#fff',
            cursor: availableImages.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            opacity: availableImages.length === 0 ? 0.5 : 1,
          }}
        >
          <ImageIcon size={14} />
          Use Generated ({availableImages.length})
        </button>
      </div>

      {/* Upload Mode */}
      {sourceType === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px dashed rgba(176, 38, 255, 0.4)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.6)';
              e.currentTarget.style.background = 'rgba(176, 38, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.4)';
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
            }}
          >
            <Upload size={16} />
            {hasUploadedImage ? 'Change Image' : 'Click to Upload Image'}
          </button>

          {/* Preview uploaded image */}
          {hasUploadedImage && (() => {
            const { base64, mediaType } = parseDataURI(value);
            return (
              <div style={{ marginTop: '12px' }}>
                <Image
                  base64={base64}
                  mediaType={mediaType}
                  alt="Uploaded preview"
                  className="w-full max-h-[200px] object-contain rounded-lg border border-purple-500/30"
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* Variable Mode */}
      {sourceType === 'variable' && (
        <div>
          <Select
            value={value}
            onValueChange={handleVariableChange}
          >
            <SelectTrigger style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 400 }}>
              <SelectValue placeholder="Select an image variable..." />
            </SelectTrigger>
            <SelectContent>
              {availableImages.map((imgVar) => (
                <SelectItem key={imgVar.variable} value={imgVar.variable} style={{ fontFamily: 'inherit', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🖼️</span>
                    <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', color: '#00f0ff' }}>
                      {imgVar.variable}
                    </span>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      from {imgVar.nodeLabel}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Preview variable image if available */}
          {isVariableValue && (() => {
            const selectedVar = availableImages.find(v => v.variable === value);
            const imageValue = selectedVar?.value;

            // Only show preview if the image has been generated (has a value)
            if (!imageValue) {
              return (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'rgba(255, 165, 0, 0.1)',
                  border: '1px solid rgba(255, 165, 0, 0.3)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#ffa500',
                }}>
                  ℹ️ Preview will be available after the source node generates an image
                </div>
              );
            }

            // Extract actual image data if it's an object with image property
            const imageSrc = typeof imageValue === 'object' && imageValue.image
              ? imageValue.image
              : String(imageValue);

            const { base64, mediaType } = parseDataURI(imageSrc);

            return (
              <div style={{ marginTop: '12px' }}>
                <Image
                  base64={base64}
                  mediaType={mediaType}
                  alt="Variable preview"
                  className="w-full max-h-[200px] object-contain rounded-lg border border-purple-500/30"
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* Helper Text */}
      {helperText && (
        <p style={{
          fontSize: '12px',
          fontWeight: 400,
          color: 'var(--text-muted, #888)',
          fontFamily: 'inherit',
          letterSpacing: '0.01em',
          margin: 0,
        }}>
          {helperText}
        </p>
      )}
    </div>
  );
};
