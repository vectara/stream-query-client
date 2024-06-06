import { setupServer } from "msw/node";
import { http } from "msw";
import { DEFAULT_DOMAIN } from "./constants";

const encoder = new TextEncoder();

const createChunk = (json: any) => {
  return encoder.encode(JSON.stringify(json));
};

export const createTestStreamingServer = (path: string, chunks: any[]) => {
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
