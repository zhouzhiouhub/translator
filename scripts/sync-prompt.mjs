import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(root, "Prompt.txt");
const outputPath = join(root, "src", "lib", "translation", "prompt.generated.ts");
const prompt = await readFile(sourcePath, "utf8");
const output = `// Generated from Prompt.txt by scripts/sync-prompt.mjs.\nexport const TRANSLATION_POLICY = ${JSON.stringify(prompt)};\n`;
await writeFile(outputPath, output, "utf8");
