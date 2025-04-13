import React from "react";
import VoiceToTextFIR from "./VoiceToTextFIR";

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto p-4 max-w-xl">
        <h1 className="text-2xl font-bold mb-4 text-center text-white">🎙️ FIR Voice Transcription</h1>
        <VoiceToTextFIR />
      </div>
    </div>
  );
}

export default App;
