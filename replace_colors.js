const fs = require('fs');
const path = require('path');

const map = {
    // missing cyan
    'text-cyan-500': 'text-accent-primary',
    'text-cyan-600': 'text-accent-primary',
    'text-cyan-800': 'text-accent-primary',
    'text-cyan-200': 'text-accent-primary',
    'bg-cyan-50': 'bg-accent-primary/10',
    'bg-cyan-600': 'bg-accent-primary',
    'bg-cyan-700': 'bg-accent-primary',
    'bg-cyan-900/20': 'bg-accent-primary/10',
    'border-cyan-200': 'border-accent-primary/20',
    'border-cyan-800': 'border-accent-primary/20',
    
    // missing emerald/red
    'bg-emerald-100': 'bg-success/10',
    'bg-red-100': 'bg-danger/10',
    'text-red-700': 'text-danger',
    'border-emerald-800': 'border-success/20',
    'border-red-800': 'border-danger/20',
    
    // missing zinc
    'text-zinc-500': 'text-muted',
    'bg-zinc-700': 'bg-surface',
    'ring-zinc-100': 'ring-border',
    'ring-zinc-900': 'ring-border',
    'ring-zinc-950': 'ring-border',
    'divide-zinc-200': 'divide-border',
    'divide-zinc-800': 'divide-border',

    // sky (for border)
    'border-sky-900/30': 'border-accent-primary/20',
    
    'bg-white': 'bg-surface',
    'dark:text-white': ''
};

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            const variants = ['', 'dark:', 'hover:', 'focus:', 'dark:hover:', 'dark:focus:', 'focus-visible:', 'group-hover:'];
            
            for (const [key, value] of Object.entries(map)) {
                for (const variant of variants) {
                    const searchKey = `${variant}${key}`;
                    const replValue = value ? `${variant}${value}` : '';
                    
                    const regex = new RegExp(`(?<=\\s|['"\`])${searchKey.replace(/:/g, '\\:').split('/').join('\\/')}(?=\\s|['"\`]|/|$)`, 'g');
                    if (regex.test(content)) {
                        content = content.replace(regex, replValue);
                        modified = true;
                    }
                }
            }
            if (modified) {
                content = content.replace(/  +/g, ' ');
                content = content.replace(/ "/g, '"').replace(/ '/g, "'").replace(/ `/g, '`');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

walkDir('d:/staygrid/apps/admin-erp/src/app');
walkDir('d:/staygrid/apps/admin-erp/src/components');
