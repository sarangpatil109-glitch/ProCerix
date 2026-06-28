const fs = require('fs');

const filesToPatch = [
  "app/admin/courses/[id]/page.tsx",
  "app/admin/prompts/[id]/page.tsx",
  "app/course/[slug]/page.tsx",
  "app/dashboard/product/linkedin/[id]/page.tsx",
  "app/dashboard/product/resume/[id]/page.tsx",
  "app/dashboard/product/[productType]/page.tsx",
  "app/learn/[slug]/layout.tsx",
  "app/learn/[slug]/page.tsx",
  "app/learn/[slug]/[lessonId]/page.tsx",
  "app/verify/[credentialId]/page.tsx",
  "app/[productSlug]/page.tsx"
];

let filesModified = 0;

for (const file of filesToPatch) {
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    continue;
  }
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  // Regex for `({ params }: { params: { ... } })`
  // E.g., `({ params }: { params: { id: string } })`
  // We want to replace it with `(props: { params: Promise<{ id: string }> })`
  content = content.replace(/\{ params \}: \{ params: \{ ([^}]+) \} \}/g, "props: { params: Promise<{ $1 }> }");

  // For app/learn/[slug]/layout.tsx which spans multiple lines:
  //   params, 
  //   children 
  // }: { 
  //   params: { slug: string }; 
  //   children: ReactNode;
  // }) {
  content = content.replace(
    /\{\s*params,\s*children\s*\}:\s*\{\s*params:\s*\{\s*([^}]+)\s*\};\s*children:\s*ReactNode;\s*\}/g,
    "props: { params: Promise<{ $1 }>; children: ReactNode }"
  );
  
  content = content.replace(
    /export default async function LearnLayout\(props: \{ params: Promise<\{ slug: string \}>; children: ReactNode \}\) \{/,
    "export default async function LearnLayout(props: { params: Promise<{ slug: string }>; children: ReactNode }) {\n  const params = await props.params;\n  const children = props.children;"
  );

  // Inject `const params = await props.params;` into single line exports
  content = content.replace(/export (default )?async function ([a-zA-Z0-9_]+)\(props: \{ params: Promise<\{ ([^}]+) \}> \}\)(?:: Promise<Metadata>)? \{/g, (match) => {
    return `${match}\n  const params = await props.params;`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Patched ${file}`);
    filesModified++;
  } else {
    console.log(`No changes made to ${file}`);
  }
}

console.log(`Successfully patched ${filesModified} files.`);
