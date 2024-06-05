export const processStreamChunk = (
  chunk: string,
  callback: (part: string) => void
) => {
  const parts = chunk.split("\n");

  parts.filter((part) => part !== "").forEach(callback);
};
