#!/usr/bin/env node
/**
 * Script to add debounced inputs to all node files
 * Updates imports and adds local state management for text inputs
 */

const fs = require('fs');
const path = require('path');

const nodesDir = path.join(__dirname, 'src', 'nodes');

// Files to update
const filesToUpdate = [
  'WebSearchNode.tsx',
  'ImageGenerationNode.tsx',
  'VideoGenerationNode.tsx',
  'AudioTTSNode.tsx',
  'GenerateNode.tsx',
  'ConditionNode.tsx',
  'HttpRequestNode.tsx',
  'DocumentIngestNode.tsx',
  'WebScrapeNode.tsx',
  'RetrievalQANode.tsx',
  'GuardrailNode.tsx',
  'RerankNode.tsx',
  'SplitterNode.tsx',
  'AggregatorNode.tsx',
  'CacheNode.tsx',
];

// Mapping of fields that typically need debouncing for each node
const nodeFieldsMap = {
  'WebSearchNode.tsx': ['query', 'allowedDomains', 'userCountry', 'userCity', 'userRegion', 'userTimezone'],
  'ImageGenerationNode.tsx': ['prompt', 'negativePrompt'],
  'VideoGenerationNode.tsx': ['prompt'],
  'AudioTTSNode.tsx': ['text'],
  'GenerateNode.tsx': ['prompt', 'instructions'],
  'ConditionNode.tsx': ['condition'],
  'HttpRequestNode.tsx': ['url', 'body'],
  'DocumentIngestNode.tsx': ['filePath', 'url'],
  'WebScrapeNode.tsx': ['url'],
  'RetrievalQANode.tsx': ['query'],
  'GuardrailNode.tsx': ['rules'],
  'RerankNode.tsx': ['query'],
  'SplitterNode.tsx': ['delimiter'],
  'AggregatorNode.tsx': ['expression'],
  'CacheNode.tsx': ['key'],
};

function updateFile(filename) {
  const filePath = path.join(nodesDir, filename);

  // Backup original
  const backupPath = filePath + '.backup-debounce';
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Step 1: Add useEffect to React imports if not present
  if (content.includes("from 'react'")) {
    if (!content.includes('useEffect')) {
      content = content.replace(
        /import React,\s*\{([^}]+)\}\s*from\s*'react';/,
        (match, imports) => {
          const importsArray = imports.split(',').map(i => i.trim());
          if (!importsArray.includes('useEffect')) {
            importsArray.push('useEffect');
          }
          if (!importsArray.includes('useState') && content.includes('useState')) {
            // If useState is used but not imported (shouldn't happen, but just in case)
            importsArray.push('useState');
          }
          return `import React, { ${importsArray.join(', ')} } from 'react';`;
        }
      );
    }
  }

  // Step 2: Add useDebouncedNodeUpdate import if not present
  if (!content.includes('useDebouncedNodeUpdate')) {
    const useFlowStoreImportMatch = content.match(/import\s*\{[^}]*\}\s*from\s*['"]\.\.\/hooks\/useFlowStore['"]/);
    if (useFlowStoreImportMatch) {
      content = content.replace(
        useFlowStoreImportMatch[0],
        useFlowStoreImportMatch[0] + "\nimport { useDebouncedNodeUpdate } from '../hooks/useDebouncedNodeUpdate';"
      );
    }
  }

  // Step 3: Add debounced update hook after useFlowStore declarations
  if (!content.includes('debouncedUpdate = useDebouncedNodeUpdate')) {
    const updateNodeMatch = content.match(/const updateNode = useFlowStore\([^)]+\);/);
    if (updateNodeMatch) {
      content = content.replace(
        updateNodeMatch[0],
        updateNodeMatch[0] + '\n  const debouncedUpdate = useDebouncedNodeUpdate(props.id, 300);'
      );
    }
  }

  // Step 4: Identify which fields this node uses and add local state
  const fields = nodeFieldsMap[filename] || [];
  const componentMatch = content.match(/export const \w+: React\.FC<NodeProps> = \(props\) => \{[\s\S]*?const handleChange/);

  if (componentMatch && fields.length > 0) {
    // Find where to insert local state (after useState declarations or after handleChange function)
    const handleChangeIndex = content.indexOf('const handleChange');
    if (handleChangeIndex > -1) {
      // Look for existing local state declarations
      let hasLocalState = false;
      for (const field of fields) {
        const localVarName = 'local' + field.charAt(0).toUpperCase() + field.slice(1);
        if (content.includes(`const [${localVarName}`)) {
          hasLocalState = true;
          break;
        }
      }

      if (!hasLocalState) {
        // Add local state declarations before handleChange
        const localStateDeclarations = fields.map(field => {
          const localVarName = 'local' + field.charAt(0).toUpperCase() + field.slice(1);
          const setterName = 'set' + field.charAt(0).toUpperCase() + field.slice(1);
          return `  const [${localVarName}, ${setterName}] = useState(data.${field} || '');\n  useEffect(() => ${setterName}(data.${field} || ''), [data.${field}]);`;
        }).join('\n');

        content = content.replace(
          /(\n  const handleChange)/,
          `\n  // Local state for debounced inputs\n${localStateDeclarations}\n$1`
        );
      }
    }
  }

  // Step 5: Update onChange handlers to use local state and debounced updates
  // This is complex and field-specific, so we'll do a simpler pattern match
  for (const field of fields) {
    const localVarName = 'local' + field.charAt(0).toUpperCase() + field.slice(1);
    const setterName = 'set' + field.charAt(0).toUpperCase() + field.slice(1);

    // Pattern: onChange={(e) => handleChange('field', e.target.value)}
    const pattern1 = new RegExp(`onChange=\\{\\(e\\) => handleChange\\('${field}', e\\.target\\.value\\)\\}`, 'g');
    if (pattern1.test(content)) {
      content = content.replace(pattern1,
        `onChange={(e) => {\n            ${setterName}(e.target.value);\n            debouncedUpdate({ ${field}: e.target.value });\n          }}`
      );

      // Also update value prop
      const valuePattern = new RegExp(`value=\\{data\\.${field}([^}]*)\\}`, 'g');
      content = content.replace(valuePattern, `value={${localVarName}}`);
    }
  }

  // Write updated content
  fs.writeFileSync(filePath, content, 'utf8');

  console.log(`✅ Updated ${filename}`);
  return true;
}

// Main execution
console.log('🚀 Starting debounce updates for node files...\n');

let successCount = 0;
let errorCount = 0;

for (const file of filesToUpdate) {
  try {
    if (fs.existsSync(path.join(nodesDir, file))) {
      updateFile(file);
      successCount++;
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${file}:`, error.message);
    errorCount++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Successfully updated: ${successCount} files`);
console.log(`   ❌ Errors: ${errorCount} files`);
console.log(`\n💾 Backups created with .backup-debounce extension`);
console.log(`\n🔧 Next: Run 'pnpm type-check' to verify changes`);
