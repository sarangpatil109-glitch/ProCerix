const fs = require('fs');

const filesToPatch = [
  "actions/assessment.ts",
  "actions/course.ts",
  "actions/enrollment.ts",
  "actions/learning.ts"
];

for (const file of filesToPatch) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace import
  content = content.replace(/import\s*\{\s*([^}]*)updateTag([^}]*)\s*\}\s*from\s*"next\/cache"/g, (match, p1, p2) => {
    return `import { ${p1}revalidateTag${p2} } from "next/cache"`;
  });

  // Replace updateTag(...) with revalidateTag(..., "default")
  content = content.replace(/updateTag\(([^)]+)\)/g, 'revalidateTag($1, "default")');

  fs.writeFileSync(file, content);
  console.log(`Patched ${file}`);
}
