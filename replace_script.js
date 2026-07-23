const fs = require('fs');
const glob = require('glob'); // Not available? I can use fs.readdirSync recursively.
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

    // workspace_eazy_keep_cache -> aria_workflow_keep_cache
    if (content.includes('workspace_eazy_keep_cache')) {
        content = content.replace(/workspace_eazy_keep_cache/g, 'aria_workflow_keep_cache');
        changed = true;
    }

    if (content.includes('workspaceeazy.com')) {
        content = content.replace(/workspaceeazy.com/g, 'ariaworkflow.com');
        changed = true;
    }

    if (content.includes('Workspace Eazy') || content.includes('Workspace eazy') || content.includes('WORKSPACE EAZY') || content.includes('EAZY')) {
        content = content.replace(/Workspace Eazy/g, 'Aria Workflow');
        content = content.replace(/Workspace eazy/g, 'Aria workflow');
        content = content.replace(/WORKSPACE EAZY/g, 'ARIA WORKFLOW');
        
        // App.tsx splits WORKSPACE EAZY across spans, let's just let it be, but wait!
        content = content.replace(/WORKSPACE<\/span>\s*<span[^>]*>\s*EAZY/g, 'ARIA</span>\n                    <span className="bg-gradient-to-r from-emerald-500 to-indigo-500 bg-clip-text text-transparent font-black tracking-tight italic">\n                      WORKFLOW');
        content = content.replace(/Workspace<\/span>\s*<span[^>]*>\s*Eazy/g, 'Aria</span>\n                  <span className="bg-gradient-to-r from-emerald-500 to-indigo-500 bg-clip-text text-transparent font-black tracking-tight italic">\n                    Workflow');
        
        changed = true;
    }
    
    if (content.includes('Aria Assistant') || content.includes('Aria assistant') || content.includes('Aria assistant')) {
         content = content.replace(/Aria Assistant/g, 'Aria Workflow Assistant');
         content = content.replace(/Aria assistant/g, 'Aria Workflow assistant');
         changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
