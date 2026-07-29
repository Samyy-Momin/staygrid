const fs = require('fs');
const path = require('path');

const map = {
    '#2563EB': '#0066CC', // Pool Blue
    '#6366f1': '#0066CC', // Pool Blue
    '#3b82f6': '#0066CC', // Pool Blue
    '#0ea5e9': '#0066CC', // Pool Blue
    '#fbbf24': '#F59E0B', // Warning / Gold
    '#10b981': '#10B981', // Success
    '#ef4444': '#EF4444', // Danger
    '#F9F9F9': '#FBFBF9', // Ivory
    '#ffffff': '#FBFBF9', // Ivory
    '#18181b': '#3A3A3C', // Charcoal
    '#524a48': '#3A3A3C', // Charcoal
    '#a1a1aa': '#9B9B9B', // Gravel-500
    '#71717a': '#9B9B9B', // Gravel-500
    '#d4d4d8': '#CFCFC8', // Gravel-300
    '#3730a3': '#0066CC',
    '#e0e7ff': '#FBFBF9'
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
                // global string replace for hex colors, case-insensitive
                const regex = new RegExp(key, 'gi');
                if (regex.test(content)) {
                    content = content.replace(regex, value);
                    modified = true;
                }
            }
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated Hex in ${fullPath}`);
            }
        }
    }
}

walkDir('d:/staygrid/apps/mobile/app');
