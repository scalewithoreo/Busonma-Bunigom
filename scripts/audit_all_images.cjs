const fs = require('fs');

const config = fs.readFileSync('src/config/couples/busonma-bunigom.ts', 'utf8');

const regex = /['"](\/assets\/busonma-bunigom\/[^'"]+)['"]/g;
let match;
const found = [];
while ((match = regex.exec(config)) !== null) {
  found.push(match[1]);
}

console.log('Unique image paths referenced in busonma-bunigom.ts:');
const counts = {};
found.forEach(p => {
  const clean = p.split('?')[0];
  counts[clean] = (counts[clean] || 0) + 1;
});

Object.entries(counts).forEach(([file, cnt]) => {
  console.log(file.padEnd(50), cnt === 1 ? 'OK (used once)' : `⚠️ REPEATED ${cnt} times!`);
});
