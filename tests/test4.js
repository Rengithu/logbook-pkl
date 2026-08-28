const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const { JSDOM } = require('jsdom');
const dom = new JSDOM(html);
const doc = dom.window.document;
const dashboard = doc.querySelector('#tab-dashboard');
if (dashboard) {
  let parent = dashboard.parentElement;
  while(parent && parent.tagName !== 'BODY') {
    console.log(parent.tagName, parent.className, parent.id);
    parent = parent.parentElement;
  }
} else {
  console.log("No tab-dashboard found");
}
