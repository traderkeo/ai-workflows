import React from 'react';

export interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  base64?: string;
  mediaType?: string;
  uint8Array?: Uint8Array;
  alt: string;
}

/**
 * Image component that displays AI-generated images from the AI SDK.
 * Accepts base64, mediaType, and uint8Array props from AI SDK's generateImage function.
 */
export const Image: React.FC<ImageProps> = ({
  base64,
  mediaType = 'image/png',
  uint8Array,
  alt,
  className = '',
  ...props
}) => {
  // Create data URL from base64 or uint8Array
  const src = React.useMemo(() => {
    if (base64) {
      // If base64 already includes the data URI prefix, use it as-is
      if (base64.startsWith('data:')) {
        return base64;
      }
      // Otherwise, construct the data URI
      return `data:${mediaType};base64,${base64}`;
    }

    if (uint8Array) {
      // Convert Uint8Array to base64
      const bytes = Array.from(uint8Array);
      const binary = String.fromCharCode(...bytes);
      const base64String = btoa(binary);
      return `data:${mediaType};base64,${base64String}`;
    }

    return '';
  }, [base64, uint8Array, mediaType]);

  if (!src) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`max-w-full h-auto ${className}`}
      {...props}
    />
  );
};
