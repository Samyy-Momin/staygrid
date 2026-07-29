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
    // Text colors
    { regex: /text-(?:zinc|gray|staygridGravel)-500/g, replacement: 'text-text-muted' },
    { regex: /text-(?:zinc|gray|staygridGravel)-600/g, replacement: 'text-text-muted' },
    { regex: /text-(?:zinc|gray|staygridGravel)-700/g, replacement: 'text-text-primary' },
    { regex: /text-(?:zinc|gray|staygridGravel)-800/g, replacement: 'text-text-primary' },
    { regex: /text-(?:zinc|gray|staygridGravel)-900/g, replacement: 'text-text-primary' },
    
    // Backgrounds
    { regex: /bg-(?:zinc|gray|staygridGravel)-50/g, replacement: 'bg-surface' },
    { regex: /bg-(?:zinc|gray|staygridGravel)-100/g, replacement: 'bg-surface' },
    { regex: /bg-(?:zinc|gray|staygridGravel)-200/g, replacement: 'bg-surface' },
    { regex: /bg-(?:zinc|gray|staygridGravel)-800/g, replacement: 'bg-surface' },
    { regex: /bg-(?:zinc|gray|staygridGravel)-900/g, replacement: 'bg-surface' },
    { regex: /bg-(?:zinc|gray|staygridGravel)-950/g, replacement: 'bg-surface' },
    
    // Borders
    { regex: /border-(?:zinc|gray|staygridGravel)-100/g, replacement: 'border-border' },
    { regex: /border-(?:zinc|gray|staygridGravel)-200/g, replacement: 'border-border' },
    { regex: /border-(?:zinc|gray|staygridGravel)-300/g, replacement: 'border-border' },
    { regex: /border-(?:zinc|gray|staygridGravel)-700/g, replacement: 'border-border' },
    { regex: /border-(?:zinc|gray|staygridGravel)-800/g, replacement: 'border-border' },
    
    // Primary Accents (Blue/Indigo -> accent-primary)
    { regex: /bg-(?:indigo|blue|sky)-500/g, replacement: 'bg-accent-primary' },
    { regex: /bg-(?:indigo|blue|sky)-600/g, replacement: 'bg-accent-primary' },
    { regex: /text-(?:indigo|blue|sky)-500/g, replacement: 'text-accent-primary' },
    { regex: /text-(?:indigo|blue|sky)-600/g, replacement: 'text-accent-primary' },
    { regex: /border-(?:indigo|blue|sky)-500/g, replacement: 'border-accent-primary' },
    { regex: /border-(?:indigo|blue|sky)-600/g, replacement: 'border-accent-primary' },
    
    // Success / Nature (Emerald -> success or accent-nature)
    { regex: /bg-emerald-500/g, replacement: 'bg-success' },
    { regex: /text-emerald-500/g, replacement: 'text-success' },
    
    // Warning / Premium (Amber/Yellow -> warning or accent-premium)
    { regex: /bg-(?:amber|yellow)-500/g, replacement: 'bg-warning' },
    { regex: /text-(?:amber|yellow)-500/g, replacement: 'text-warning' },
    
    // Danger (Red -> danger)
    { regex: /bg-(?:red|rose)-500/g, replacement: 'bg-danger' },
    { regex: /text-(?:red|rose)-500/g, replacement: 'text-danger' },
    
    // Old Staygrid specific aliases
    { regex: /text-staygridIvory/g, replacement: 'text-surface' },
    { regex: /bg-staygridIvory/g, replacement: 'bg-surface' },
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
