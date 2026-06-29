const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const adminDir = path.join(__dirname, 'app', 'admin');
const files = walk(adminDir);

let changed = 0;
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    content = content.replace(
        /import\s+\{\s*createClient\s*\}\s+from\s+["']@\/lib\/supabase\/server["'];?/g,
        'import { createAdminClient } from "@/lib/supabase/admin";'
    );
    content = content.replace(
        /const\s+supabase\s*=\s*await\s+createClient\(\);?/g,
        'const supabase = createAdminClient();'
    );
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Patched', file);
        changed++;
    }
}
console.log('Patched ' + changed + ' files.');
