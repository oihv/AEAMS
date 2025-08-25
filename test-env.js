// Simple test to check if .env file is loading properly
require('dotenv').config();

console.log('🔍 Environment Test:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL preview:', process.env.DATABASE_URL.substring(0, 30) + '...');
}
