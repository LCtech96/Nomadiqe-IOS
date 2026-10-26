/** Minimal Deno globals for the Expo workspace TypeScript checker. */
declare namespace Deno {
  function serve(
    handler: (request: Request) => Response | Promise<Response>
  ): void;

  namespace env {
    function get(key: string): string | undefined;
  }
}
