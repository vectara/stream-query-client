import {
  Chat,
  ParsedResult,
  StreamQueryConfig,
  StreamUpdate,
  StreamUpdateHandler,
} from "./types";
import { deserializeSearchResponse } from "./deserializeSearchResponse";
import { SNIPPET_START_TAG, SNIPPET_END_TAG } from "./constants";

const DEFAULT_ENDPOINT = "api.vectara.io";

export const streamQuery = async (
  config: StreamQueryConfig,
  onStreamUpdate: StreamUpdateHandler
) => {
  const requestHeaders = {
    "x-api-key": config.apiKey,
    "customer-id": config.customerId,
    "Content-Type": "application/json",
  };

  const lambda =
    typeof config.queryValue === "undefined" ||
    config.queryValue.trim().split(" ").length > config.hybridNumWords
      ? config.hybridLambdaLong
      : config.hybridLambdaShort;
  const corpusKeyList = config.corpusIds.map((id) => {
    return {
      customerId: config.customerId,
      corpusId: id,
      lexicalInterpolationConfig: {
        lambda: lambda,
      },
      metadataFilter: config.filter
        ? `doc.source = '${config.filter}'`
        : undefined,
    };
  });

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
            maxSummarizedResults: config.summaryNumResults,
            summarizerPromptName: config.summaryPromptName,
            chat: {
              store: config.chat?.store ?? false,
              conversationId: config.chat?.conversationId,
            },
          },
        ],
        ...(config.rerank
          ? {
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
            }
          : {}),
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

          const chatData = getChat(dataObj.result);

          const streamUpdate: StreamUpdate = {
            references:
              deserializeSearchResponse(dataObj.result.responseSet) ?? null,
            detail: chatData
              ? {
                  type: "chat",
                  data: chatData,
                }
              : null,
            updatedText: getUpdatedText(dataObj.result, previousAnswerText),
            isDone: dataObj.result.summary?.done ?? false,
          };

          previousAnswerText = streamUpdate.updatedText ?? "";

          onStreamUpdate(streamUpdate);
        });
    } catch (error) {}
  }
};

const getChat = (parsedResult: ParsedResult): Chat | null => {
  if (!parsedResult.summary) return null;

  return {
    conversationId: parsedResult.summary.chat.conversationId,
    turnId: parsedResult.summary.chat.turnId,
  };
};

const getUpdatedText = (
  parsedResult: ParsedResult,
  previousText: string
): string | null => {
  if (!parsedResult.summary) return null;

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
