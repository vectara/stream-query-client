import {
  Chat,
  GenerationConfig,
  ParsedResult,
  StreamQueryConfig,
  StreamUpdate,
  StreamUpdateHandler,
} from "./types";
import { QueryBody } from "./apiTypes";
import { DEFAULT_ENDPOINT } from "../common/constants";

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
  onStreamUpdate: StreamUpdateHandler
) => {
  const {
    customerId,
    apiKey,
    endpoint,
    query,
    search: { offset, corpora, limit, contextConfiguration, reranker },
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

  const body: QueryBody = {
    query,
    search: {
      offset,
      corpora: corpora.map(
        ({
          corpusKey,
          metadataFilter,
          lexicalInterpolation,
          customDimensions,
          semantics,
        }) => ({
          corpus_key: corpusKey,
          metadata_filter: metadataFilter,
          lexical_interpolation: lexicalInterpolation,
          custom_dimensions: customDimensions?.reduce(
            (acc, { name, weight }) => ({ ...acc, [name]: weight }),
            {} as Record<string, number>
          ),
          semantics,
        })
      ),
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
  };

  const headers = {
    "x-api-key": apiKey,
    "customer-id": customerId,
    "Content-Type": "application/json",
  };

  const path = !chat
    ? "/v2/query"
    : chat.conversationId
    ? `/v2/chats/${chat.conversationId}/turns`
    : "/v2/chats";

  const url = `${endpoint ?? DEFAULT_ENDPOINT}${path}`;

  const stream = await generateStream(headers, JSON.stringify(body), url);

  let previousAnswerText = "";

  for await (const chunk of stream) {
    try {
      const parts = chunk.split("\n");

      parts
        .filter((part) => part !== "")
        .forEach((part) => {
          const dataObj = JSON.parse(part);

          if (!dataObj.result) return;

          const details: StreamUpdate["details"] = {};

          // TODO: Add back once debug has been added back to API v2.
          // const summaryDetail = getSummaryDetail(config, dataObj.result);
          // if (summaryDetail) {
          //   details.summary = summaryDetail;
          // }

          const chatDetail = getChatDetail(dataObj.result);
          if (chatDetail) {
            details.chat = chatDetail;
          }

          const fcsDetail = getFactualConsistencyDetail(dataObj.result);
          if (fcsDetail) {
            details.factualConsistency = fcsDetail;
          }

          const streamUpdate: StreamUpdate = {
            responseSet: dataObj.result.responseSet,
            details,
            updatedText: getUpdatedText(dataObj.result, previousAnswerText),
            isDone: dataObj.result.summary?.done ?? false,
          };

          previousAnswerText = streamUpdate.updatedText ?? "";

          onStreamUpdate(streamUpdate);
        });
    } catch (error) {}
  }
};

// TODO: Add back once debug has been added back to API v2.
// const getSummaryDetail = (
//   config: StreamQueryConfig,
//   parsedResult: ParsedResult
// ) => {
//   if (!parsedResult.summary) return;

//   if (config.debug && parsedResult.summary.prompt) {
//     return {
//       prompt: parsedResult.summary.prompt,
//     };
//   }
// };

const getChatDetail = (
  // config: StreamQueryConfig,
  parsedResult: ParsedResult
) => {
  if (!parsedResult.summary?.chat) return;

  const chatDetail: Chat = {
    conversationId: parsedResult.summary.chat.conversationId,
    turnId: parsedResult.summary.chat.turnId,
  };

  // TODO: Add back once debug has been added back to API v2.
  // if (config.debug && parsedResult.summary.chat.rephrasedQuery) {
  //   chatDetail.rephrasedQuery = parsedResult.summary.chat.rephrasedQuery;
  // }

  return chatDetail;
};

const getFactualConsistencyDetail = (parsedResult: ParsedResult) => {
  if (!parsedResult.summary || !parsedResult.summary.factualConsistency) return;

  return {
    score: parsedResult.summary.factualConsistency.score,
  };
};

const getUpdatedText = (parsedResult: ParsedResult, previousText: string) => {
  if (!parsedResult.summary) return;

  return `${previousText}${parsedResult.summary.text}`;
};

const generateStream = async (
  headers: Record<string, string>,
  body: string,
  url: string
): Promise<AsyncIterable<string>> => {
  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });
  if (response.status !== 200) throw new Error(response.status.toString());
  if (!response.body) throw new Error("Response body does not exist");
  return getIterableStream(response.body);
};

async function* getIterableStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    const decodedChunk = decoder.decode(value, { stream: true });
    yield decodedChunk;
  }
}
