const fs = require('fs');
const path = require('path');
const dir = 'src/pages/app';
fs.readdirSync(dir).forEach(file => {
  if (!file.endsWith('.tsx')) return;
  const p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');
  // Fix double-closing braces from regex that left }} instead of >
  // Pattern: <Tag}} should become <Tag>
  c = c.replace(/<(\w+)}}/g, '<$1>');
  // Pattern: key={x}}} should become key={x}>
  c = c.replace(/key=\{([^}]+)\}}}/g, 'key={$1}>');
  fs.writeFileSync(p, c);
  console.log('Fixed braces:', file);
});
