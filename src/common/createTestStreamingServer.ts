import { setupServer } from "msw/node";
import { http } from "msw";
import { DEFAULT_DOMAIN } from "./constants";

export const createTestStreamingServer = (
  path: string,
  chunks: any[],
  createChunk: (value: any) => any
) => {
  return setupServer(
    http.post(`${DEFAULT_DOMAIN}${path}`, () => {
      const stream = new ReadableStream({
        start(controller) {
          chunks.forEach((chunk) => {
            controller.enqueue(createChunk(chunk));
          });

          controller.close();
        },
      });

      // Send the mocked response immediately.
      const response = new Response(stream, {
        // status: 200,
        headers: {
          "Content-Type": "text/json",
        },
      });

      return response;
    })
  );
};
