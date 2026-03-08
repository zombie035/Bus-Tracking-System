// fix-issues.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing common issues...');

// 1. Create client .env
const clientEnvPath = path.join(__dirname, 'client', '.env');
if (!fs.existsSync(clientEnvPath)) {
  fs.writeFileSync(clientEnvPath, 'SKIP_PREFLIGHT_CHECK=true\nDISABLE_ESLINT_PLUGIN=true\n');
  console.log('✅ Created client/.env');
}

// 2. Create server .env
const serverEnvPath = path.join(__dirname, '.env');
if (!fs.existsSync(serverEnvPath)) {
  const envContent = `NODE_ENV=development
PORT=5000
SESSION_SECRET=bus-tracking-secret-key-${Date.now()}
USE_MOCK_DB=true
CLIENT_URL=http://localhost:3000
`;
  fs.writeFileSync(serverEnvPath, envContent);
  console.log('✅ Created root .env');
}

// 3. Update config/db.js with proper mock setup
const dbConfigPath = path.join(__dirname, 'server', 'config', 'db.js');
let dbConfig = fs.readFileSync(dbConfigPath, 'utf8');

// Add a quick fix for mock database
if (!dbConfig.includes('process.env.USE_MOCK_DB')) {
  dbConfig = dbConfig.replace(
    'const connectDB = async () => {',
    `const connectDB = async () => {
  // Check if mock database should be used
  if (process.env.USE_MOCK_DB === 'true') {
    console.log('🔧 Using mock database as configured');
    return setupMockDatabase();
  }`
  );
  fs.writeFileSync(dbConfigPath, dbConfig);
  console.log('✅ Updated db.js with USE_MOCK_DB check');
}

console.log('✨ All fixes applied!');
console.log('\nNext steps:');
console.log('1. Run: npm run install-all');
console.log('2. Run: npm run dev');
console.log('\nIf issues persist:');
console.log('- Delete node_modules in both root and client folders');
console.log('- Run: npm run install-all');