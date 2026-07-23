const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            /* Recurse into a subdirectory */
            results = results.concat(walk(file));
        } else { 
            /* Is a file */
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
               results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes('aria_workflow_keep_cache')) {
        content = content.replace(/aria_workflow_keep_cache/g, 'aria_workspace_keep_cache');
        changed = true;
    }

    if (content.includes('ariaworkflow.com')) {
        content = content.replace(/ariaworkflow.com/g, 'ariaworkspace.com');
        changed = true;
    }

    if (content.includes('Aria Workflow') || content.includes('ARIA WORKFLOW') || content.includes('Aria workflow')) {
        content = content.replace(/Aria Workflow/g, 'Aria Workspace');
        content = content.replace(/Aria workflow/g, 'Aria Workspace');
        content = content.replace(/ARIA WORKFLOW/g, 'ARIA WORKSPACE');
        changed = true;
    }
    
    // Also fix the split tags! In App.tsx:
    if (content.match(/ARIA<\/span>\s*<span[^>]*>\s*WORKFLOW/)) {
        content = content.replace(/ARIA<\/span>\s*<span[^>]*>\s*WORKFLOW/g, 'ARIA</span>\n                    <span className="bg-gradient-to-r from-emerald-500 to-indigo-500 bg-clip-text text-transparent font-black tracking-tight italic">\n                      WORKSPACE');
        changed = true;
    }
    if (content.match(/Aria<\/span>\s*<span[^>]*>\s*Workflow/)) {
        content = content.replace(/Aria<\/span>\s*<span[^>]*>\s*Workflow/g, 'Aria</span>\n                  <span className="bg-gradient-to-r from-emerald-500 to-indigo-500 bg-clip-text text-transparent font-black tracking-tight italic">\n                    Workspace');
        changed = true;
    }

    if (content.includes('Aria Workspace Assistant') && content.includes('Aria Workspace Workspace Assistant')) {
       content = content.replace(/Aria Workspace Workspace Assistant/g, 'Aria Workspace Assistant');
       changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
