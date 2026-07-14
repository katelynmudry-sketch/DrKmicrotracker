import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
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

// iOS/iPadOS WebKit has never implemented SpeechRecognition — not in Safari,
// and not in any other iOS browser (DuckDuckGo, Chrome-for-iOS, etc.), since
// Apple requires all of them to render on WebKit under the hood. There's no
// way to add real in-page speech recognition there without a third-party
// speech-to-text vendor, which is a bigger architectural call (a new paid
// service, outside Firebase+Anthropic — see CLAUDE.md) than this component
// should make on its own. The good news: iOS's own keyboard has a built-in
// dictation microphone that works in any text field, in any browser,
// without any web API at all — that's the real "voice" path there, and the
// fallback below leans into it explicitly instead of just saying "no."
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as "Mac" but has touch support; a real Mac doesn't.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// Some WebKit builds define webkitSpeechRecognition as a symbol without
// actually implementing it — calling .start() fails immediately via onerror
// rather than the constructor being absent. A plain existence check can't
// catch that, so a first-attempt error also permanently switches to the
// dictation-hint fallback for this session.
const UNRECOVERABLE_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture"]);

export function VoiceCapture({
  onTranscript,
  parsing,
}: {
  onTranscript: (transcript: string) => void;
  parsing?: boolean;
}) {
  // Lazy initializer so iOS never flashes the mic UI before the fallback
  // (this component only renders client-side — the route is ssr: false).
  const [supported, setSupported] = useState(
    () => typeof window !== "undefined" && getSpeechRecognitionCtor() !== null && !isIOS(),
  );
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const fallbackTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!supported) fallbackTextareaRef.current?.focus();
  }, [supported]);

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
    recognition.onerror = (event) => {
      setListening(false);
      if (UNRECOVERABLE_ERRORS.has(event.error)) {
        setSupported(false);
        toast.info("Voice input isn't available here — dictate with your keyboard instead.");
        return;
      }
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error("Didn't catch that — try again.");
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setSupported(false);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  if (!supported) {
    return (
      <div className="space-y-3">
        <p className="text-sm">
          Tap the <Mic className="inline h-3.5 w-3.5 align-[-2px]" />{" "}
          <strong>microphone on your keyboard</strong> below and talk — it'll dictate right into the
          box. (iPhone/iPad browsers don't support in-page voice capture, but the keyboard's own
          dictation works everywhere.)
        </p>
        <Textarea
          ref={fallbackTextareaRef}
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
