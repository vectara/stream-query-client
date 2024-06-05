import { useState } from "react";
import ReactDOM from "react-dom";
import { streamQueryV1, ApiV1 } from "@vectara/stream-query-client";

const App = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string>();
  const [conversationId, setConversationId] = useState<string>();

  const sendQuery = async () => {
    const configurationOptions: ApiV1.StreamQueryConfig = {
      // Required fields.
      customerId: "1366999410",
      corpusIds: ["1"],
      apiKey: "zqt_UXrBcnI2UXINZkrv4g1tQPhzj02vfdtqYJIDiA",

      // Optional fields.
      queryValue: question,
      summaryNumResults: 5,
      language: "eng",
      chat: {
        store: true,
        conversationId,
      },
      debug: true,
      enableFactualConsistencyScore: true,
      summaryPromptName: "vectara-experimental-summary-ext-2023-12-11-large",
    };

    const onStreamUpdate = (update: ApiV1.StreamUpdate) => {
      console.log(update);
      const { updatedText, details } = update;
      if (details?.chat) {
        setConversationId(details.chat.conversationId);
      }
      setAnswer(updatedText);
    };

    streamQueryV1(configurationOptions, onStreamUpdate);
  };

  return (
    <>
      <h1>Stream Query Client</h1>

      <h2>Question</h2>

      <input value={question} onChange={(e) => setQuestion(e.target.value)} />

      <button
        onClick={() => {
          setAnswer("");
          sendQuery();
        }}
      >
        Send
      </button>

      <h2>Answer</h2>

      <p>{answer}</p>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
