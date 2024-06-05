import { useState } from "react";
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
  const [questionV1, setQuestionV1] = useState("");
  const [answerV1, setAnswerV1] = useState<string>();
  const [conversationIdV1, setConversationIdV1] = useState<string>();

  const sendQueryV1 = async () => {
    const configurationOptions: ApiV1.StreamQueryConfig = {
      // Required fields.
      customerId: CUSTOMER_ID,
      corpusIds: [CORPUS_ID],
      apiKey: API_KEY,

      // Optional fields.
      queryValue: questionV1,
      summaryNumResults: 5,
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
      console.log(update);
      const { updatedText, details } = update;
      if (details?.chat) {
        setConversationIdV1(details.chat.conversationId);
      }
      setAnswerV1(updatedText);
    };

    streamQueryV1(configurationOptions, onStreamUpdate);
  };

  const [questionV2, setQuestionV2] = useState("");
  const [answerV2, setAnswerV2] = useState<string>();
  const [conversationIdV2, setConversationIdV2] = useState<string>();

  const sendQueryV2 = async () => {
    const configurationOptions: ApiV2.StreamQueryConfig = {
      customerId: CUSTOMER_ID,
      apiKey: API_KEY,
      query: questionV1,
      search: {
        offset: 0,
        corpora: [
          {
            corpusKey: `${CORPUS_NAME}_${CORPUS_ID}`,
            metadataFilter: "",
          },
        ],
        limit: 5,
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

    const onStreamUpdate = (update: ApiV2.StreamUpdate) => {
      console.log(update);
      const { updatedText, details } = update;
      if (details?.chat) {
        setConversationIdV2(details.chat.conversationId);
      }
      setAnswerV2(updatedText);
    };

    streamQueryV2(configurationOptions, onStreamUpdate);
  };

  return (
    <>
      <h1>Stream Query Client v1</h1>

      <h2>Question</h2>

      <input
        value={questionV1}
        onChange={(e) => setQuestionV1(e.target.value)}
      />

      <button
        onClick={() => {
          setAnswerV1("");
          sendQueryV1();
        }}
      >
        Send
      </button>

      <h2>Answer</h2>

      <p>{answerV1}</p>

      <h1>Stream Query Client v2</h1>

      <h2>Question</h2>

      <input
        value={questionV2}
        onChange={(e) => setQuestionV2(e.target.value)}
      />

      <button
        onClick={() => {
          setAnswerV2("");
          sendQueryV2();
        }}
      >
        Send
      </button>

      <h2>Answer</h2>

      <p>{answerV2}</p>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
