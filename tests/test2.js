const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const lines = html.split('\n');
let divCount = 0;
lines.forEach((line, i) => {
  const opens = (line.match(/<div[^>]*>/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  divCount += (opens - closes);
  if (divCount < 0) {
    console.log(`Line ${i + 1}: count went to ${divCount}. Line: ${line.trim()}`);
  }
});
