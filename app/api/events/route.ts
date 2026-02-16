type StreamEvent = {
  type: string;
  payload: Record<string, unknown>;
};

const formatEvent = ({ type, payload }: StreamEvent) => {
  return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
};

export function GET(request: Request) {
  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | undefined;
  let counter = 0;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(formatEvent(event)));
      };

      send({
        type: "connected",
        payload: {
          message: "SSE stream opened",
          connectedAt: new Date().toISOString(),
        },
      });

      intervalId = setInterval(() => {
        counter += 1;
        send({
          type: "tick",
          payload: {
            id: counter,
            timestamp: new Date().toISOString(),
            randomValue: Number((Math.random() * 100).toFixed(2)),
          },
        });
      }, 1500);

      request.signal.addEventListener("abort", () => {
        if (intervalId) {
          clearInterval(intervalId);
        }

        controller.close();
      });
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
