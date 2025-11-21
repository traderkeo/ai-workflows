# Workflow Builder Styling Instructions

## Overview
This document provides token-efficient instructions for updating `packages/nodes-ai` to match the interface, styling, spacing, and typography principles from `apps/web/src/app/demos/workflows` (located at `/app/demos/workflows/page.tsx`).

---

## Design System Analysis

### 1. **Background & Container**

#### From `/workflows` (Target Style):
```tsx
// Outer container with gradient
<div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
  // Content container with responsive padding
  <div className="container mx-auto px-4 py-8">
```

#### Current `/workflow-builder`:
```tsx
<div className="flex h-screen w-screen bg-zinc-950">
```

**Change Required:**
- Replace `bg-zinc-950` with `bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800`
- Change from `h-screen w-screen` to `min-h-screen`
- Wrap main content in `<div className="container mx-auto px-4 py-8">`

---

### 2. **Header Pattern**

#### From `/workflows`:
```tsx
<div className="mb-8">
  {/* Back Button */}
  <Link href="/demos">
    <Button variant="ghost" size="sm" className="mb-4">
      <ArrowLeft className="mr-2 w-4 h-4" />
      Back to Demos
    </Button>
  </Link>

  {/* Title Section with Icon */}
  <div className="flex items-center gap-3 mb-2">
    <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
      <Workflow className="w-5 h-5 text-pink-600 dark:text-pink-400" />
    </div>
    <h1 className="text-4xl font-bold">Workflow Chains</h1>
  </div>

  {/* Subtitle */}
  <p className="text-gray-600 dark:text-gray-300">
    Orchestrate complex AI workflows with sequential, parallel, and conditional patterns
  </p>
</div>
```

**Implementation for `/workflow-builder`:**
Add this header before the main grid/flex layout:
```tsx
<div className="mb-8">
  <Link href="/">
    <Button variant="ghost" size="sm" className="mb-4">
      <ArrowLeft className="mr-2 w-4 h-4" />
      Back to Home
    </Button>
  </Link>
  <div className="flex items-center gap-3 mb-2">
    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
      <Workflow className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    </div>
    <h1 className="text-4xl font-bold">Workflow Builder</h1>
  </div>
  <p className="text-gray-600 dark:text-gray-300">
    Design and orchestrate AI workflows with a visual node-based editor
  </p>
</div>
```

**Required Imports:**
```tsx
import Link from 'next/link';
import { ArrowLeft, Workflow } from 'lucide-react';
```

---

### 3. **Layout Pattern**

#### From `/workflows`:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Left sidebar (1/3 on large screens) */}
  <div className="lg:col-span-1 space-y-6">
    <Card>...</Card>
    <Card>...</Card>
  </div>

  {/* Main content (2/3 on large screens) */}
  <div className="lg:col-span-2 space-y-6">
    <Card>...</Card>
  </div>
</div>
```

**Current `/workflow-builder`:**
Uses flex with absolute width sidebars

**Change Required:**
Replace flex layout with responsive grid pattern above. Wrap sidebars and canvas in Card components.

---

### 4. **Card Component Usage**

#### Standard Pattern from `/workflows`:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title Here</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content with consistent spacing */}
  </CardContent>
</Card>
```

**Card Component Details:**
- Base: `rounded-xl border py-6 shadow-sm bg-card`
- Header padding: `px-6 gap-2`
- Content padding: `px-6`
- Uses `space-y-6` for vertical card spacing in container
- Uses `space-y-4` for content within cards

---

### 5. **Spacing System**

| Context | Class | Pixels (approx) |
|---------|-------|-----------------|
| Container padding | `px-4 py-8` | 16px / 32px |
| Card spacing (vertical) | `space-y-6` | 24px |
| Content spacing (within cards) | `space-y-4` | 16px |
| Element spacing (buttons, inputs) | `gap-2` | 8px |
| Icon-text gap | `gap-3` | 12px |
| Section margin bottom | `mb-8` | 32px |
| Button margin | `mb-4` | 16px |

**Consistent Spacing Hierarchy:**
- Section level: `space-y-6` (24px)
- Content level: `space-y-4` (16px)
- Small elements: `space-y-2` or `gap-2` (8px)
- Section margins: `mb-8` (32px)

---

### 6. **Typography System**

| Element | Classes | Purpose |
|---------|---------|---------|
| Page Title | `text-4xl font-bold` | Main page heading |
| Card Title | `text-sm font-semibold leading-none` | Section headings |
| Description | `text-sm text-muted-foreground` | Subtitles, descriptions |
| Body Text | `text-sm` | Regular content |
| Small Labels | `text-xs` | Secondary info, labels |
| Subtitle | `text-gray-600 dark:text-gray-300` | Page descriptions |

**Font Weight Hierarchy:**
- `font-bold` - Page titles
- `font-semibold` - Card titles, emphasis
- `font-medium` - Labels, medium emphasis
- (default) - Body text

---

### 7. **Color Palette**

#### Semantic Colors (from workflows):
```tsx
// Workflow types use color coding:
sequential: {
  color: 'text-blue-500',
  bgColor: 'bg-blue-50',
  darkBg: 'dark:bg-blue-900',
}
parallel: {
  color: 'text-green-500',
  bgColor: 'bg-green-50',
  darkBg: 'dark:bg-green-900',
}
conditional: {
  color: 'text-purple-500',
  bgColor: 'bg-purple-50',
  darkBg: 'dark:bg-purple-900',
}
retry: {
  color: 'text-orange-500',
  bgColor: 'bg-orange-50',
  darkBg: 'dark:bg-orange-900',
}
complex: {
  color: 'text-pink-500',
  bgColor: 'bg-pink-50',
  darkBg: 'dark:bg-pink-900',
}
```

#### Background Colors:
```tsx
// Page gradient
bg-gradient-to-br from-pink-50 to-purple-50
dark:from-gray-900 dark:to-gray-800

// Icon badge background
bg-pink-100 dark:bg-pink-900

// Content backgrounds
bg-gray-50 dark:bg-gray-900       // Content boxes
bg-white dark:bg-gray-800         // Inner content

// Border colors
border-gray-200 dark:border-gray-700
```

#### Text Colors:
```tsx
text-gray-600 dark:text-gray-300  // Descriptions
text-gray-400                      // Disabled/placeholder
text-muted-foreground              // Secondary text (via design tokens)
```

---

### 8. **Icon & Badge Patterns**

#### Icon Badge (from header):
```tsx
<div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
  <Workflow className="w-5 h-5 text-pink-600 dark:text-pink-400" />
</div>
```

**Pattern:**
- Container: `w-10 h-10` (40x40px)
- Rounded: `rounded-lg`
- Background: `bg-{color}-100 dark:bg-{color}-900`
- Icon size: `w-5 h-5` (20x20px)
- Icon color: `text-{color}-600 dark:text-{color}-400`
- Flex center: `flex items-center justify-center`

#### Small Icon Badge:
```tsx
<div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600">
  {i + 1}
</div>
```

---

### 9. **Button Patterns**

#### From `/workflows`:
```tsx
// Primary action
<Button className="w-full">
  <Icon className="mr-2 w-4 h-4" />
  Execute Workflow
</Button>

// Secondary action
<Button variant="outline" size="sm" className="flex-1">
  Load Example
</Button>

// Ghost (back button)
<Button variant="ghost" size="sm" className="mb-4">
  <ArrowLeft className="mr-2 w-4 h-4" />
  Back to Demos
</Button>
```

**Consistent Icon Sizing:**
- Button icons: `w-4 h-4` (16x16px)
- Icon spacing: `mr-2` (8px before text)

---

### 10. **Responsive Design Patterns**

#### Grid Breakpoints:
```tsx
// Mobile-first approach
grid grid-cols-1        // 1 column on mobile
lg:grid-cols-3          // 3 columns on large screens (1024px+)
lg:col-span-1           // Sidebar takes 1 column
lg:col-span-2           // Main content takes 2 columns
```

#### Content Breakpoints:
```tsx
md:grid-cols-2          // 2 columns on medium (768px+)
md:grid-cols-3          // 3 columns on medium (768px+)
```

#### Container System:
```tsx
container mx-auto       // Centered container with max-width
px-4                    // 16px horizontal padding
```

---

## Implementation Checklist

### Phase 1: Layout Foundation
- [ ] Wrap entire app in gradient background container
- [ ] Add responsive container with proper padding
- [ ] Add header section with back button, icon, title, subtitle
- [ ] Convert flex layout to responsive grid

### Phase 2: Component Integration
- [ ] Wrap NodePalette in Card component with CardHeader/CardContent
- [ ] Wrap Canvas area in Card component
- [ ] Wrap NodeConfigPanel in Card component with proper styling
- [ ] Add consistent spacing with `space-y-6` between cards

### Phase 3: Typography & Spacing
- [ ] Update all headings to use typography system
- [ ] Apply consistent spacing hierarchy
- [ ] Update text colors to match design tokens
- [ ] Ensure proper dark mode support

### Phase 4: Polish
- [ ] Add icon badges where appropriate
- [ ] Update button variants and sizes
- [ ] Add descriptions to card headers
- [ ] Test responsive breakpoints

---

## Complete Example Structure

```tsx
export default function WorkflowBuilderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold">Workflow Builder</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Design and orchestrate AI workflows with a visual node-based editor
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Node Palette</CardTitle>
                <CardDescription>Drag nodes to the canvas</CardDescription>
              </CardHeader>
              <CardContent>
                <NodePalette onAddNode={addNode} />
              </CardContent>
            </Card>
          </div>

          {/* Main Canvas */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="min-h-[600px]">
              <CardHeader>
                <CardTitle>Workflow Canvas</CardTitle>
                <CardDescription>Design your workflow by connecting nodes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-[600px]">
                  <Canvas {...canvasProps}>
                    <Controls />
                    <Panel position="top-center">
                      <WorkflowToolbar {...toolbarProps} />
                    </Panel>
                  </Canvas>
                </div>
              </CardContent>
            </Card>

            {/* Config Panel (conditionally rendered) */}
            {selectedNode && (
              <Card>
                <CardHeader>
                  <CardTitle>Node Configuration</CardTitle>
                  <CardDescription>Configure selected node</CardDescription>
                </CardHeader>
                <CardContent>
                  <NodeConfigPanel {...configProps} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Key Principles Summary

1. **Spacing Hierarchy**: Section (24px) → Content (16px) → Elements (8px)
2. **Color System**: Use semantic colors with dark mode variants
3. **Typography**: Bold titles, semibold headings, regular body
4. **Layout**: Mobile-first responsive grid with `container mx-auto`
5. **Cards**: Consistent structure with CardHeader/CardContent
6. **Icons**: 40x40px badges for headers, 16x16px for buttons
7. **Background**: Gradient from pink-50 to purple-50 (light mode)
8. **Padding**: Container px-4 py-8, card content px-6

---

## Token Reference

**Most Important Classes to Remember:**
```
Layout:     container mx-auto px-4 py-8
Background: bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800
Grid:       grid grid-cols-1 lg:grid-cols-3 gap-6
Spacing:    space-y-6 (cards), space-y-4 (content)
Typography: text-4xl font-bold (title), text-sm font-semibold (headings)
Icon Badge: w-10 h-10 rounded-lg bg-{color}-100 dark:bg-{color}-900
```

---

*Document Version: 1.0*
*Last Updated: 2025-01-08*
*Based on: `/app/demos/workflows/page.tsx` and `/app/workflow-builder/page.tsx`*
