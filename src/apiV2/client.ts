import {
  GenerationConfig,
  StreamQueryConfig,
  StreamEventHandler,
} from "./types";
import { QueryBody } from "./apiTypes";
import { DEFAULT_DOMAIN } from "../common/constants";
import { generateStream } from "../common/generateStream";
import { EventBuffer } from "./EventBuffer";

const convertReranker = (
  reranker?: StreamQueryConfig["search"]["reranker"]
) => {
  if (!reranker) return;

  if (reranker.type === "customer_reranker") {
    return {
      type: reranker.type,
      reranker_id: reranker.rerankerId,
    };
  }

  if (reranker.type === "mmr") {
    return {
      type: reranker.type,
      diversity_bias: reranker.diversityBias,
    };
  }
};

const convertCitations = (citations?: GenerationConfig["citations"]) => {
  if (!citations) return;

  if (citations.style === "none" || citations.style === "numeric") {
    return {
      style: citations.style,
    };
  }

  if (citations.style === "html" || citations.style === "markdown") {
    return {
      style: citations.style,
      url_pattern: citations.urlPattern,
      text_pattern: citations.textPattern,
    };
  }
};

export const streamQueryV2 = async (
  config: StreamQueryConfig,
  onStreamEvent: StreamEventHandler
) => {
  const {
    customerId,
    apiKey,
    endpoint,
    corpusKey,
    query,
    search: {
      metadataFilter,
      lexicalInterpolation,
      customDimensions,
      semantics,
      offset,
      limit,
      contextConfiguration,
      reranker,
    },
    generation: {
      promptName,
      maxUsedSearchResults,
      promptText,
      maxResponseCharacters,
      responseLanguage,
      modelParameters,
      citations,
    } = {},
    chat,
  } = config;

  let body: QueryBody = {
    query,
    search: {
      corpora: [
        {
          corpus_key: corpusKey,
          metadata_filter: metadataFilter,
          lexical_interpolation: lexicalInterpolation,
          custom_dimensions: customDimensions,
          semantics,
        },
      ],
      offset,
      limit,
      context_configuration: {
        characters_before: contextConfiguration?.charactersBefore,
        characters_after: contextConfiguration?.charactersAfter,
        sentences_before: contextConfiguration?.sentencesBefore,
        sentences_after: contextConfiguration?.sentencesAfter,
        start_tag: contextConfiguration?.startTag,
        end_tag: contextConfiguration?.endTag,
      },
      reranker: convertReranker(reranker),
    },
    generation: {
      prompt_name: promptName,
      max_used_search_results: maxUsedSearchResults,
      prompt_text: promptText,
      max_response_characters: maxResponseCharacters,
      response_language: responseLanguage,
      model_parameters: modelParameters && {
        max_tokens: modelParameters.maxTokens,
        temperature: modelParameters.temperature,
        frequency_penalty: modelParameters.frequencyPenalty,
        presence_penalty: modelParameters.presencePenalty,
      },
      citations: convertCitations(citations),
    },
    chat: chat && {
      store: chat.store,
    },
    stream_response: true,
  };

  let path;

  if (!chat) {
    path = `/v2/query`;
  } else {
    if (chat.conversationId) {
      path = `/v2/chats/${chat.conversationId}/turns`;
    } else {
      path = "/v2/chats";
    }
  }

  const headers = {
    "x-api-key": apiKey,
    "customer-id": customerId,
    "Content-Type": "application/json",
  };

  const url = `${endpoint ?? DEFAULT_DOMAIN}${path}`;

  try {
    const stream = await generateStream(headers, JSON.stringify(body), url);
    const buffer = new EventBuffer(onStreamEvent);

    for await (const chunk of stream) {
      try {
        buffer.consumeChunk(chunk);
        buffer.drainEvents();
      } catch (error) {
        console.log("error", error);
      }
    }
  } catch (error) {
    console.log("error", error);
  }
};
