import { useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  streamQueryV1,
  ApiV1,
  streamQueryV2,
  ApiV2,
} from "@vectara/stream-query-client";

const CUSTOMER_ID = "1526022105";
const API_KEY = "zqt_WvU_2ewh7ZGRwq8LdL2SV8B9RJmVGyUm1VAuOw";
const CORPUS_NAME = "ofer-bm-moma-docs";
const CORPUS_ID = "232";

const App = () => {
  const [question, setQuestion] = useState("what is vectara");
  const [answerV1, setAnswerV1] = useState<string>();
  const [resultsV1, setResultsV1] = useState<string>();
  const [answerV2, setAnswerV2] = useState<string>();
  const [resultsV2, setResultsV2] = useState<string>();
  const [conversationIdV1, setConversationIdV1] = useState<string>();
  const [conversationIdV2, setConversationIdV2] = useState<string>();
  const cancelStream = useRef<(() => void) | null>(null);

  const sendQueryV1 = async () => {
    const configurationOptions: ApiV1.StreamQueryConfig = {
      // Required fields.
      customerId: CUSTOMER_ID,
      corpusIds: [CORPUS_ID],
      apiKey: API_KEY,

      // Optional fields.
      queryValue: question,
      summaryNumResults: 10,
      language: "eng",
      chat: {
        store: true,
        conversationId: conversationIdV1,
      },
      debug: true,
      enableFactualConsistencyScore: true,
      summaryPromptName: "vectara-experimental-summary-ext-2023-12-11-large",
    };

    const onStreamUpdate = (update: ApiV1.StreamUpdate) => {
      // console.log("v1", update);
      const { updatedText, details, references } = update;

      if (details?.chat) {
        setConversationIdV1(details.chat.conversationId);
      }

      setAnswerV1(updatedText);

      if (references) {
        setResultsV1(JSON.stringify(references));
      }
    };

    streamQueryV1(configurationOptions, onStreamUpdate);
  };

  const sendQueryV2 = async () => {
    const streamQueryConfig: ApiV2.StreamQueryConfig = {
      customerId: CUSTOMER_ID,
      apiKey: API_KEY,
      query: question,
      corpusKey: `${CORPUS_NAME}_${CORPUS_ID}`,
      search: {
        offset: 0,
        metadataFilter: "",
        limit: 5,
        lexicalInterpolation: 0,
        contextConfiguration: {
          sentencesBefore: 2,
          sentencesAfter: 2,
        },
        reranker: "none",
      },
      generation: {
        maxUsedSearchResults: 5,
        responseLanguage: "eng",
        enableFactualConsistencyScore: true,
        promptName: "vectara-experimental-summary-ext-2023-12-11-large",
      },
      chat: {
        store: true,
        conversationId: conversationIdV2,
      },
    };

    const onStreamEvent = (event: ApiV2.StreamEvent) => {
      switch (event.type) {
        case "chatInfo":
          setConversationIdV2(event.chatId);
          break;

        case "searchResults":
          setResultsV2(JSON.stringify(event.searchResults));
          break;

        case "generationChunk":
          setAnswerV2(event.updatedText);
          break;

        case "error":
        case "requestError":
        case "unexpectedError":
          console.log("Error", event);
      }
    };

    const queryStream = await streamQueryV2({
      streamQueryConfig,
      onStreamEvent,
      onError: (error) => {
        console.error("Error", error);
      },
    });

    cancelStream.current = queryStream?.cancelStream ?? null;
  };

  return (
    <>
      <h2>Question</h2>

      <input value={question} onChange={(e) => setQuestion(e.target.value)} />

      <button
        onClick={() => {
          setAnswerV1("");
          setResultsV1("");
          setAnswerV2("");
          setResultsV2("");
          sendQueryV1();
          sendQueryV2();
        }}
      >
        Send
      </button>

      <button onClick={() => cancelStream.current?.()}>Cancel</button>

      <div style={{ display: "flex" }}>
        <div style={{ flexGrow: "1", flexShrink: "1", width: "50%" }}>
          <h2>Stream Query Client v1 answer</h2>
          <p>{resultsV1}</p>
          <p>{answerV1}</p>
        </div>

        <div style={{ flexGrow: "1", flexShrink: "1", width: "50%" }}>
          <h2>Stream Query Client v2 answer</h2>
          <p>{resultsV2}</p>
          <p>{answerV2}</p>
        </div>
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
