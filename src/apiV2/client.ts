import {
  GenerationConfig,
  StreamQueryConfig,
  StreamEventHandler,
  StreamQueryRequest,
  StreamQueryRequestHeaders
} from "./types";
import { Query } from "./apiTypes";
import { DEFAULT_DOMAIN } from "../common/constants";
import { generateStream } from "../common/generateStream";
import { EventBuffer } from "./EventBuffer";

const convertReranker = (reranker?: StreamQueryConfig["search"]["reranker"]) => {
  if (!reranker) return;

  if (reranker.type === "none") {
    return {
      type: reranker.type
    };
  }

  if (reranker.type === "customer_reranker") {
    return {
      type: reranker.type,
      reranker_id: reranker.rerankerId
    };
  }

  if (reranker.type === "mmr") {
    return {
      type: reranker.type,
      diversity_bias: reranker.diversityBias
    };
  }
};

const convertCitations = (citations?: GenerationConfig["citations"]) => {
  if (!citations) return;

  if (citations.style === "none" || citations.style === "numeric") {
    return {
      style: citations.style
    };
  }

  if (citations.style === "html" || citations.style === "markdown") {
    return {
      style: citations.style,
      url_pattern: citations.urlPattern,
      text_pattern: citations.textPattern
    };
  }
};

export const streamQueryV2 = async ({
  streamQueryConfig,
  onStreamEvent,
  includeRawEvents = false
}: {
  streamQueryConfig: StreamQueryConfig;
  onStreamEvent: StreamEventHandler;
  includeRawEvents?: boolean;
}) => {
  const {
    customerId,
    apiKey,
    authToken,
    domain,
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
      reranker
    },
    generation,
    chat
  } = streamQueryConfig;

  const body: Query.Body = {
    query,
    search: {
      corpora: corpusKey.split(",").map((key) => ({
        corpus_key: key,
        metadata_filter: metadataFilter,
        lexical_interpolation: lexicalInterpolation,
        custom_dimensions: customDimensions,
        semantics
      })),
      offset,
      limit,
      context_configuration: {
        characters_before: contextConfiguration?.charactersBefore,
        characters_after: contextConfiguration?.charactersAfter,
        sentences_before: contextConfiguration?.sentencesBefore,
        sentences_after: contextConfiguration?.sentencesAfter,
        start_tag: contextConfiguration?.startTag,
        end_tag: contextConfiguration?.endTag
      },
      reranker: convertReranker(reranker)
    },
    stream_response: true
  };

  if (generation) {
    const {
      generationPresetName,
      maxUsedSearchResults,
      promptText,
      maxResponseCharacters,
      responseLanguage,
      modelParameters,
      citations,
      enableFactualConsistencyScore
    } = generation;

    body.generation = {
      generation_preset_name: generationPresetName,
      max_used_search_results: maxUsedSearchResults,
      prompt_text: promptText,
      max_response_characters: maxResponseCharacters,
      response_language: responseLanguage,
      model_parameters: modelParameters && {
        max_tokens: modelParameters.maxTokens,
        temperature: modelParameters.temperature,
        frequency_penalty: modelParameters.frequencyPenalty,
        presence_penalty: modelParameters.presencePenalty
      },
      citations: convertCitations(citations),
      enable_factual_consistency_score: enableFactualConsistencyScore
    };
  }

  if (chat) {
    body.chat = {
      store: chat.store
    };
  }

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

  const headers: StreamQueryRequestHeaders = {
    "customer-id": customerId,
    "Content-Type": "application/json"
  };

  if (apiKey) headers["x-api-key"] = apiKey;
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const url = `${domain ?? DEFAULT_DOMAIN}${path}`;

  const request: StreamQueryRequest = {
    method: "POST",
    url,
    headers,
    body
  };

  try {
    const { cancelStream, stream, status, responseHeaders } = await generateStream(headers, JSON.stringify(body), url);

    const consumeStream = async () => {
      try {
        const buffer = new EventBuffer(onStreamEvent, includeRawEvents, status);

        for await (const chunk of stream) {
          try {
            buffer.consumeChunk(chunk);
          } catch (error) {
            handleError(error, onStreamEvent);
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name == "AbortError") {
          // Swallow the "DOMException: BodyStreamBuffer was aborted" error
          // triggered by cancelling a stream.
        } else {
          handleError(error, onStreamEvent);
        }
      }
    };

    consumeStream();

    return { cancelStream, request, status, responseHeaders };
  } catch (error) {
    handleError(error, onStreamEvent);
  }

  return { request };
};

const handleError = (error: unknown, onStreamEvent: StreamEventHandler) => {
  if (error instanceof Error) {
    onStreamEvent({
      type: "genericError",
      error
    });
  } else {
    throw error;
  }
};
