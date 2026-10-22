const fs = require('fs');
const path = require('path');
const dir = 'src/pages/app';
fs.readdirSync(dir).forEach(file => {
  if (!file.endsWith('.tsx')) return;
  const p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/^import\s+\{[^}]*\}\s+from\s+['"]framer-motion['"];\s*\n/gm, '');
  c = c.replace(/<motion\.(\w+)(\s)/g, '<$1$2');
  c = c.replace(/<\/motion\.(\w+)>/g, '</$1>');
  c = c.replace(/\s+initial=\{[^}]*\}/g, '');
  c = c.replace(/\s+animate=\{[^}]*\}/g, '');
  c = c.replace(/\s+exit=\{[^}]*\}/g, '');
  c = c.replace(/\s+whileHover=\{[^}]*\}/g, '');
  c = c.replace(/\s+whileTap=\{[^}]*\}/g, '');
  c = c.replace(/^import React[^;]*;\s*\n/gm, '');
  fs.writeFileSync(p, c);
  console.log('Fixed:', file);
});
