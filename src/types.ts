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

export type StreamUpdateHandler = (update: StreamUpdate) => void;

export type StreamUpdate = {
  references: Array<DeserializedSearchResult> | null;
  chat: Chat | null;
  updatedText: string | null;
  done: boolean;
};

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
