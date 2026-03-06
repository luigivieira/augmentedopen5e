import { defineConfig } from 'azion';

const isStaging = process.env.AZION_ENV === 'staging';
const envName = isStaging ? 'augmentedopen5e-staging' : 'augmentedopen5e-prod';

export default defineConfig({
  storage: [
    {
      name: `${envName}-bucket`,
      dir: `${envName}-bucket`,
      prefix: '',
      workloadsAccess: 'read_write' as const,
    },
  ],
  build: {
    entry: ['index.ts'],
    preset: 'typescript',
    polyfills: true,
  },
  functions: [
    {
      name: `${envName}-function`,
      path: './functions/index.js',
    },
  ],
  applications: [
    {
      name: `${envName}-app`,
      rules: {
        request: [
          {
            name: 'Execute Function',
            description: 'Execute function for all requests',
            active: true,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'matches',
                  argument: '^/',
                },
              ],
            ],
            behaviors: [
              {
                type: 'run_function',
                attributes: {
                  value: `${envName}-function`,
                },
              },
            ],
          },
        ],
      },
      functionsInstances: [
        {
          name: `${envName}-function`,
          ref: `${envName}-function`,
        },
      ],
    },
  ],
  workloads: [
    {
      name: `${envName}-workload`,
      active: true,
      infrastructure: 1,
      deployments: [
        {
          name: `${envName}-deployment`,
          current: true,
          active: true,
          strategy: {
            type: 'default',
            attributes: {
              application: `${envName}-app`,
            },
          },
        },
      ],
    },
  ],
});
