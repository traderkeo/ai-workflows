# AI Agent Node - UX Redesign Plan

## Current Problems
1. **Poor Display Method**: We have excellent detailed fields (which is GOOD for power users), but they're crammed into a small 320px node card making them hard to use
2. **Poor Scalability**: Adding more settings makes the node extremely tall and unwieldy
3. **Nested Collapsibles**: Advanced Settings inside an already complex node is confusing to navigate
4. **Schema Field Management**: Adding/removing schema fields takes up too much space in the limited node width
5. **Difficult Editing**: Large text areas in small node cards are hard to work with - need more space!
6. **Node Resizing**: Dynamic content causes node size changes, moving connections around

**Key Insight**: The detailed fields are PERFECT for AI configuration. We just need a better canvas to display them all - hence the Dialog approach gives us a full-screen workspace while keeping the node card clean.

## Proposed Solution: Dialog-Based Settings

### New Simplified Node Card (Collapsed View)
The node card shows only essential information:
- **Node Header**: Name, type, collapse toggle
- **Mode Badge**: Small badge showing "Text" or "Structured" mode
- **Model Badge**: Small badge showing selected model (e.g., "GPT-4o")
- **Preview**: First 100 chars of prompt or result
- **Settings Button**: Opens Dialog for full configuration
- **Test/Delete Buttons**: Quick actions
- **Result Display**: When executed, shows result with fixed height

### Settings Dialog (Expanded View)
Opens in a large, centered modal with tabs for organization:

#### Tab 1: Configuration
- **Mode Selector** (Radio Group or Select)
- **Model Selector** (Searchable Select with groups)
- **Prompt** (Large textarea with syntax highlighting)
- **Instructions/System Prompt** (Large textarea)

#### Tab 2: Structured Data (Only shown in Structured mode)
- **Schema Builder**:
  - Visual schema field editor (table-like layout)
  - Add/Remove fields easily
  - Field type selectors
  - Descriptions for each field
- **Schema Name** (Input)
- **Schema Description** (Textarea)

#### Tab 3: Advanced
- **Temperature** (Slider with number input, shows description of what it does)
- **Max Tokens** (Number input with presets: 500, 1000, 2000, 4000)
- **Top P** (Slider with description)
- **Frequency Penalty** (Slider with description)
- **Presence Penalty** (Slider with description)
- **Stop Sequences** (Tag input for custom stop sequences)
- **Seed** (Number input for reproducible outputs)
- **Logit Bias** (Advanced JSON editor - future)

**Note**: With Dialog approach, we can add MORE detailed controls without compromising UX. Power users get full control, casual users can ignore the Advanced tab.

### Benefits
1. **Clean Node UI**: Only 320px width, fixed height when collapsed
2. **Better Editing**: Full-screen dialog with proper text areas
3. **Organized Settings**: Tabs separate concerns logically
4. **Scalable**: Easy to add new settings without cluttering node
5. **Better UX**: Large form fields, better visibility
6. **No Resizing**: Node stays same size regardless of content

## Component Plan

### New Components to Create
1. **AIAgentSettingsDialog.tsx** - Main dialog component
   - Uses shadcn Dialog
   - Uses shadcn Tabs for organization
   - Uses shadcn Label, Input, Textarea
   - Uses shadcn Slider for temperature/penalties

2. **SchemaBuilder.tsx** - Visual schema editor
   - Table-like layout for schema fields
   - Add/Remove buttons
   - Type selectors
   - Could use shadcn Table component

3. **AIAgentNode.tsx** (Simplified)
   - Compact view with badges
   - Settings button triggers dialog
   - Result preview with fixed height

### Styling Approach
- Use cyber-punk theme colors
- Purple/cyan accents
- Dark backgrounds
- Glow effects on interactive elements
- Smooth animations

## Implementation Steps
1. Check which shadcn components exist in the web app
2. Copy/adapt needed components to nodes-ai package
3. Create SchemaBuilder component
4. Create AIAgentSettingsDialog component
5. Simplify AIAgentNode to compact view
6. Add dialog trigger button
7. Style everything with cyber-punk theme
8. Test UX flow

## Expected Outcome
- Clean, professional node cards at 320px width
- No dynamic resizing causing layout shifts
- Professional settings dialog with proper form UX
- Much easier to configure complex AI agents
- Scalable for future features (file uploads, tool calling, etc.)
