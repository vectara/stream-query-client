import {
  Chat,
  ParsedResult,
  StreamQueryConfig,
  StreamUpdate,
  StreamUpdateHandler,
} from "./types";
import { deserializeSearchResponse } from "./deserializeSearchResponse";
import {
  SNIPPET_START_TAG,
  SNIPPET_END_TAG,
  DEFAULT_ENDPOINT,
} from "../common/constants";

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

  const stream = await generateStream(
    requestHeaders,
    requestBody,
    config.endpoint ?? DEFAULT_ENDPOINT
  );

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

const generateStream = async (
  requestHeaders: Record<string, string>,
  requestBody: string,
  endpoint: string
): Promise<AsyncIterable<string>> => {
  const response = await fetch(`https://${endpoint}/v1/stream-query`, {
    method: "POST",
    headers: requestHeaders,
    body: requestBody,
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
