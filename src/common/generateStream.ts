export const generateStream = async (
  headers: Record<string, string>,
  body: string,
  url: string
) => {
  let controller = new AbortController();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
    signal: controller.signal,
  });

  if (response.status !== 200) throw new Error(response.status.toString());
  if (!response.body) throw new Error("Response body does not exist");

  return {
    stream: getIterableStream(response.body),
    cancelStream: () => controller.abort(),
  };
};

async function* getIterableStream(
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
