export type Summary = {
  prompt?: string;
};

export type Chat = {
  conversationId: string;
  turnId: string;
  // Debug-only
  rephrasedQuery?: string;
};

export type FactualConsistency = {
  score: number;
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
  summary?: {
    chat?: Chat;
    factualConsistency?: FactualConsistency;
    done: boolean;
    text: string;
    // Debug-only
    prompt?: string;
  };
};

export type StreamQueryConfig = {
  filter?: string;

  // The query to send to the API.
  // This is the user input.
  queryValue?: string;

  // The language the summary should be in.
  language?: SummaryLanguage;

  // Reranking orders your search results for increased relevance.
  rerank?: boolean;

  // Specify how many search results to retrieve and rerank.
  rerankNumResults?: number;

  // Which reranker will be used.
  rerankerId?: number;

  // Diversity bias ranges from 0 to 1.
  // 0 will optimize for results that are as closely related to the query as possible.
  // 1 will optimize for results that are as diverse as possible.
  rerankDiversityBias?: number;

  // A number from 0.0 -> 1.0 that determines how much to leverage neural search and keyword search.
  // A value of 0.0 is purely neural search, where a value of 1.0 is purely keyword search.
  // Numbers in between are a combination of the two, leaning one way or another.
  lambda?: number;

  // The number of search results to include in creating the summary
  summaryNumResults?: number;

  // For summary references, this is the number of sentences to include before/after
  // relevant reference snippets.
  summaryNumSentences?: number;

  // The preferred prompt to use, if applicable
  summaryPromptName?: string;

  // Enable the HHEMv2 (based on https://huggingface.co/vectara/hallucination_evaluation_model), also known as factual consistency score
  enableFactualConsistencyScore?: boolean;

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

  // Debugging information (available under Scale plan).
  debug?: boolean;
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
  references?: Array<DeserializedSearchResult>;

  // A concatenation of all text chunks the streaming API has returned so far.
  // Use this when updating your UI text display.
  updatedText?: string;

  // true, if streaming has completed.
  isDone: boolean;

  // Any additional details that apply to the query response.
  details?: {
    summary?: Summary;
    chat?: Chat;
    factualConsistency?: FactualConsistency;
  };
};

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
