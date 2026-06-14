import { readFile } from 'node:fs/promises';

const html = await readFile('index.html', 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1].trim())
  .filter(Boolean);

for (const [index, script] of scripts.entries()) {
  try {
    new Function(script);
  } catch (error) {
    console.error(`index.html inline script #${index + 1} has a syntax error.`);
    throw error;
  }
}

console.log(`Checked ${scripts.length} inline script block(s).`);
