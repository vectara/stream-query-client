import {
  Chat,
  ParsedResult,
  StreamUpdate,
  StreamUpdateHandler,
  SummaryLanguage,
} from "./types";
import { deserializeSearchResponse } from "./deserializeSearchResponse";
import { SNIPPET_START_TAG, SNIPPET_END_TAG } from "./constants";

export type StreamQueryConfig = {
  filter: string;
  queryValue?: string;
  language?: SummaryLanguage;
  summaryMode?: boolean;
  rerank?: boolean;
  rerankNumResults?: number;
  rerankerId?: number;
  rerankDiversityBias?: number;
  hybridNumWords: number;
  hybridLambdaShort?: number;
  hybridLambdaLong?: number;
  summaryNumResults?: number;
  summaryNumSentences?: number;
  summaryPromptName?: string;
  customerId: string;
  corpusIds: Array<string>;
  endpoint?: string;
  apiKey: string;
  chat?: {
    store: boolean;
    conversationId?: string;
  };
};
const DEFAULT_ENDPOINT = "api.vectara.io";

export const streamQuery = async (
  config: StreamQueryConfig,
  onStreamUpdate: StreamUpdateHandler
) => {
  // construct headers
  const requestHeaders = {
    "x-api-key": config.apiKey,
    "customer-id": config.customerId,
    "Content-Type": "application/json",
  };

  // construct request body
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
          sentencesBefore: config.summaryMode ? config.summaryNumSentences : 2,
          sentencesAfter: config.summaryMode ? config.summaryNumSentences : 2,
          startTag: SNIPPET_START_TAG,
          endTag: SNIPPET_END_TAG,
        },
        ...(config.summaryMode
          ? {
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
            }
          : {}),
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

          const streamUpdate: StreamUpdate = {
            references:
              deserializeSearchResponse(dataObj.result.responseSet) ?? null,
            chat: getChat(dataObj.result),
            updatedText: getUpdatedText(dataObj.result, previousAnswerText),
            done: dataObj.result.summary?.done ?? false,
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

export const generateStream = async (
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

export async function* getIterableStream(
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
