import { server } from "./mocks/server";
import { streamQuery, StreamUpdate, StreamQueryConfig } from "./index";

describe("stream-query-client", () => {
  beforeAll(async () => {
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
      // Required fields.
      customerId: "1366999410",
      corpusIds: ["1"],
      apiKey: "zqt_UXrBcnI2UXINZkrv4g1tQPhzj02vfdtqYJIDiA",

      // Optional fields.
      queryValue: "test query",
      summaryNumResults: 5,
      language: "eng",
      chat: {
        store: true,
      },
      debug: false,
      enableFactualConsistencyScore: true,
      summaryPromptName: "vectara-experimental-summary-ext-2023-12-11-large",
    };

    const handleUpdate = jest.fn();

    const onStreamUpdate = (update: StreamUpdate) => {
      handleUpdate(update);
    };

    await streamQuery(configurationOptions, onStreamUpdate);

    expect(handleUpdate).toHaveBeenNthCalledWith(1, {
      references: [
        {
          id: "document-id",
          snippet: {
            post: "",
            pre: "",
            text: "A text result",
          },
          source: undefined,
          url: "https://vectara.com",
          title: "Untitled",
          metadata: {
            url: "https://vectara.com",
          },
        },
      ],
      details: {},
      updatedText: undefined,
      isDone: false,
    });

    expect(handleUpdate).toHaveBeenNthCalledWith(2, {
      references: undefined,
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
      references: undefined,
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
      references: undefined,
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
