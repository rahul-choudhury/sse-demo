"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LogEvent = {
  id: string;
  type: string;
  receivedAt: string;
  payload: Record<string, unknown>;
};

const parsePayload = (value: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(value);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }

    return { value: parsed };
  } catch {
    return { value };
  }
};

export default function Home() {
  const [isRunning, setIsRunning] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<LogEvent[]>([]);

  useEffect(() => {
    if (!isRunning) {
      setIsConnected(false);
      return;
    }

    const source = new EventSource("/api/events");

    const appendEvent = (type: string, payload: Record<string, unknown>) => {
      setEvents((current) => {
        const nextEvent: LogEvent = {
          id: crypto.randomUUID(),
          type,
          receivedAt: new Date().toLocaleTimeString(),
          payload,
        };

        return [nextEvent, ...current].slice(0, 20);
      });
    };

    source.onopen = () => {
      setIsConnected(true);
    };

    source.onerror = () => {
      setIsConnected(false);
    };

    source.onmessage = (event) => {
      appendEvent("message", parsePayload(event.data));
    };

    source.addEventListener("connected", (event) => {
      appendEvent(
        "connected",
        parsePayload((event as MessageEvent<string>).data),
      );
    });

    source.addEventListener("tick", (event) => {
      appendEvent("tick", parsePayload((event as MessageEvent<string>).data));
    });

    return () => {
      source.close();
      setIsConnected(false);
    };
  }, [isRunning]);

  const latestTick = events.find((event) => event.type === "tick");

  return (
    <div className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>SSE Demo</CardTitle>
              <Badge>{isConnected ? "Connected" : "Disconnected"}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
                Latest Tick
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {latestTick?.payload.randomValue?.toString() ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
                Events Cached
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {events.length}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => setIsRunning((current) => !current)}
              >
                {isRunning ? "Pause stream" : "Resume stream"}
              </Button>
              <Button type="button" onClick={() => setEvents([])}>
                Clear log
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event log</CardTitle>
            <CardDescription>
              Showing the latest 20 events received by the browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {events.length > 0 ? (
                events.map((event) => (
                  <li key={event.id} className="rounded-lg border bg-card p-3">
                    <p className="text-muted-foreground text-xs">
                      {event.receivedAt} <span className="mx-1">|</span>{" "}
                      {event.type}
                    </p>
                    <pre className="mt-2 overflow-x-auto text-xs">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
                  Waiting for events...
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
