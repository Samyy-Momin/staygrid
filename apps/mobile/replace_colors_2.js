const fs = require('fs');
const path = require('path');

const walk = function(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'app'));

const replacements = [
    // Backgrounds
    { regex: /bg-(?:amber|indigo|emerald|sky|blue|zinc|rose)-50(?:\/50)?/g, replacement: 'bg-surface' },
    { regex: /bg-(?:amber|indigo|emerald|sky|blue|zinc|rose)-100/g, replacement: 'bg-surface' },
    { regex: /bg-(?:amber|indigo|emerald|sky|blue|zinc|rose)-800(?:\/50)?/g, replacement: 'bg-surface' },
    { regex: /bg-(?:amber|indigo|emerald|sky|blue|zinc|rose)-900(?:\/\d+)?/g, replacement: 'bg-surface' },
    { regex: /bg-(?:amber|indigo|emerald|sky|blue|zinc|rose)-950(?:\/\d+)?/g, replacement: 'bg-surface' },
    { regex: /bg-\[\#FBFBF9\]/g, replacement: 'bg-surface' },
    
    // Borders
    { regex: /border-(?:amber|indigo|emerald|sky|blue|zinc|rose)-100/g, replacement: 'border-border' },
    { regex: /border-(?:amber|indigo|emerald|sky|blue|zinc|rose)-200/g, replacement: 'border-border' },
    { regex: /border-(?:amber|indigo|emerald|sky|blue|zinc|rose)-800(?:\/\d+)?/g, replacement: 'border-border' },
    { regex: /border-(?:amber|indigo|emerald|sky|blue|zinc|rose)-900(?:\/\d+)?/g, replacement: 'border-border' },
    
    // Text Primary
    { regex: /text-(?:amber|indigo|emerald|sky|blue|zinc|rose)-800/g, replacement: 'text-text-primary' },
    { regex: /text-(?:amber|indigo|emerald|sky|blue|zinc|rose)-900/g, replacement: 'text-text-primary' },
    { regex: /text-(?:amber|indigo|emerald|sky|blue|zinc|rose)-100/g, replacement: 'text-text-primary' },
    
    // Text Muted
    { regex: /text-(?:amber|indigo|emerald|sky|blue|zinc|rose)-700(?:\/70)?/g, replacement: 'text-text-muted' },
    { regex: /text-(?:amber|indigo|emerald|sky|blue|zinc|rose)-400(?:\/70)?/g, replacement: 'text-text-muted' },
    { regex: /text-(?:amber|indigo|emerald|sky|blue|zinc|rose)-300(?:\/70)?/g, replacement: 'text-text-muted' },
    
    // Specific text overrides
    { regex: /text-amber-600/g, replacement: 'text-warning' },
    { regex: /text-amber-400/g, replacement: 'text-warning' },
    { regex: /text-indigo-400/g, replacement: 'text-accent-primary' },
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    replacements.forEach(({regex, replacement}) => {
        content = content.replace(regex, replacement);
    });
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
