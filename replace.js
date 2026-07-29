const fs = require('fs');
const path = require('path');

const map = {
    'bg-zinc-50': 'bg-staygridIvory',
    'bg-white': 'bg-staygridIvory',
    'bg-zinc-900': 'bg-staygridGravel-950',
    'bg-zinc-950': 'bg-staygridGravel-950',
    'text-zinc-500': 'text-staygridGravel-500',
    'text-zinc-400': 'text-staygridGravel-500',
    'border-zinc-200': 'border-staygridGravel-300',
    'border-zinc-800': 'border-staygridGravel-700',
    'text-zinc-900': 'text-staygridGravel-900',
    'text-zinc-100': 'text-staygridIvory',
    'dark:text-white': 'dark:text-staygridIvory',
    'dark:bg-zinc-900': 'dark:bg-staygridGravel-950',
    'dark:bg-zinc-950': 'dark:bg-staygridGravel-950',
    'bg-blue-600': 'bg-staygridPoolBlue',
    'text-indigo-500': 'text-staygridPoolBlue',
    'bg-emerald-100': 'bg-staygridSuccess',
    'text-emerald-800': 'text-staygridIvory',
    'text-emerald-600': 'text-staygridSuccess',
    'text-emerald-400': 'text-staygridSuccess',
    'bg-amber-100': 'bg-staygridWarning',
    'text-amber-800': 'text-staygridIvory',
    'bg-red-100': 'bg-staygridDanger',
    'text-red-800': 'text-staygridIvory',
    'text-red-500': 'text-staygridDanger',
    'text-red-600': 'text-staygridDanger',
    'bg-red-50': 'bg-staygridDanger'
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
            for (const [key, value] of Object.entries(map)) {
                // simple replace all instances (assuming class names won't conflict partially because they are tailwind specific)
                const regex = new RegExp(`\\b${key.replace(':', '\\:')}\\b`, 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, value);
                    modified = true;
                }
            }
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

walkDir('d:/staygrid/apps/admin-erp/src/app');
walkDir('d:/staygrid/apps/mobile/app');
