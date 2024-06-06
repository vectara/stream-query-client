import { EventBuffer } from "./EventBuffer";

describe.skip("EventBuffer", () => {
  test("handles multiple events within a single chunk", () => {
    const onStreamEvent = jest.fn();
    const buffer = new EventBuffer(onStreamEvent);

    buffer.consumeChunk(`
event:error
data:{"type":"error","messages":["INVALID_ARGUMENT: The filter expression contains an error. Syntax error at 1:0 nc79bc8s must be referenced as doc.nc79bc8s or part.nc79bc8s"]}

event:end
data:{"type":"end"}
    `);

    expect(onStreamEvent).toHaveBeenNthCalledWith(1, {
      type: "error",
      messages: [
        "INVALID_ARGUMENT: The filter expression contains an error. Syntax error at 1:0 nc79bc8s must be referenced as doc.nc79bc8s or part.nc79bc8s",
      ],
    });

    expect(onStreamEvent).toHaveBeenNthCalledWith(2, { type: "end" });
  });

  test("handles multiple chunks composing a single event", () => {
    const onStreamEvent = jest.fn();
    const buffer = new EventBuffer(onStreamEvent);

    buffer.consumeChunk(`
event:search_results
data:{"type":"search_results",
    `);

    buffer.consumeChunk(`
"search_results":[
        `);

    buffer.consumeChunk(`
{"id":"doc1"}]}
        `);

    expect(onStreamEvent).toHaveBeenCalledWith({
      type: "searchResults",
      searchResults: [{ id: "doc1" }],
    });
  });

  test("handles multiple events, each within its own chunk", () => {
    const onStreamEvent = jest.fn();
    const buffer = new EventBuffer(onStreamEvent);

    buffer.consumeChunk(`
event:error
data:{"type":"error","messages":["INVALID_ARGUMENT: The filter expression contains an error. Syntax error at 1:0 nc79bc8s must be referenced as doc.nc79bc8s or part.nc79bc8s"]}
    `);

    buffer.consumeChunk(`
event:end
data:{"type":"end"}
    `);

    expect(onStreamEvent).toHaveBeenNthCalledWith(1, {
      type: "error",
      messages: [
        "INVALID_ARGUMENT: The filter expression contains an error. Syntax error at 1:0 nc79bc8s must be referenced as doc.nc79bc8s or part.nc79bc8s",
      ],
    });

    expect(onStreamEvent).toHaveBeenNthCalledWith(2, { type: "end" });
  });
});
