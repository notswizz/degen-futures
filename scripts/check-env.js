#!/usr/bin/env node
// Check if environment variables are properly set

require('dotenv').config();

console.log('Checking environment variables...');

const required = ['MONGODB_URI', 'JWT_SECRET'];
let missing = [];

for (const variable of required) {
  if (!process.env[variable]) {
    missing.push(variable);
  }
}

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(v => console.error(`  - ${v}`));
  console.error('\nPlease create a .env.local file with these variables.');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!');
  console.log('JWT_SECRET length:', process.env.JWT_SECRET.length);
  console.log('MONGODB_URI set:', !!process.env.MONGODB_URI);
} 