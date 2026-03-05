#!/usr/bin/env node
/**
 * Generates bootstrap azion/{env}/azion.json files.
 * Used by new contributors to initialize their local environment
 * with the correct structure before their first deploy.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';

const envs = ['staging', 'production'];
const baseName = 'augmentedopen5e';

console.log('🔄 Resetting Azion state files...');

envs.forEach((env) => {
  const configPath = `azion/${env}/azion.json`;

  mkdirSync(dirname(configPath), { recursive: true });
  const bootstrap = {
    name: baseName,
    bucket: '',
    preset: 'typescript',
    env,
    prefix: '',
    'rotate-prefix': false,
    function: [],
    application: { id: 0, name: '' },
    domain: { id: 0, name: '__DEFAULT__', domain_name: '', url: '' },
    'rt-purge': { purge_on_publish: true },
    origin: null,
    'rules-engine': { created: false, rules: [] },
    'cache-settings': null,
    workloads: null,
    connectors: null,
  };

  writeFileSync(configPath, JSON.stringify(bootstrap, null, 2));
  console.log(`✅ Reset ${configPath}`);
});

console.log('✨ Azion state reset complete.');
