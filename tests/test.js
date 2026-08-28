const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const lines = html.split('\n');
let divCount = 0;
let mainCount = 0;
lines.forEach((line, i) => {
  if (line.includes('<div')) divCount++;
  if (line.includes('</div')) divCount--;
  if (line.includes('<main')) mainCount++;
  if (line.includes('</main')) mainCount--;
});
console.log('Final div count:', divCount);
console.log('Final main count:', mainCount);
