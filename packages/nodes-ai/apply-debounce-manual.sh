#!/bin/bash
# Manual debounce updates for high-priority files

# Function to update a file with debounced inputs
update_node_file() {
    local file=$1
    local field=$2
    local defaultValue=${3:-"''"}
    
    echo "Updating $file for field: $field"
    
    # Backup
    cp "src/nodes/$file" "src/nodes/${file}.bak"
    
    # Add imports if not present
    if ! grep -q "useEffect" "src/nodes/$file"; then
        sed -i "1s/import React/import React, { useEffect }/" "src/nodes/$file"
    fi
    
    if ! grep -q "useState" "src/nodes/$file"; then
        sed -i "1s/import React, {/import React, { useState,/" "src/nodes/$file"
    fi
    
    if ! grep -q "useDebouncedNodeUpdate" "src/nodes/$file"; then
        # Find the useFlowStore line and add the import after the last import
        sed -i "/from '..\/hooks\/useFlowStore'/a import { useDebouncedNodeUpdate } from '../hooks/useDebouncedNodeUpdate';" "src/nodes/$file"
    fi
}

# List of files that are confirmed to need updates based on grep results
echo "Applying manual debounce updates..."

# These files have been confirmed to have onChange handlers that need debouncing
for file in ImageGenerationNode.tsx VideoGenerationNode.tsx AudioTTSNode.tsx GenerateNode.tsx WebSearchNode.tsx; do
    if [ -f "src/nodes/$file" ]; then
        update_node_file "$file" "prompt"
    fi
done

echo "Manual updates complete. Run pnpm type-check to verify."
