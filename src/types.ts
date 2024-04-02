export type Chat = {
  conversationId: string;
  turnId: string;
};

export type DeserializedSearchResult = {
  id: string;
  snippet: {
    pre: string;
    text: string;
    post: string;
  };
  source: string;
  url?: string;
  title?: string;
  metadata: Record<string, unknown>;
};

// A subset of the Vectara query response, in parsed form.
// This types only data relevant to stream processing
export type ParsedResult = {
  responseSet: {
    document: Array<{
      id: string;
      metadata: Array<DocMetadata>;
    }>;
    response: Array<{
      corpusKey: { corpusId: number };
      documentIndex: number;
      score: number;
      text: string;
    }>;
  };
  summary: {
    chat: Chat;
    done: boolean;
    text: string;
  };
};

export type StreamQueryConfig = {
  filter?: string;

  // The query to send to the API.
  // This is the user input.
  queryValue?: string;

  // The language the summary should be in.
  language?: SummaryLanguage;

  rerank?: boolean;
  rerankNumResults?: number;
  rerankerId?: number;
  rerankDiversityBias?: number;

  hybridNumWords: number;
  hybridLambdaShort?: number;
  hybridLambdaLong?: number;

  // The number of search results to include in creating the summary
  summaryNumResults?: number;

  // For summary references, this is the number of sentences to include before/after
  // relevant reference snippets.
  summaryNumSentences?: number;

  // The preferred prompt to use, if applicable
  summaryPromptName?: string;

  // The customer ID of the Vectara corpora owner
  customerId: string;

  // IDs of Vectara corpora to include in the query
  corpusIds: Array<string>;

  // The Vectara query API key for provided corpus IDs
  apiKey: string;

  // An optional endpoint to send the query to.
  // Used if proxying the Vectara API URL behind a custom server.
  endpoint?: string;

  // Chat configuration.
  chat?: ChatConfig;
};

type ChatConfig = {
  // true, if this query is a chat query
  store: boolean;

  // A string representing an existing chat conversation.
  // Provide this to maintain the context of a previous conversation.
  conversationId?: string;
};

export type StreamUpdate = {
  // A list of references that apply to the query response.
  references: Array<DeserializedSearchResult> | null;

  // A concatenation of all text chunks the streaming API has returned so far.
  // Use this when updating your UI text display.
  updatedText: string | null;

  // true, if streaming has completed.
  isDone: boolean;

  // Any additional that apply the query response.
  detail: StreamUpdateDetail;
};

type StreamUpdateDetail = {
  // The category of the accompanying data, specified for easy parsing.
  // This will be expanded upon as more types of details are available.
  type: "chat";
  data: Chat;
} | null;

export type StreamUpdateHandler = (update: StreamUpdate) => void;

export type SearchResponse = {
  document: Array<SearchResponseDoc>;
  response: Array<SearchResponseResult>;
  summary: Array<SearchResponseSummary>;
};

type SearchResponseDoc = {
  id: string;
  metadata: Array<DocMetadata>;
};

type SearchResponseResult = {
  corpusKey: {
    corpusId: string;
    customerId: string;
    dim: string[];
  };
  documentIndex: string;
  resultLength: number;
  resultOffset: number;
  score: number;
  text: string;
};

type SearchResponseSummary = {
  text?: string;
  status?: string;
};

export type DocMetadata = {
  name: string;
  value: string;
};

const SUMMARY_LANGUAGES = [
  "auto",
  "eng",
  "deu",
  "fra",
  "zho",
  "kor",
  "ara",
  "rus",
  "tha",
  "nld",
  "ita",
  "por",
  "spa",
  "jpn",
  "pol",
  "tur",
  "heb",
  "vie",
  "ind",
  "ces",
  "ukr",
  "ell",
  "fas",
  "hin",
  "urd",
  "swe",
  "ben",
  "msa",
  "ron",
] as const;

export type SummaryLanguage = (typeof SUMMARY_LANGUAGES)[number];
