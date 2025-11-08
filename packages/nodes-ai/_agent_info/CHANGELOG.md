# @repo/nodes-ai Changelog

## [Unreleased]

### Added

#### Enhanced AI Agent Node Settings
- **Model-First Configuration**: Moved model selection above mode selection for better UX
- **Model Capabilities Display**: Shows visual badges for each model's capabilities including:
  - Text Generation
  - Structured Output
  - Vision (Image Input)
  - Audio Input/Output
  - Image Generation
  - Tool Calling
  - Advanced Reasoning
  - JSON Mode

#### Expanded OpenAI Model Support
Added all available OpenAI models organized by category:
- **GPT-5 Series**: gpt-5-pro, gpt-5, gpt-5-mini
- **GPT-4.1 Series**: gpt-4.1, gpt-4.1-mini
- **GPT-4o Series**: gpt-4o, gpt-4o-mini, gpt-4o-audio-preview, gpt-4-turbo
- **Reasoning Models**: o3, o3-mini, o1
- **Specialized Models**:
  - Image Generation: dall-e-3, dall-e-2
  - Text-to-Speech: tts-1, tts-1-hd

#### New Generation Modes
- **Image Generation Mode**:
  - Image size selection (Square, Landscape, Portrait)
  - Quality settings (Standard, HD)
  - Style settings (Natural, Vivid)
  - Works with DALL-E models

- **Speech Generation Mode**:
  - Voice selection (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
  - Speech speed control (0.25x to 4.0x)
  - Works with TTS models

- **Audio Mode**: For audio input/output capabilities

#### Smart Mode Validation
- Modes are automatically disabled if the selected model doesn't support them
- Auto-switches to supported mode when model is changed
- Visual feedback through disabled state in mode selector

#### Model Capabilities System
New `modelCapabilities.ts` configuration file that:
- Centralizes model capability definitions
- Provides helper functions for capability checking
- Supports future model additions easily
- Includes visual indicators for each capability type

### Changed
- Reorganized Configuration tab: Model → Mode → Prompt → Mode-specific settings
- Instructions field now only shown for text and structured modes
- Mode dropdown renamed to "Generation Mode" for clarity
- Enhanced type definitions to support new modes and settings
- **Standardized Styling Across All Nodes**: Applied consistent Geist font system, letter-spacing, and color schemes

#### Node Styling Updates
Updated the following nodes to match AIAgentNode styling standards:

**High Priority Nodes:**
- **TextGenerationNode**: Updated button colors to success green, added Geist Sans font family, font-weight 600, letter-spacing 0.02em
- **StructuredDataNode**: Updated Test/Delete buttons with proper styling, enhanced Add Field button with letter-spacing

**Medium Priority Nodes:**
- **ConditionNode**: Updated result badge with Geist Sans, changed `fontWeight: 'bold'` to `600`, added letter-spacing 0.01em

**Low Priority Nodes (Additional Enhancements):**
- **StopNode**: Updated token display with Geist Mono, added letter-spacing to all text elements, improved font weights
- **OutputNode**: Added Geist Mono to output display, updated label styling with proper weights and spacing
- **LoopNode**: Updated array source and condition fields with Geist fonts, added letter-spacing throughout
- **TransformNode**: Changed font references to Geist Mono, added letter-spacing, updated result display
- **MergeNode**: Updated strategy explanation and result display with Geist fonts and letter-spacing
- **HttpRequestNode**: Updated headers, body, and response display with Geist Mono, added proper letter-spacing

**Complete Node Coverage:**
All 10 interactive workflow nodes now follow consistent styling standards with proper typography, spacing, and visual hierarchy.

**Styling Standards Applied:**
- Font Family: `var(--font-geist-sans)` for UI elements, `var(--font-geist-mono)` for code
- Font Weights: 400 (body), 500 (labels), 600 (buttons/emphasis)
- Letter Spacing: 0.01em (standard), 0.02em (button text), 0.05em (uppercase mode badges)
- Button Colors: Green (`rgba(34, 197, 94, *)`) for success/test, Red (`rgba(239, 68, 68, *)`) for delete, Purple (`rgba(176, 38, 255, *)`) for neutral
- Transitions: Added smooth 0.2s ease transitions to all interactive elements

### Technical Details
- Created `src/config/modelCapabilities.ts` with comprehensive model configs
- Updated `AIAgentNodeData` interface with new fields:
  - `mode`: Extended to include 'image', 'audio', 'speech'
  - `imageSize`, `imageQuality`, `imageStyle` for image generation
  - `voice`, `speechSpeed` for speech synthesis
  - `audioTranscription` for audio processing
  - `attachments` array for file attachments (upcoming feature)

### Developer Experience
- Full TypeScript type safety for all new features
- Reusable capability checking functions
- Easy to extend with new models and capabilities
- Clear separation of concerns between configuration and UI

## Migration Guide

### For Existing Workflows
- Existing nodes will continue to work with default mode 'text'
- No breaking changes to existing configurations
- New models can be selected without migrating data

### For Developers
- Import model capabilities from `@repo/nodes-ai/config/modelCapabilities`
- Use `modelSupportsMode()` and `modelSupportsCapability()` helpers
- Reference capability info with `getCapabilityInfo()` for consistent UI
