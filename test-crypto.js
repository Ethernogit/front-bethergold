const crypto = require('node:crypto');
console.log('Node version:', process.version);
try {
  console.log('crypto.hash exists:', typeof crypto.hash);
  if (typeof crypto.hash === 'function') {
    console.log('crypto.hash example:', crypto.hash('sha256', 'test', 'hex'));
  } else {
    console.error('crypto.hash is NOT a function!');
  }
} catch (e) {
  console.error('Error accessing crypto.hash:', e.message);
}
