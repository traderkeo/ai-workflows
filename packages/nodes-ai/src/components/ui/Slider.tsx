import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={`ai-slider-root ${className || ''}`}
    {...props}
  >
    <SliderPrimitive.Track className="ai-slider-track">
      <SliderPrimitive.Range className="ai-slider-range" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="ai-slider-thumb" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
