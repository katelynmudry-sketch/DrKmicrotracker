import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mic, Square } from "lucide-react";

// Web Speech API isn't part of TypeScript's DOM lib (it's still a draft, not
// a W3C standard) — minimal local shape for the handful of members this
// component actually touches, rather than pulling in a full third-party
// type package for one component.
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ??
    w.webkitSpeechRecognition ??
    null) as SpeechRecognitionConstructor | null;
}

// Voice pantry capture (post-demo milestone #1, docs/PLAN.md): browser
// speech-to-text where supported (Chrome/Edge desktop and Android), a plain
// textarea fallback everywhere else (notably iOS Safari, whose Web Speech
// support is inconsistent across versions). Either path ends at the same
// transcript-in-hand state, handed to onTranscript to parse into items.
export function VoiceCapture({
  onTranscript,
  parsing,
}: {
  onTranscript: (transcript: string) => void;
  parsing?: boolean;
}) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  const startListening = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript;
      }
      setTranscript(combined);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  if (!supported) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Voice capture isn't available in this browser — type what's in your pantry instead, plain
          and separated by commas or new lines.
        </p>
        <Textarea
          rows={4}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Pumpkin seeds, oats, a dozen eggs…"
        />
        <Button onClick={() => onTranscript(transcript)} disabled={!transcript.trim() || parsing}>
          {parsing && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          Identify items
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Say what's in your pantry — "pumpkin seeds, a dozen eggs, oats" — then confirm below.
      </p>
      <div className="flex items-center gap-2">
        {listening ? (
          <Button type="button" variant="outline" onClick={stopListening}>
            <Square className="mr-1 h-4 w-4" />
            Stop
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={startListening}>
            <Mic className="mr-1 h-4 w-4" />
            {transcript ? "Listen again" : "Start talking"}
          </Button>
        )}
        {listening && <span className="text-xs text-muted-foreground">Listening…</span>}
      </div>
      <Textarea
        rows={3}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="What we heard will show up here — edit it if needed."
      />
      <Button onClick={() => onTranscript(transcript)} disabled={!transcript.trim() || parsing}>
        {parsing && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
        Identify items
      </Button>
    </div>
  );
}
