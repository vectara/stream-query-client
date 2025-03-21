import { SetupServerApi } from "msw/node";
import { streamQueryV2 } from "./client";
import { StreamQueryConfig, StreamEvent, GenericErrorEvent } from "./types";
import { createTestStreamingServer } from "../common/createTestStreamingServer";
import { chunks } from "./client.mocks";

const encoder = new TextEncoder();

const streamQueryConfig: StreamQueryConfig = {
  customerId: "1366999410",
  apiKey: "zqt_UXrBcnI2UXINZkrv4g1tQPhzj02vfdtqYJIDiA",
  corpusKey: "1",
  query: "test query",
  search: {
    offset: 0,
    limit: 5,
    metadataFilter: ""
  },
  generation: {
    maxUsedSearchResults: 5,
    responseLanguage: "eng",
    enableFactualConsistencyScore: true,
    generationPresetName: "vectara-experimental-summary-ext-2023-12-11-large"
  },
  chat: {
    store: true
  }
};

describe("stream-query-client API v2", () => {
  let server: SetupServerApi;

  describe("happy path", () => {
    beforeAll(async () => {
      server = createTestStreamingServer({
        path: "/v2/chats",
        chunks,
        createChunk: (value: any) => {
          return encoder.encode(value);
        }
      });
      await server.listen();
    });

    afterEach(() => {
      server.resetHandlers();
    });

    afterAll(() => {
      server.close();
    });

    it("streamQuery converts streamed chunks into usable data", async () => {
      const handleEvent = jest.fn();

      const onStreamEvent = (event: StreamEvent) => {
        handleEvent(event);

        if (event.type === "end") {
          expect(handleEvent).toHaveBeenNthCalledWith(1, {
            type: "searchResults",
            searchResults: [
              {
                text: "(If you're not a Markdown Here user, check out the Markdown Cheatsheet that is not specific to MDH. But, really, you should also use Markdown Here, because it's awesome. http://markdown-here.com)",
                score: 0.7467775344848633,
                document_metadata: {
                  "Application-Name": "Microsoft Word 12.0.0",
                  "Application-Version": 12,
                  "Character Count": 475,
                  "Character-Count-With-Spaces": 583,
                  "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  "Creation-Date": "2021-02-25T10:03:47Z",
                  "Last-Modified": "2021-02-25T10:03:47Z",
                  "Last-Save-Date": "2021-02-25T10:03:47Z",
                  "Line-Count": 12,
                  "Page-Count": 1,
                  "Paragraph-Count": 8,
                  Template: "Normal.dotm",
                  "Total-Time": 6,
                  "Word-Count": 83,
                  "X-Parsed-By": "org.apache.tika.parser.microsoft.ooxml.OOXMLParser",
                  date: "2021-02-25T10:03:47Z",
                  "dcterms:created": "2021-02-25T10:03:47Z",
                  "dcterms:modified": "2021-02-25T10:03:47Z",
                  "extended-properties:AppVersion": 12,
                  "extended-properties:Application": "Microsoft Word 12.0.0",
                  "extended-properties:DocSecurityString": "None",
                  "extended-properties:Template": "Normal.dotm",
                  "extended-properties:TotalTime": 6,
                  "meta:character-count": 475,
                  "meta:character-count-with-spaces": 583,
                  "meta:creation-date": "2021-02-25T10:03:47Z",
                  "meta:line-count": 12,
                  "meta:page-count": 1,
                  "meta:paragraph-count": 8,
                  "meta:save-date": "2021-02-25T10:03:47Z",
                  "meta:word-count": 83,
                  modified: "2021-02-25T10:03:47Z",
                  "xmpTPg:NPages": 1
                },
                part_metadata: {
                  lang: "eng",
                  len: 25,
                  offset: 648
                },
                document_id: "914e8885-1a65-4b56-a279-95661b264f3b"
              }
            ]
          });

          expect(handleEvent).toHaveBeenNthCalledWith(2, {
            type: "chatInfo",
            chatId: "cht_74b5a5f3-1f51-4427-a317-f62efb493928",
            turnId: "trn_74b5a5f3-1f51-4427-a317-f62efb493928"
          });

          expect(handleEvent).toHaveBeenNthCalledWith(3, {
            type: "generationChunk",
            generationChunk: "Markdown is ",
            updatedText: "Markdown is "
          });

          expect(handleEvent).toHaveBeenNthCalledWith(4, {
            type: "generationInfo",
            renderedPrompt: "Rendered prompt",
            rephrasedQuery: "Rephrased query"
          });

          expect(handleEvent).toHaveBeenNthCalledWith(5, {
            type: "factualConsistencyScore",
            factualConsistencyScore: 0.41796625
          });

          expect(handleEvent).toHaveBeenNthCalledWith(6, { type: "end" });
        }
      };

      await streamQueryV2({ streamQueryConfig, onStreamEvent });
    });

    it("surfaces response headers", async () => {
      const { responseHeaders } = await streamQueryV2({
        streamQueryConfig,
        onStreamEvent: jest.fn()
      });
      expect(responseHeaders?.get("Content-Type")).toBe("text/json");
    });

    it("surfaces response status", async () => {
      const { status } = await streamQueryV2({
        streamQueryConfig,
        onStreamEvent: jest.fn()
      });
      expect(status).toBe(200);
    });
  });

  describe("unhappy path", () => {
    beforeAll(async () => {
      server = createTestStreamingServer({
        path: "/v2/chats",
        chunks,
        createChunk: (value: any) => {
          return encoder.encode(value);
        },
        shouldRequestsFail: true
      });
      await server.listen();
    });

    afterEach(() => {
      server.resetHandlers();
    });

    afterAll(() => {
      server.close();
    });

    it("surfaces HTTP errors", async () => {
      const onStreamEvent = (event: StreamEvent) => {
        expect(event).toEqual({
          type: "genericError",
          error: new Error("Request failed (404)")
        });

        // Make assertion against cause separately because Jest doesn't compare Error objects well.
        expect((event as GenericErrorEvent).error.cause).toBe(JSON.stringify({ message: "Resource not found" }));
      };

      await streamQueryV2({ streamQueryConfig, onStreamEvent });
    });
  });
});
