import React, { useState, useRef } from 'react';

// Language code to full name mapping
const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
  hi: 'Hindi',
  bn: 'Bengali',
  // Add more languages as needed
};

function VoiceToTextFIR() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [isTranslation, setIsTranslation] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 16000
      });
      
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
          const response = await fetch('http://localhost:5000/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          if (data.error) {
            setError(data.error);
          } else {
            setTranscript(data.transcript);
            setDetectedLanguage(data.language);
            setIsTranslation(data.is_translation);
            setError('');
          }
        } catch (err) {
          console.error('Error:', err);
          setError('Failed to send audio to server: ' + err.message);
        }
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setError('');
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Failed to access microphone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center space-x-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-4 py-2 rounded-full ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white font-semibold transition-colors`}
        >
          {isRecording ? '⏹️ Stop Recording' : '🎙️ Start Recording'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-center">{error}</div>
      )}

      {transcript && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-semibold">Transcription</h2>
            {detectedLanguage && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                  Original: {LANGUAGE_NAMES[detectedLanguage] || detectedLanguage}
                </span>
                {isTranslation && (
                  <span className="px-2 py-1 text-sm bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                    <span>🔄</span>
                    <span>Translated to English</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="whitespace-pre-wrap">{transcript}</p>
        </div>
      )}
    </div>
  );
}

export default VoiceToTextFIR; 