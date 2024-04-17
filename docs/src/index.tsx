import { useState } from "react";
import ReactDOM from "react-dom";
import {
  streamQuery,
  StreamUpdate,
  StreamQueryConfig,
} from "@vectara/stream-query-client";

const App = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const sendQuery = async () => {
    const configurationOptions: StreamQueryConfig = {
      // Required fields.
      customerId: "1366999410",
      corpusIds: ["1"],
      apiKey: "zqt_UXrBcnI2UXINZkrv4g1tQPhzj02vfdtqYJIDiA",

      // Optional fields.
      queryValue: question,
      summaryNumResults: 5,
      language: "eng",
      debug: true,
      enableFactualConsistencyScore: true,
      summaryPromptName: "vectara-experimental-summary-ext-2023-12-11-large",
    };

    const onStreamUpdate = (update: StreamUpdate) => {
      console.log(update);
      // Perform operations on returned data, e.g. update state.
      setAnswer(update.updatedText ?? "");
    };

    streamQuery(configurationOptions, onStreamUpdate);
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
