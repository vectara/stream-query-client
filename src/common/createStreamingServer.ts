import { setupServer } from "msw/node";
import { http } from "msw";

const encoder = new TextEncoder();

const createChunk = (json: any) => {
  return encoder.encode(JSON.stringify(json));
};

export const createStreamingServer = (path: string, chunks: any[]) => {
  return setupServer(
    http.post(`https://api.vectara.io${path}`, () => {
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
