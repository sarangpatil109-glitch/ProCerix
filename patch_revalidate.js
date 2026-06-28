const fs = require('fs');

const filesToPatch = [
  "actions/assessment.ts",
  "actions/course.ts",
  "actions/enrollment.ts",
  "actions/learning.ts"
];

for (const file of filesToPatch) {
  let content = fs.readFileSync(file, 'utf-8');
  // replace `revalidateTag(something)` with `revalidateTag(something, "max")`
  // careful: it could be `revalidateTag("attempts")` or `revalidateTag(\`attempts-\${id}\`)`
  // We use regex: revalidateTag\(([^,]+)\) -> revalidateTag($1, "max")
  content = content.replace(/revalidateTag\(([^,]+)\)/g, 'revalidateTag($1, "max")');
  fs.writeFileSync(file, content);
  console.log(`Patched ${file}`);
}
