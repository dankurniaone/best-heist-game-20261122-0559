// The Marlowe Job — the entry point (Node 22, standard library only).
// It hands the game in: copies game/ and screenshots/ from beside this
// file into the output directory and writes dossier.json there with the
// vendored make.fun library. It writes the same bytes on every run, so
// the grader's two runs agree.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
  mkdirSync(outDir, { recursive: true });

  const gameSrc = join(repoRoot, 'game');
  const gameDst = join(outDir, 'game');
  cpSync(gameSrc, gameDst, { recursive: true });

  const shotsSrc = join(repoRoot, 'screenshots');
  const shotsDst = join(outDir, 'screenshots');
  mkdirSync(shotsDst, { recursive: true });
  if (existsSync(shotsSrc)) {
    cpSync(shotsSrc, shotsDst, { recursive: true });
  }
  const shots = readdirSync(shotsDst).filter((n) => !n.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`screenshots/: holds ${shots.length} images, the bounty wants 3 or 4`);
  }

  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  return { shots, dossierBytes: dossier.length };
}

const done = handIn();
console.log(`handed in ${done.shots.length} screenshots, dossier ${done.dossierBytes} bytes -> ${outDir}`);
