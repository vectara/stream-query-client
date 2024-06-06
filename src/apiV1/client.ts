import {
  Chat,
  ParsedResult,
  StreamQueryConfig,
  StreamUpdate,
  StreamUpdateHandler,
} from "./types";
import { deserializeSearchResponse } from "./deserializeSearchResponse";
import { processStreamChunk } from "./processStreamChunk";
import { SNIPPET_START_TAG, SNIPPET_END_TAG } from "./constants";
import { DEFAULT_DOMAIN } from "../common/constants";
import { generateStream } from "../common/generateStream";

export const streamQueryV1 = async (
  config: StreamQueryConfig,
  onStreamUpdate: StreamUpdateHandler
) => {
  const requestHeaders = {
    "x-api-key": config.apiKey,
    "customer-id": config.customerId,
    "Content-Type": "application/json",
  };

  // Normalizes lambda to ensure that:
  // - lambda is between 0 and 1
  // - lambda is always a positive number
  let normalizedLambda = config.lambda ?? 0.025;
  if (normalizedLambda > 1) {
    normalizedLambda = 1.0;
  } else if (normalizedLambda < 0) {
    normalizedLambda = 0;
  }

  const corpusKeyList = config.corpusIds.map((id) => {
    return {
      customerId: config.customerId,
      corpusId: id,
      lexicalInterpolationConfig: {
        lambda: normalizedLambda,
      },
      metadataFilter: config.filter
        ? `doc.source = '${config.filter}'`
        : undefined,
    };
  });

  const rerankingConfig = !config.rerank
    ? {}
    : {
        rerankingConfig: {
          rerankerId: config.rerankerId,
          ...(config.rerankerId === 272725718
            ? {
                mmrConfig: {
                  diversityBias: config.rerankDiversityBias,
                },
              }
            : {}),
        },
      };

  const requestBody = JSON.stringify({
    query: [
      {
        query: config.queryValue,
        start: 0,
        numResults: config.rerank ? config.rerankNumResults : 10,
        corpusKey: corpusKeyList,
        contextConfig: {
          sentencesBefore: config.summaryNumSentences ?? 2,
          sentencesAfter: config.summaryNumSentences ?? 2,
          startTag: SNIPPET_START_TAG,
          endTag: SNIPPET_END_TAG,
        },
        summary: [
          {
            responseLang: config.language,
            debug: config.debug,
            maxSummarizedResults: config.summaryNumResults,
            summarizerPromptName: config.summaryPromptName,
            factualConsistencyScore:
              config.enableFactualConsistencyScore ?? false,
            chat: {
              store: config.chat?.store ?? false,
              conversationId: config.chat?.conversationId,
            },
          },
        ],
        ...rerankingConfig,
      },
    ],
  });

  const url = config.endpoint ?? `${DEFAULT_DOMAIN}/v1/stream-query`;

  const stream = await generateStream(requestHeaders, requestBody, url);

  let previousAnswerText = "";

  for await (const chunk of stream) {
    try {
      processStreamChunk(chunk, (part) => {
        const dataObj = JSON.parse(part);

        if (!dataObj.result) return;

        const details: StreamUpdate["details"] = {};

        const summaryDetail = getSummaryDetail(config, dataObj.result);
        if (summaryDetail) {
          details.summary = summaryDetail;
        }

        const chatDetail = getChatDetail(config, dataObj.result);
        if (chatDetail) {
          details.chat = chatDetail;
        }

        const fcsDetail = getFactualConsistencyDetail(dataObj.result);
        if (fcsDetail) {
          details.factualConsistency = fcsDetail;
        }

        const streamUpdate: StreamUpdate = {
          references: deserializeSearchResponse(dataObj.result.responseSet),
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

const getSummaryDetail = (
  config: StreamQueryConfig,
  parsedResult: ParsedResult
) => {
  if (!parsedResult.summary) return;

  if (config.debug && parsedResult.summary.prompt) {
    return {
      prompt: parsedResult.summary.prompt,
    };
  }
};

const getChatDetail = (
  config: StreamQueryConfig,
  parsedResult: ParsedResult
) => {
  if (!parsedResult.summary?.chat) return;

  const chatDetail: Chat = {
    conversationId: parsedResult.summary.chat.conversationId,
    turnId: parsedResult.summary.chat.turnId,
  };

  if (config.debug && parsedResult.summary.chat.rephrasedQuery) {
    chatDetail.rephrasedQuery = parsedResult.summary.chat.rephrasedQuery;
  }

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
