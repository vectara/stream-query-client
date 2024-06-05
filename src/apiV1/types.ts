import { BaseStreamQueryConfig } from "../common/types";

export type StreamQueryConfig = BaseStreamQueryConfig & {
  // IDs of Vectara corpora to include in the query
  corpusIds: Array<string>;

  // Debugging information (available under Scale plan).
  debug?: boolean;
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
    // Provided only when debug: true
    prompt?: string;
  };
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
