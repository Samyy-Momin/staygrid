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
    // Paddings
    { regex: /\bpx-5\b/g, replacement: 'px-6' },
    { regex: /\bpx-3\b/g, replacement: 'px-4' },
    { regex: /\bpy-5\b/g, replacement: 'py-6' },
    { regex: /\bpy-3\b/g, replacement: 'py-4' },
    
    // Shadows
    { regex: /\bshadow-lg\b/g, replacement: 'shadow-md' },
    { regex: /\bshadow-indigo-600\/30\b/g, replacement: '' },
    { regex: /\bshadow-indigo-500\/30\b/g, replacement: '' },
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    replacements.forEach(({regex, replacement}) => {
        content = content.replace(regex, replacement);
    });
    
    // cleanup double spaces from removing shadow colors
    content = content.replace(/  +/g, ' ');
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
