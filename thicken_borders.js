const fs = require('fs');

// Read the file content
const filePath = 'client/src/components/game/state-piece.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of strokeWidth="2" with strokeWidth="3.5"
content = content.replace(/strokeWidth="2"/g, 'strokeWidth="3.5"');

// Write the file back
fs.writeFileSync(filePath, content);
console.log('Stroke width updated successfully');
