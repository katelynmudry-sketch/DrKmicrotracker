import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square } from "lucide-react";

type SpeechRecognitionResultLike = { 0: { transcript: string } };
type SpeechRecognitionEventLike = { results: ArrayLike<SpeechRecognitionResultLike> };

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Mic-driven transcript capture via the Web Speech API, with a manual text
 * fallback always visible since browser support (notably iOS Safari) is
 * inconsistent and the API requires HTTPS + mic permission.
 */
export function VoiceCapture({ onSubmit }: { onSubmit: (transcript: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
  }, []);

  const toggleRecording = () => {
    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) return;

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
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
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  const submit = () => {
    if (!transcript.trim()) return;
    onSubmit(transcript.trim());
    setTranscript("");
  };

  return (
    <div className="space-y-3">
      {supported ? (
        <Button
          type="button"
          variant={recording ? "destructive" : "outline"}
          className="w-full"
          onClick={toggleRecording}
        >
          {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {recording ? "Stop recording" : "Speak your pantry"}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          Voice input isn't supported in this browser — type what's in your pantry instead.
        </p>
      )}
      <Textarea
        placeholder="e.g. Two cans of chickpeas, a bag of rice, some spinach…"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={3}
      />
      <Button type="button" className="w-full" variant="outline" onClick={submit}>
        Parse items
      </Button>
    </div>
  );
}
