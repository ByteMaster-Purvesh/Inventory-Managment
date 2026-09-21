const fs = require('fs');
const file = 'src/features/editor/components/InputPane.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
  'bg-white text-blue-600 border-t border-l border-r border-slate-200': 'bg-zinc-900 text-orange-500 border-t border-l border-r border-zinc-800',
  'bg-transparent border-slate-200': 'bg-transparent border-zinc-800',
  'bg-white': 'bg-zinc-900',
  'bg-slate-50/10': 'bg-zinc-900',
  'bg-slate-50': 'bg-zinc-950/50',
  'bg-slate-100': 'bg-zinc-800',
  'border-slate-100': 'border-zinc-800',
  'border-slate-200': 'border-zinc-800',
  'border-slate-300': 'border-zinc-700',
  'text-slate-700': 'text-zinc-200',
  'text-slate-600': 'text-zinc-300',
  'text-slate-500': 'text-zinc-400',
  'text-slate-400': 'text-zinc-500',
  'text-slate-300': 'text-zinc-600',
  'hover:bg-slate-100': 'hover:bg-zinc-700',
  'hover:bg-slate-200': 'hover:bg-zinc-700',
  'hover:border-slate-300': 'hover:border-zinc-600',
  'text-blue-600': 'text-orange-500',
  'text-blue-700': 'text-orange-500',
  'bg-blue-100': 'bg-orange-500/20',
  'border-blue-500': 'border-orange-500',
  'bg-blue-50/10': 'bg-orange-500/10',
  'bg-blue-50': 'bg-orange-500/10',
  'ring-blue-500': 'ring-orange-500',
  'hover:text-blue-800': 'hover:text-orange-400',
  'hover:text-blue-600': 'hover:text-orange-500',
  'focus:border-blue-500': 'focus:border-orange-500'
};

for (const [find, replace] of Object.entries(replacements)) {
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  content = content.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

fs.writeFileSync(file, content);
console.log('Replacements complete');
