export const processStreamChunk = (
  chunk: string,
  callback: (part: string) => void
) => {
  const parts = chunk.split("\n");

  parts
    .filter((part: string) => {
      return part.indexOf("data:") === 0;
    })
    .forEach(callback);
};
