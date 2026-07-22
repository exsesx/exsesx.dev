import { remark } from "remark";
import remarkConfig from "../.remarkrc.mjs";

const projectRoot = Bun.resolveSync("../package.json", import.meta.dir).replace(/[/\\]package\.json$/, "");
const processor = remark().use(remarkConfig);
const files = [
  ...new Bun.Glob("src/content/**/*.mdx").scanSync({
    cwd: projectRoot,
    absolute: true,
  }),
].sort();
const unformatted: string[] = [];

for (const filePath of files) {
  const source = await Bun.file(filePath).text();
  const formatted = String(await processor.process({ path: filePath, value: source }));

  if (source !== formatted) {
    unformatted.push(filePath.slice(projectRoot.length + 1));
  }
}

if (unformatted.length > 0) {
  console.error(`MDX formatting check failed:\n${unformatted.map(file => `- ${file}`).join("\n")}`);
  console.error("\nRun `bun run mdx:format` to fix them.");
  process.exit(1);
}

console.log(`Checked ${files.length} MDX file${files.length === 1 ? "" : "s"}.`);
