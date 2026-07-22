import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Voice transcription via the browser Web Speech API (SpeechRecognition).
 *
 * This provides real, client-side speech-to-text for the demo with no backend
 * or API key. In production this is replaced by a secure edge function calling
 * a proper STT provider (EN/AR) — see docs/INTEGRATIONS.md — but the UX contract
 * is identical: record → transcript shown for correction → never auto-order.
 *
 * Supported in Chromium browsers (Chrome/Edge). `supported` is false elsewhere,
 * and the assistant falls back to typing.
 */

/* Minimal Web Speech API typings (not in the default TS DOM lib). */
interface SpeechRecognitionAlternativeLike { transcript: string }
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike
  isFinal: boolean
  length: number
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: { length: number; [index: number]: SpeechRecognitionResultLike }
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useSpeechRecognition() {
  const supported = typeof window !== 'undefined' && getCtor() !== null
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const reset = useCallback(() => {
    setTranscript('')
    setInterim('')
    setError(null)
  }, [])

  const start = useCallback((lang: string) => {
    const Ctor = getCtor()
    if (!Ctor) {
      setError('unsupported')
      return
    }
    setError(null)
    setInterim('')
    const rec = new Ctor()
    rec.lang = lang
    rec.continuous = true
    rec.interimResults = true

    rec.onresult = (e) => {
      let finalChunk = ''
      let interimChunk = ''
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const res = e.results[i]
        if (res.isFinal) finalChunk += res[0].transcript
        else interimChunk += res[0].transcript
      }
      if (finalChunk) setTranscript((prev) => (prev ? `${prev} ${finalChunk}` : finalChunk).trim())
      setInterim(interimChunk)
    }
    rec.onerror = (ev) => {
      setError(ev.error)
      setListening(false)
    }
    rec.onend = () => setListening(false)

    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }, [])

  useEffect(() => () => recognitionRef.current?.abort(), [])

  return { supported, listening, transcript, interim, error, start, stop, reset, setTranscript }
}
