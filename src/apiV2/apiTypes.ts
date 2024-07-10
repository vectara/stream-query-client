import { SummaryLanguage } from "../common/types";

export namespace Query {
  export type NoneReranker = "none";

  export type CustomerSpecificReranker = {
    type: "customer_reranker";
    reranker_id: string;
  };

  export type MmrReranker = {
    type: "mmr";
    diversity_bias: number;
  };

  export type SearchConfiguration = {
    corpora: {
      corpus_key: string;
      metadata_filter?: string;
      lexical_interpolation?: number;
      custom_dimensions?: Record<string, number>;
      semantics?: "default" | "query" | "response";
    }[];
    offset: number;
    limit?: number;
    context_configuration?: {
      characters_before?: number;
      characters_after?: number;
      sentences_before?: number;
      sentences_after?: number;
      start_tag?: string;
      end_tag?: string;
    };
    reranker?: NoneReranker | CustomerSpecificReranker | MmrReranker;
  };

  export type NoneCitations = {
    style: "none";
  };

  export type NumericCitations = {
    style: "numeric";
  };

  export type HtmlCitations = {
    style: "html";
    url_pattern: string;
    text_pattern: string;
  };

  export type MarkdownCitations = {
    style: "markdown";
    url_pattern: string;
    text_pattern: string;
  };

  export type GenerationConfiguration = {
    prompt_name?: string;
    max_used_search_results?: number;
    prompt_text?: string;
    max_response_characters?: number;
    response_language?: SummaryLanguage;
    model_parameters?: {
      max_tokens: number;
      temperature: number;
      frequency_penalty: number;
      presence_penalty: number;
    };
    citations?:
      | NoneCitations
      | NumericCitations
      | HtmlCitations
      | MarkdownCitations;
    enable_factual_consistency_score?: boolean;
  };

  export type ChatConfiguration = {
    store?: boolean;
    conversation_id?: string;
  };

  export type Body = {
    query: string;
    search: SearchConfiguration;
    stream_response?: boolean;
    generation?: GenerationConfiguration;
    chat?: ChatConfiguration;
  };

  export type SearchResult = {
    document_id: string;
    text: string;
    score: number;
    part_metadata: {
      lang: string;
      section: number;
      offset: number;
      len: number;
    };
    document_metadata: Record<string, any>;
  };
}
