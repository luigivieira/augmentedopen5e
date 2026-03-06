export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'AugmentedOpen5e API',
    version: '1.0.0',
    description: 'API for fetching and translating D&D 5e SRD content using Edge Functions.',
  },
  servers: [
    {
      url: '/',
      description: 'Current Environment',
    },
  ],
  paths: {
    '/api/spell': {
      get: {
        summary: 'Get a single spell',
        description: 'Retrieve a single D&D 5e spell by slug and locale.',
        parameters: [
          {
            name: 'slug',
            in: 'query',
            description: 'Exact spell slug to match (e.g. "fireball")',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'locale',
            in: 'query',
            description:
              'Target locale for the response. **Must follow the `language-region` format** (e.g. `en-us`, `pt-br`, `es-es`). ' +
              'Single-language codes such as `pt` or `en` are not accepted.',
            required: true,
            schema: {
              type: 'string',
              pattern: '^[a-z]{2}-[a-z]{2}$',
              example: 'pt-br',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Spell data returned from cache (for the exact requested locale).',
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          '202': {
            description:
              'Translation accepted. A background job has been dispatched (or is already running). ' +
              'Retry the same request in a few seconds to receive the translated result.',
          },
          '400': {
            description: 'Missing or invalid parameters (e.g. locale not in `xx-xx` format).',
          },
        },
      },
    },
    '/api/spells': {
      get: {
        summary: 'Get spells status and discovery',
        description: 'Returns the sync status and available slugs for specific locales.',
        parameters: [
          {
            name: 'locale',
            in: 'query',
            description: 'Optional target locale to check status for',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response. Returns one entry per known locale.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      locale: { type: 'string', example: 'pt-br' },
                      cached: { type: 'integer', example: 12 },
                      spells: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['fireball', 'acid-arrow'],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
