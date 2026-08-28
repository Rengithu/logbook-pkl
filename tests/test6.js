const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const lines = html.split('\n');
let rightSidebarLine = -1;
lines.forEach((line, i) => {
  if (line.includes('app-right-sidebar')) {
    rightSidebarLine = i + 1;
  }
});
console.log('Right sidebar is at line:', rightSidebarLine);
