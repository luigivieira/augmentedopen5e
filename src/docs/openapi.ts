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
            description: 'Target locale for translation (e.g. "en-us", "pt-br", "es")',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response with the spell data (currently only for en-us)',
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          '202': {
            description:
              'Accepted for translation. Dispatches background job and returns empty body.',
          },
          '400': {
            description: 'Missing required parameters',
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
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      locale: { type: 'string', example: 'en-us' },
                      total: { type: 'integer', example: 319 },
                      cached: { type: 'integer', example: 319 },
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
