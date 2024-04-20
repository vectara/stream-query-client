// Search results.
const chunk1 = {
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
};

// Summary.
const chunk2 = {
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
};

// Summary is done.
const chunk3 = {
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
        rephrasedQuery:
          "The rephrased query is provided when the streamed response is done.",
        status: null,
      },
      factualConsistency: null,
      done: true,
      status: [],
      futureId: 2,
    },
    status: [],
  },
};

// FCS.
const chunk4 = {
  result: {
    batchQueryResponse: null,
    responseSet: null,
    summary: {
      text: "",
      lang: "eng",
      prompt: "The prompt is provided at the very end for some reason.",
      chat: {
        conversationId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
        turnId: "d79ebe27-cd87-4465-a245-a3dc092ec681",
        rephrasedQuery:
          "The rephrased query is provided when the streamed response is done.",
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
};

export const chunks = [chunk1, chunk2, chunk3, chunk4];
