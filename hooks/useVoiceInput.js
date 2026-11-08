"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useVoiceInput
 * 
 * Production-ready Web Speech API hook for Krishi Mama AI Farmer Assistant.
 * Provides accessible, privacy-preserving speech-to-text with:
 * - Default 'bn-BD' (Bangla - Bangladesh) and 'en-US' (English) language support.
 * - Accurate listening / idle state synchronization (guaranteed onend cleanup).
 * - Real-time interim transcription display.
 * - Comprehensive error handling (permission-denied, no-speech, network, unsupported).
 * - Safe for Next.js SSR / hydration.
 */
export function useVoiceInput({
  initialLang = "bn-BD",
  onFinalTranscript,
  onInterimTranscript,
} = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState(initialLang);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorCode, setErrorCode] = useState(null); // 'PERMISSION_DENIED' | 'UNSUPPORTED' | 'NO_SPEECH' | 'NETWORK' | 'AUDIO_CAPTURE' | 'UNKNOWN'
  const [errorDetails, setErrorDetails] = useState("");

  const recognitionRef = useRef(null);
  const isManuallyStoppingRef = useRef(false);
  const onFinalRef = useRef(onFinalTranscript);
  const onInterimRef = useRef(onInterimTranscript);

  // Keep callback refs fresh without re-triggering effects
  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
    onInterimRef.current = onInterimTranscript;
  }, [onFinalTranscript, onInterimTranscript]);

  // Synchronize language when initialLang prop changes
  useEffect(() => {
    setLang(initialLang);
  }, [initialLang]);

  // Check Web Speech API availability on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  // Stop listening gracefully
  const stopListening = useCallback(() => {
    isManuallyStoppingRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition may already be stopped
      }
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  // Abort listening immediately
  const abortListening = useCallback(() => {
    isManuallyStoppingRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Recognition may already be stopped
      }
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  // Start speech recognition
  const startListening = useCallback(() => {
    setErrorCode(null);
    setErrorDetails("");
    setInterimTranscript("");
    isManuallyStoppingRef.current = false;

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorCode("UNSUPPORTED");
      return;
    }

    // Stop previous instance if active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang || "bn-BD";
      // continuous = false ensures reliable phrase capture, natural sentence termination, and smooth mobile behavior
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorCode(null);
        setErrorDetails("");
      };

      recognition.onresult = (event) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcriptPiece = res[0]?.transcript || "";
          if (res.isFinal) {
            final += transcriptPiece;
          } else {
            interim += transcriptPiece;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
          if (onInterimRef.current) {
            onInterimRef.current(interim);
          }
        }

        if (final) {
          setInterimTranscript("");
          if (onFinalRef.current) {
            onFinalRef.current(final.trim());
          }
        }
      };

      recognition.onerror = (event) => {
        const error = event.error;

        // If user manually stopped, ignore 'aborted' or 'no-speech'
        if (isManuallyStoppingRef.current && (error === "aborted" || error === "no-speech")) {
          return;
        }

        if (error === "not-allowed" || error === "service-not-allowed") {
          setErrorCode("PERMISSION_DENIED");
          setErrorDetails(event.message || "Microphone access was denied.");
        } else if (error === "no-speech") {
          setErrorCode("NO_SPEECH");
          setErrorDetails("No speech was detected.");
        } else if (error === "network") {
          setErrorCode("NETWORK");
          setErrorDetails("Network error occurred during speech recognition.");
        } else if (error === "audio-capture") {
          setErrorCode("AUDIO_CAPTURE");
          setErrorDetails("No microphone was detected on this device.");
        } else if (error !== "aborted") {
          setErrorCode("UNKNOWN");
          setErrorDetails(event.message || `Speech recognition error: ${error}`);
        }
      };

      recognition.onend = () => {
        // Always reset active listening state
        setIsListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setInterimTranscript("");
      if (err.name === "NotAllowedError" || err.message?.includes("permission")) {
        setErrorCode("PERMISSION_DENIED");
      } else {
        setErrorCode("UNKNOWN");
      }
      setErrorDetails(err.message || "Failed to initialize microphone.");
    }
  }, [lang]);

  // Toggle listening helper
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const clearError = useCallback(() => {
    setErrorCode(null);
    setErrorDetails("");
  }, []);

  return {
    isSupported,
    isListening,
    lang,
    setLang,
    interimTranscript,
    errorCode,
    errorDetails,
    startListening,
    stopListening,
    abortListening,
    toggleListening,
    clearError,
  };
}
