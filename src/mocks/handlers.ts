import { http } from "msw";

const encoder = new TextEncoder();

const createChunk = (json: any) => {
  return encoder.encode(JSON.stringify(json));
};

export const handlers = [
  http.post("https://api.vectara.io/v1/stream-query", () => {
    const stream = new ReadableStream({
      start(controller) {
        // First chunk: search results.
        controller.enqueue(
          createChunk({
            result: {
              batchQueryResponse: null,
              responseSet: {
                response: [
                  {
                    text: "A text result",
                    score: 0.9216207,
                    metadata: [
                      { name: "lang", value: "eng" },
                      { name: "offset", value: "1300" },
                      { name: "len", value: "56" },
                    ],
                    documentIndex: 0,
                    corpusKey: {
                      customerId: 0,
                      corpusId: 1,
                      semantics: "DEFAULT",
                      dim: [],
                      metadataFilter: "",
                      lexicalInterpolationConfig: null,
                    },
                    resultOffset: 227,
                    resultLength: 56,
                  },
                ],
                status: [],
                document: [
                  {
                    id: "document-id",
                    metadata: [
                      {
                        name: "url",
                        value: "https://vectara.com",
                      },
                    ],
                  },
                ],
                summary: [
                  {
                    text: "",
                    lang: "",
                    prompt: "",
                    chat: null,
                    factualConsistency: null,
                    done: false,
                    status: [],
                    futureId: 2,
                  },
                ],
                futureId: 1,
              },
              summary: null,
              status: [],
            },
          })
        );

        // Second chunk: summary.
        controller.enqueue(
          createChunk({
            result: {
              batchQueryResponse: null,
              responseSet: null,
              summary: {
                text: "The completed summary.",
                lang: "eng",
                prompt: "",
                chat: {
                  conversationId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
                  turnId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
                  rephrasedQuery: "",
                  status: null,
                },
                factualConsistency: null,
                done: false,
                status: [],
                futureId: 2,
              },
              status: [],
            },
          })
        );

        // Third chunk: summary is done.
        controller.enqueue(
          createChunk({
            result: {
              batchQueryResponse: null,
              responseSet: null,
              summary: {
                text: "",
                lang: "eng",
                prompt: "",
                chat: {
                  conversationId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
                  turnId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
                  rephrasedQuery: "",
                  status: null,
                },
                factualConsistency: null,
                done: true,
                status: [],
                futureId: 2,
              },
              status: [],
            },
          })
        );

        // Fourth chunk: FCS.
        controller.enqueue(
          createChunk({
            result: {
              batchQueryResponse: null,
              responseSet: null,
              summary: {
                text: "",
                lang: "eng",
                prompt: "",
                chat: {
                  conversationId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
                  turnId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
                  rephrasedQuery: "",
                  status: null,
                },
                factualConsistency: {
                  score: 0.81162083,
                  status: { code: "OK", statusDetail: "", cause: null },
                },
                done: true,
                status: [],
                futureId: 2,
              },
              status: [],
            },
          })
        );

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

    console.log("status", response.status);

    return response;
  }),
];
