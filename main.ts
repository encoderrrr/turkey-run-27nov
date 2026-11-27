// Gobble Run — the hand-in program for make.fun's turkey-run-game-01.
// Node 22, standard library only. It takes the repository beside this file
// (the static game under game/ and its screenshots under screenshots/) and
// writes the entry to the output directory: the same two folders, plus the
// dossier.json the judge reads, built by the vendored make.fun library.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output; inside the
// grader it defaults to /output. The program is deterministic: two runs over
// the same repository write byte-identical output.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The caps the bounty gate enforces, so this program refuses an entry the
// scorer would refuse instead of handing in something invalid.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function fail(message: string): never {
  throw new Error(`gobble-run hand-in: ${message}`);
}

function checkRepository(repoDir: string): void {
  const index = join(repoDir, 'game', 'index.html');
  if (!existsSync(index) || !statSync(index).isFile()) {
    fail('game/index.html is missing — the game cannot be handed in');
  }
  const shotsDir = join(repoDir, 'screenshots');
  if (!existsSync(shotsDir)) fail('screenshots/ is missing');
  const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    fail(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
  }
}

function copyTree(source: string, target: string): void {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function countFiles(dir: string): number {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    total += statSync(path).isDirectory() ? countFiles(path) : 1;
  }
  return total;
}

function main(): void {
  const repoDir = fileURLToPath(new URL('.', import.meta.url));
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

  checkRepository(repoDir);

  mkdirSync(outDir, { recursive: true });
  copyTree(join(repoDir, 'game'), join(outDir, 'game'));
  copyTree(join(repoDir, 'screenshots'), join(outDir, 'screenshots'));

  const dossier = buildDossier(outDir, CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);

  const gameFiles = countFiles(join(outDir, 'game'));
  const shotFiles = countFiles(join(outDir, 'screenshots'));
  console.log(
    `gobble-run hand-in: ${gameFiles} game files, ${shotFiles} screenshots, ` +
      `dossier.json (${dossier.length} bytes) written to ${outDir}`,
  );
}

main();
