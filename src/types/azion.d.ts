// src/types/azion.d.ts

/**
 * Type definitions for Azion Edge Functions global built-ins.
 */

declare global {
  var Azion: {
    Storage: {
      new (bucket: string): {
        get(key: string): Promise<{
          arrayBuffer(): Promise<ArrayBuffer>;
          body?: ReadableStream | string | null;
          text?(): Promise<string>;
        } | null>;
        put(
          key: string,
          value: string | Uint8Array | Blob | ReadableStream,
          options?: { [key: string]: string | number },
        ): Promise<void>;
      };
    };
    env?: {
      get(key: string): string | undefined;
    };
  };
}

export {}; // Ensure it is treated as a module augmenting the global scope.
