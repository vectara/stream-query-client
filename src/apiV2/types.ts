import { SummaryLanguage } from "../common/types";

export type GenerationConfig = {
  // The preferred prompt to use, if applicable
  promptName?: string;
  // The number of search results to include in creating the summary
  maxUsedSearchResults?: number;
  // Custom prompt for summarization.
  promptText?: string;
  maxResponseCharacters?: number;
  // The language the summary should be in.
  responseLanguage?: SummaryLanguage;
  modelParameters?: {
    maxTokens: number;
    temperature: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  citations?:
    | {
        style: "none" | "numeric";
      }
    | {
        style: "html" | "markdown";
        urlPattern: string;
        textPattern: string;
      };
  enableFactualConsistencyScore?: boolean;
};

export type StreamQueryConfig = {
  // The customer ID of the Vectara corpora owner.
  customerId: string;

  // The Vectara query API key that has access to the corpora you're querying.
  apiKey: string;

  // An optional endpoint to send the query to.
  // Used if proxying the Vectara API URL behind a custom server.
  endpoint?: string;

  // The query to send to the API. This is the user input.
  query: string;

  search: {
    offset: number;
    corpora: Array<{
      corpusKey: string;
      metadataFilter: string;
      // A number from 0.0 -> 1.0 that determines how much to leverage neural search and keyword search.
      // A value of 0.0 is purely neural search, where a value of 1.0 is purely keyword search.
      // Numbers in between are a combination of the two, leaning one way or another.
      lexicalInterpolation?: number;
      customDimensions?: Array<{ name: string; weight: number }>;
      semantics?: "default" | "query" | "response";
    }>;
    limit?: number;
    contextConfiguration?: {
      charactersBefore?: number;
      charactersAfter?: number;
      // For summary references, this is the number of sentences to include before/after
      // relevant reference snippets.
      sentencesBefore?: number;
      // For summary references, this is the number of sentences to include before/after
      // relevant reference snippets.
      sentencesAfter?: number;
      startTag?: string;
      endTag?: string;
    };
    reranker?:
      | {
          type: "customer_reranker";
          rerankerId: string;
        }
      | {
          type: "mmr";
          // Diversity bias ranges from 0 to 1.
          // 0 will optimize for results that are as closely related to the query as possible.
          // 1 will optimize for results that are as diverse as possible.
          diversityBias: number;
        };
  };

  generation?: GenerationConfig;

  chat?: {
    store?: boolean;
    conversationId?: string;
  };
};

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
    // Provided only when debug: true
    prompt?: string;
  };
};

export type StreamUpdate = {
  // A list of references that apply to the query response.
  responseSet?: ParsedResult["responseSet"];

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
