// generate-token.js
const crypto = require('crypto');

const API_KEY    = 'h8mvv4hyh5tn';    
const API_SECRET = 'bs2p72h9kn5ts3kaex9kfsxt6h64wb522cm64u9vz2tm2uak7f8pszy32mtsarjn';
const USER_ID    = 'ahmad59';            

// Generate JWT manually tanpa library
const header = Buffer.from(JSON.stringify({
  alg: 'HS256',
  typ: 'JWT',
})).toString('base64url');

const now = Math.floor(Date.now() / 1000);
const payload = Buffer.from(JSON.stringify({
  user_id: USER_ID,
  iss: API_KEY,
  sub: `user/${USER_ID}`,
  iat: now,
  exp: now + (60 * 60 * 24 * 30), // 30 hari
})).toString('base64url');

const signature = crypto
  .createHmac('sha256', API_SECRET)
  .update(`${header}.${payload}`)
  .digest('base64url');

const token = `${header}.${payload}.${signature}`;

console.log('\n✅ API KEY:', API_KEY);
console.log('✅ USER ID:', USER_ID);
console.log('\n✅ TOKEN:');
console.log(token);