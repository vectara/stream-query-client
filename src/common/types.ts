export type BaseStreamQueryConfig = {
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

export const SUMMARY_LANGUAGES = [
  "auto",
  "eng",
  "en",
  "deu",
  "de",
  "fra",
  "fr",
  "zho",
  "zh",
  "kor",
  "ko",
  "ara",
  "ar",
  "rus",
  "ru",
  "tha",
  "th",
  "nld",
  "nl",
  "ita",
  "it",
  "por",
  "pt",
  "spa",
  "es",
  "jpn",
  "ja",
  "pol",
  "pl",
  "tur",
  "tr",
  "heb",
  "he",
  "vie",
  "vi",
  "ind",
  "id",
  "ces",
  "cs",
  "ukr",
  "uk",
  "ell",
  "el",
  "fas",
  "fa",
  "hin",
  "hi",
  "urd",
  "ur",
  "swe",
  "sv",
  "ben",
  "bn",
  "msa",
  "ms",
  "ron",
  "ro",
] as const;

export type SummaryLanguage = (typeof SUMMARY_LANGUAGES)[number];
