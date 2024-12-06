import * as esbuild from 'esbuild';
import { existsSync, readdirSync, readFileSync, rmdirSync, rmSync, statSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

// Get the equivalent of __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
async function build() {
  // Clean dist directory
  if (existsSync('./dist')) {
    rmSync('./dist', { recursive: true });
  }

  // Generate type declarations using tsc
  execSync('tsc -p tsconfig.json --emitDeclarationOnly', { stdio: 'inherit', cwd: projectRoot });
  // Shared esbuild config
  const baseConfig: esbuild.BuildOptions = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    sourcemap: true,
    external: [
      '@aws-sdk/client-secrets-manager',
      'jsonwebtoken'
    ],
    platform: 'node',
    target: 'node20',
  };

  // Build ESM
  await esbuild.build({
    ...baseConfig,
    format: 'esm',
    outfile: 'dist/esm/index.js',
  });

  // Build CJS
  await esbuild.build({
    ...baseConfig,
    format: 'cjs',
    outfile: 'dist/cjs/index.js',
  });

  console.log('Build complete');
  cleanupDeclarationFiles(join(projectRoot, 'dist', 'types'));
}


// Function to remove empty declaration files and directories
function cleanupDeclarationFiles(dir: string): boolean {
  let files: string[];
  try {
      files = readdirSync(dir);
  } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
      return false;
  }
  
  let isEmpty = true;
  
  for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      
      if (stat.isDirectory()) {
          const isSubdirEmpty = cleanupDeclarationFiles(filePath);
          if (isSubdirEmpty) {
              rmdirSync(filePath);
              console.log(`Removed empty directory: ${filePath}`);
          } else {
              isEmpty = false;
          }
      } else if (file.endsWith('.d.ts')) {
          const content = readFileSync(filePath, 'utf-8').trim();
          if (content === 'export {};') {
              unlinkSync(filePath);
              console.log(`Removed empty declaration file: ${filePath}`);
          } else {
              isEmpty = false;
          }
      } else {
          isEmpty = false;
      }
  }
  
  return isEmpty;
}

// Remove empty declaration files

build().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});
