import { SetupServerApi } from "msw/node";
import { streamQueryV2 } from "./client";
import { StreamQueryConfig, StreamUpdate } from "./types";
import { createStreamingServer } from "../common/createStreamingServer";
import { chunks } from "../common/client.mocks";

describe("stream-query-client API v2", () => {
  let server: SetupServerApi;

  beforeAll(async () => {
    server = createStreamingServer("/v2/chats", chunks);
    await server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it("streamQuery converts streamed chunks into usable data", async () => {
    const configurationOptions: StreamQueryConfig = {
      customerId: "1366999410",
      apiKey: "zqt_UXrBcnI2UXINZkrv4g1tQPhzj02vfdtqYJIDiA",
      query: "test query",
      search: {
        offset: 0,
        corpora: [
          {
            corpusKey: "1",
            metadataFilter: "",
          },
        ],
        limit: 5,
      },
      generation: {
        maxUsedSearchResults: 5,
        responseLanguage: "eng",
        enableFactualConsistencyScore: true,
        promptName: "vectara-experimental-summary-ext-2023-12-11-large",
      },
      chat: {
        store: true,
      },
    };

    const handleUpdate = jest.fn();

    const onStreamUpdate = (update: StreamUpdate) => {
      handleUpdate(update);
    };

    await streamQueryV2(configurationOptions, onStreamUpdate);

    expect(handleUpdate).toHaveBeenNthCalledWith(1, {
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
            metadata: [{ name: "url", value: "https://vectara.com" }],
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
      details: {},
      isDone: false,
    });

    expect(handleUpdate).toHaveBeenNthCalledWith(2, {
      responseSet: undefined,
      details: {
        chat: {
          conversationId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
          turnId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
        },
      },
      updatedText: "The completed summary.",
      isDone: false,
    });

    expect(handleUpdate).toHaveBeenNthCalledWith(3, {
      responseSet: undefined,
      details: {
        chat: {
          conversationId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
          turnId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
        },
      },
      updatedText: "The completed summary.",
      isDone: true,
    });

    expect(handleUpdate).toHaveBeenNthCalledWith(4, {
      responseSet: undefined,
      details: {
        chat: {
          conversationId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
          turnId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
        },
        factualConsistency: { score: 0.81162083 },
      },
      updatedText: "The completed summary.",
      isDone: true,
    });
  });
});
