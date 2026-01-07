const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '../app/version.json');

// Read or create version file
let versionData;
try {
  const fileContent = fs.readFileSync(versionFilePath, 'utf8');
  versionData = JSON.parse(fileContent);
} catch (error) {
  // File doesn't exist or is invalid, create initial version
  versionData = {
    build: 0,
    timestamp: new Date().toISOString()
  };
}

// Increment build number
versionData.build += 1;
versionData.timestamp = new Date().toISOString();

// Write updated version back to file
fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));

console.log(`Version incremented to build ${versionData.build} at ${versionData.timestamp}`);
