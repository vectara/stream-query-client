import { StreamEvent } from "./types";

export class EventBuffer {
  private onStreamEvent: (event: StreamEvent) => void;
  private includeRaw: boolean;
  private status: number;
  private events: StreamEvent[];
  private eventInProgress = "";
  private updatedText = "";

  constructor(onStreamEvent: (event: any) => void, includeRaw = false, status = 200) {
    this.events = [];
    this.onStreamEvent = onStreamEvent;
    this.includeRaw = includeRaw;
    this.status = status;
  }

  consumeChunk(chunk: string) {
    // A chunk might consist of multiple updates, or part of a single update.
    const parts = chunk.split("\n");

    parts.forEach((part: string) => {
      // Skip empty lines.
      if (part.trim().length === 0) return;

      // Skip "header" lines.
      if (part.indexOf("event:") === 0) return;

      // Beginning of an event.
      if (part.indexOf("data:") === 0) {
        // Trim the "data:" prefix to get the JSON data itself.
        this.eventInProgress = part.slice(5, part.length);
      } else {
        // Partial event.
        this.eventInProgress += part;
      }

      try {
        // If we can parse the JSON, it's complete.
        const rawEvent = JSON.parse(this.eventInProgress);
        this.enqueueEvent(rawEvent);
        this.eventInProgress = "";
      } catch (error: any) {
        const isJsonError = error.stack.includes("at JSON.parse");
        // Silently ignore JSON parsing errors, as they are expected.
        if (!isJsonError) {
          console.error(error);
        }
      }
    });

    this.drainEvents();
  }

  private enqueueEvent(rawEvent: any) {
    const {
      type,
      messages,
      search_results,
      chat_id,
      turn_id,
      factual_consistency_score,
      generation_chunk,
      rendered_prompt,
      rephrased_query
    } = rawEvent;

    switch (type) {
      case "error":
        this.events.push({
          type: "error",
          messages,
          ...(this.includeRaw && { raw: rawEvent })
        });
        break;

      case "search_results":
        this.events.push({
          type: "searchResults",
          searchResults: search_results,
          ...(this.includeRaw && { raw: rawEvent })
        });
        break;

      case "chat_info":
        this.events.push({
          type: "chatInfo",
          chatId: chat_id,
          turnId: turn_id,
          ...(this.includeRaw && { raw: rawEvent })
        });
        break;

      case "generation_chunk":
        this.updatedText += generation_chunk;
        this.events.push({
          type: "generationChunk",
          updatedText: this.updatedText,
          generationChunk: generation_chunk,
          ...(this.includeRaw && { raw: rawEvent })
        });
        break;

      case "generation_info":
        this.events.push({
          type: "generationInfo",
          renderedPrompt: rendered_prompt,
          rephrasedQuery: rephrased_query,
          ...(this.includeRaw && { raw: rawEvent })
        });
        break;

      case "generation_end":
        this.events.push({
          type: "generationEnd",
          ...(this.includeRaw && { raw: rawEvent })
        });
        break;

      case "factual_consistency_score":
        this.events.push({
          type: "factualConsistencyScore",
          factualConsistencyScore: factual_consistency_score,
          ...(this.includeRaw && { raw: rawEvent })
        });
        break;

      case "end":
        this.events.push({
          type: "end",
          ...(this.includeRaw && { raw: rawEvent })
        });
        break;

      default:
        if (type) {
          this.events.push({
            type: "unexpectedEvent",
            rawType: type,
            raw: rawEvent
          });
        } else if (this.status !== 200) {
          // Assume an error.
          this.events.push({
            type: "requestError",
            status: this.status,
            raw: rawEvent
          });
        } else {
          // Assume an error.
          this.events.push({
            type: "unexpectedError",
            raw: rawEvent
          });
        }
    }
  }

  private drainEvents() {
    // Emit all events that are complete and reset the queue.
    this.events.forEach((event) => {
      this.onStreamEvent(event);
    });
    this.events = [];
  }
}
