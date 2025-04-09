/**
 * Script to update hardcoded API URLs in React components
 * 
 * This script:
 * 1. Adds import statement for the API utility
 * 2. Replaces hardcoded localhost URLs with the API utility calls
 * 
 * Usage:
 * 1. Run: node update-api-urls.js
 * 2. Then manually verify each file was updated correctly
 */

const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'src/User/user-dashboard.jsx',
  'src/User/settings.jsx',
  'src/User/MarketAnalysis.jsx',
  'src/User/market.jsx',
  'src/Admin/adminsettings.jsx',
  'src/Admin/TransactionPage.jsx',
  'src/Admin/UserManagement.jsx',
  'src/Admin/admin-dashboard.jsx'
];

// Process each file
filesToUpdate.forEach(filePath => {
  try {
    console.log(`Processing ${filePath}...`);
    
    // Read the file content
    const fullPath = path.resolve(filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if file already imports the API utility
    const hasApiImport = content.includes("import api from '../utils/api'") || 
                         content.includes("import api from '../../utils/api'");
    
    // Add API import if not present
    if (!hasApiImport) {
      // Determine relative path to utils/api.js
      const relativePath = filePath.startsWith('src/User/') || filePath.startsWith('src/Admin/') 
                         ? '../utils/api' 
                         : '../../utils/api';
      
      // Add import after the axios import if it exists
      if (content.includes("import axios from 'axios';")) {
        content = content.replace(
          "import axios from 'axios';", 
          `import axios from 'axios';\nimport api from '${relativePath}';`
        );
      } 
      // Otherwise add it after the first import
      else {
        const importRegex = /^import .+ from .+;/m;
        const match = content.match(importRegex);
        if (match) {
          content = content.replace(
            match[0], 
            `${match[0]}\nimport api from '${relativePath}';`
          );
        }
      }
    }
    
    // Replace axios.get('http://localhost:5000/api/...')
    content = content.replace(
      /axios\.get\(['"]http:\/\/localhost:5000\/api\/([^'"]+)['"]/g, 
      "api.get('/$1'"
    );
    
    // Replace axios.post('http://localhost:5000/api/...')
    content = content.replace(
      /axios\.post\(['"]http:\/\/localhost:5000\/api\/([^'"]+)['"]/g, 
      "api.post('/$1'"
    );
    
    // Replace axios.put('http://localhost:5000/api/...')
    content = content.replace(
      /axios\.put\(['"]http:\/\/localhost:5000\/api\/([^'"]+)['"]/g, 
      "api.put('/$1'"
    );
    
    // Replace axios.delete('http://localhost:5000/api/...')
    content = content.replace(
      /axios\.delete\(['"]http:\/\/localhost:5000\/api\/([^'"]+)['"]/g, 
      "api.delete('/$1'"
    );
    
    // Replace fetch('http://localhost:5000/api/...')
    content = content.replace(
      /fetch\(['"]http:\/\/localhost:5000\/api\/([^'"]+)['"]/g, 
      "api.get('/$1').then(response => response.data"
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${filePath}`);
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('\nDone! Please manually verify all files to ensure correct updates.');
console.log('Note: fetch() calls were converted to api.get() - you may need to adjust the response handling.'); 