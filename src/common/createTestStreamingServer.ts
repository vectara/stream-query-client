import { setupServer } from "msw/node";
import { HttpResponse, http } from "msw";
import { DEFAULT_DOMAIN } from "./constants";

export const createTestStreamingServer = ({
  path,
  chunks,
  createChunk,
  shouldRequestsFail
}: {
  path: string;
  chunks: any[];
  createChunk: (value: any) => any;
  shouldRequestsFail?: boolean;
}) => {
  return setupServer(
    http.post(`${DEFAULT_DOMAIN}${path}`, () => {
      if (shouldRequestsFail) {
        return new HttpResponse(null, {
          status: 404,
          statusText: "Not found"
        });
      }

      const stream = new ReadableStream({
        start(controller) {
          chunks.forEach((chunk) => {
            controller.enqueue(createChunk(chunk));
          });

          controller.close();
        }
      });

      // Send the mocked response immediately.
      const response = new Response(stream, {
        headers: {
          "Content-Type": "text/json"
        }
      });

      return response;
    })
  );
};
