const fs = require('fs');

const filesToPatch = [
  "actions/assessment.ts",
  "actions/course.ts",
  "actions/enrollment.ts",
  "actions/learning.ts"
];

for (const file of filesToPatch) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace import
  content = content.replace(/import\s*\{\s*([^}]*)revalidateTag([^}]*)\s*\}\s*from\s*"next\/cache"/, (match, p1, p2) => {
    // p1 could be `revalidatePath, `
    let newImport = `import { ${p1}updateTag${p2} } from "next/cache"`;
    // Clean up commas if it was the only one
    return newImport;
  });

  // Replace revalidateTag(..., "max") with updateTag(...)
  content = content.replace(/revalidateTag\(([^,]+),\s*"max"\)/g, 'updateTag($1)');
  
  // Fallback in case "max" isn't there
  content = content.replace(/revalidateTag\(([^,]+)\)/g, 'updateTag($1)');

  fs.writeFileSync(file, content);
  console.log(`Patched ${file}`);
}
