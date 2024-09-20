import { SummaryLanguage } from "../common/types";
import { Query } from "./apiTypes";

export type { Query } from "./apiTypes";

export type GenerationConfig = {
  // The preferred prompt to use, if applicable
  generationPresetName?: string;
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

export type Reranker = {type: "none"}
  | { type: "customer_reranker"; rerankerId: string }
  | { type: "mmr"; diversityBias: number }
  | { type: "userfn"; userFunction?: string };

export type StreamQueryConfig = {
  // The customer ID of the Vectara corpora owner.
  customerId: string;

  // The Vectara query API key that has access to the corpora you're querying.
  apiKey?: string;

  // Alternatively specify the JWT token to use for authentication.
  authToken?: string;

  // An optional domain to send the query to. Useful for proxying API requests.
  // Expects specific endpoints to be available at <domain>/v2/query,
  // <domain>/v2/chats/:chatId/turns, and <domain>/v2/chats
  domain?: string;

  // The query to send to the API. This is the user input.
  query: string;

  corpusKey: string;

  search: {
    metadataFilter: string;
    // A number from 0.0 -> 1.0 that determines how much to leverage neural search and keyword search.
    // A value of 0.0 is purely neural search, where a value of 1.0 is purely keyword search.
    // Numbers in between are a combination of the two, leaning one way or another.
    lexicalInterpolation?: number;
    customDimensions?: Record<string, number>;
    semantics?: "default" | "query" | "response";
    offset: number;
    limit?: number;
    contextConfiguration?: {
      charactersBefore?: number;
      charactersAfter?: number;
      // For summary references, this is the number of sentences to include before
      // relevant reference snippets.
      sentencesBefore?: number;
      // For summary references, this is the number of sentences to include after
      // relevant reference snippets.
      sentencesAfter?: number;
      startTag?: string;
      endTag?: string;
    };
    reranker?:
      | { type: "none" }
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
    }
      | {
      type: "userfn";
      userFunction?: string;
    }
      | {
      type: "chain";
      rerankers: Reranker[]
    }
  };

  generation?: GenerationConfig;

  chat?: {
    store?: boolean;
    conversationId?: string;
  };
};

export type StreamQueryRequestHeaders = {
  ["customer-id"]: string;
  ["Content-Type"]: string;
  ["x-api-key"]?: string;
  ["Authorization"]?: string;
};

export type StreamQueryRequest = {
  method: string;
  url: string;
  headers: StreamQueryRequestHeaders;
  body: Query.Body;
};

export type StreamEvent =
  | ErrorEvent
  | SearchResultsEvent
  | ChatInfoEvent
  | GenerationChunkEvent
  | GenerationInfoEvent
  | GenerationEndEvent
  | FactualConsistencyScoreEvent
  | EndEvent
  | UnexpectedEvent
  | RequestErrorEvent
  | GenericErrorEvent
  | UnexpectedErrorEvent;

type BaseEvent = {
  raw?: any;
};

export type ErrorEvent = BaseEvent & {
  type: "error";
  messages: string[];
};

export type SearchResultsEvent = BaseEvent & {
  type: "searchResults";
  searchResults: Query.SearchResult[];
};

export type ChatInfoEvent = BaseEvent & {
  type: "chatInfo";
  chatId: string;
  turnId: string;
};

export type GenerationChunkEvent = BaseEvent & {
  type: "generationChunk";
  updatedText: string;
  generationChunk: string;
};

export type GenerationInfoEvent = BaseEvent & {
  type: "generationInfo";
  renderedPrompt?: string;
  rephrasedQuery?: string;
};

export type GenerationEndEvent = BaseEvent & {
  type: "generationEnd";
};

export type FactualConsistencyScoreEvent = BaseEvent & {
  type: "factualConsistencyScore";
  factualConsistencyScore: number;
};

export type EndEvent = BaseEvent & {
  type: "end";
};

export type UnexpectedEvent = {
  type: "unexpectedEvent";
  rawType: string;
  raw: any;
};

export type RequestErrorEvent = {
  type: "requestError";
  status: number;
  raw: any;
};

export type GenericErrorEvent = {
  type: "genericError";
  error: Error;
};

export type UnexpectedErrorEvent = {
  type: "unexpectedError";
  raw: any;
};

export type StreamEventHandler = (event: StreamEvent) => void;
