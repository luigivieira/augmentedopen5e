#!/usr/bin/env node
/**
 * Deletes all objects from the Azion Edge Storage bucket for a given environment.
 * Uses the Azion CLI (auth via `azion login` credentials).
 *
 * Usage:
 *   node scripts/reset-cache.js staging
 *   node scripts/reset-cache.js production
 */

import { execSync } from 'child_process';

const env = process.argv[2];

if (env !== 'staging' && env !== 'production') {
  console.error('Usage: node scripts/reset-cache.js <staging|production>');
  process.exit(1);
}

const bucketName =
  env === 'production' ? 'augmentedopen5e-prod-bucket' : 'augmentedopen5e-staging-bucket';

function run(cmd) {
  return execSync(cmd, { encoding: 'utf-8' });
}

function listObjects() {
  const output = run(
    `azion list storage object --bucket-name "${bucketName}" --page-size 1000 --format json`,
  );
  const parsed = JSON.parse(output);
  // CLI returns { columns: ["KEY", ...], lines: [[key, date], ...] }
  const lines = parsed.lines ?? [];
  return lines.map((line) => line[0]).filter(Boolean);
}

function deleteObject(key) {
  run(`azion delete storage object --bucket-name "${bucketName}" --object-key "${key}" -y`);
}

const keys = listObjects();

if (keys.length === 0) {
  console.log('Bucket is already empty.');
  process.exit(0);
}

console.log(`Found ${keys.length} object(s) in '${bucketName}'. Deleting...`);

for (const key of keys) {
  deleteObject(key);
  console.log(`  Deleted: ${key}`);
}

console.log('Cache reset complete.');
