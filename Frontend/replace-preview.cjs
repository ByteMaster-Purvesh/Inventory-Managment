const fs = require('fs');
const file = 'src/features/editor/components/PreviewPane.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
  'bg-slate-800/95': 'bg-zinc-900/95',
  'border-slate-700/50': 'border-zinc-800/50',
  'text-slate-200': 'text-zinc-200',
  'bg-slate-900': 'bg-zinc-950',
  'border-slate-700': 'border-zinc-700',
  'text-white': 'text-zinc-100',
  'text-slate-400': 'text-zinc-400',
  'text-slate-600': 'text-zinc-600',
  'text-slate-300': 'text-zinc-300',
  'hover:bg-slate-700': 'hover:bg-zinc-800',
  'bg-slate-700/80': 'bg-zinc-800/80',
  'focus:border-blue-500': 'focus:border-orange-500',
  'bg-blue-600': 'bg-orange-600',
  'bg-blue-100/50': 'bg-orange-500/20'
};

for (const [find, replace] of Object.entries(replacements)) {
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  content = content.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

fs.writeFileSync(file, content);
console.log('Replacements complete for PreviewPane');
