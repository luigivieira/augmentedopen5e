// src/types/azion.d.ts

/**
 * Type definitions for Azion Edge Functions global built-ins.
 * Specifically declaring the Azion object used for AI Inference and other Edge services.
 */

declare global {
  var Azion: {
    AI: {
      /**
       * Runs an AI inference request using an Azion-supported model.
       * @param model - The model identifier (e.g., 'Llama-3-8B-Instruct')
       * @param options - Options including the message history and behavior flags.
       * @returns The assistant's response object.
       */
      run(
        model: string,
        options: {
          messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
          stream?: boolean;
          [key: string]: unknown;
        },
      ): Promise<{
        response: string;
      }>;
    };
    Storage: {
      get(bucket: string, key: string): Promise<{ body: ReadableStream | string | null } | null>;
      put(bucket: string, key: string, value: string): Promise<void>;
    };
    env?: {
      get(key: string): string | undefined;
    };
  };
}

export {}; // Ensure it is treated as a module augmenting the global scope.
