import { StreamEvent } from "./types";

export class EventBuffer {
  private events: StreamEvent[];
  private onStreamEvent: (event: StreamEvent) => void;
  private eventInProgress: string = "";
  private updatedText: string = "";

  constructor(onStreamEvent: (event: any) => void) {
    this.events = [];
    this.onStreamEvent = onStreamEvent;
  }

  consumeChunk(chunk: string) {
    // A chunk might consist of multiple updates, or part of a single update.
    const parts = chunk.split("\n");

    parts.forEach((part: string) => {
      if (part.trim().length === 0) return;
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
        JSON.parse(this.eventInProgress);
        this.enqueueEvent();
        this.eventInProgress = "";
      } catch {}
    });
  }

  private enqueueEvent() {
    // Trim the "data:" prefix to get the JSON.
    const dataObj = JSON.parse(this.eventInProgress);

    const {
      type,
      messages,
      search_results,
      chat_id,
      turn_id,
      factual_consistency_score,
      generation_chunk,
    } = dataObj;

    switch (type) {
      case "error":
        this.events.push({
          type: "error",
          messages,
        });
        break;

      case "search_results":
        this.events.push({
          type: "searchResults",
          searchResults: search_results,
        });
        break;

      case "chat_info":
        this.events.push({
          type: "chatInfo",
          chatId: chat_id,
          turnId: turn_id,
        });
        break;

      case "generation_chunk":
        this.updatedText += generation_chunk;
        this.events.push({
          type: "generationChunk",
          updatedText: this.updatedText,
          generationChunk: generation_chunk,
        });
        break;

      case "factual_consistency_score":
        this.events.push({
          type: "factualConsistencyScore",
          factualConsistencyScore: factual_consistency_score,
        });
        break;

      case "end":
        this.events.push({
          type: "end",
        });
        break;

      default:
        console.log(`Unhandled event: ${type}`, dataObj);
    }
  }

  drainEvents() {
    // Emit all events that are complete and reset the queue.
    this.events.forEach((event) => {
      this.onStreamEvent(event);
    });
    this.events = [];
  }
}
