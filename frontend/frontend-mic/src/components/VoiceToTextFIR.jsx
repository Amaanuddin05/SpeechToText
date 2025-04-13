import React, { useState } from "react";
import { ReactMic } from "react-mic";
import axios from "axios";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

const VoiceToTextFIR = () => {
  const [record, setRecord] = useState(false);
  const [blob, setBlob] = useState(null);
  const [text, setText] = useState("");

  const startRecording = () => setRecord(true);
  const stopRecording = () => setRecord(false);

  const onStop = (recordedBlob) => {
    setBlob(recordedBlob.blob);
    uploadAudio(recordedBlob.blob);
  };

  const uploadAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    try {
      const res = await axios.post("http://localhost:5000/transcribe", formData);
      setText(res.data.transcript);
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <label className="block text-lg font-medium text-gray-200">
          FIR Description (Voice Input)
        </label>
        <textarea
          className="w-full p-4 border rounded-lg bg-gray-800 text-gray-200 border-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your voice input will appear here..."
        />
        <div className="rounded-lg overflow-hidden bg-gradient-to-r from-orange-500 to-pink-500 p-1">
          <div className="bg-gray-900 rounded-lg">
            <ReactMic
              record={record}
              className="sound-wave w-full"
              onStop={onStop}
              strokeColor="#f97316"
              backgroundColor="#111827"
              mimeType="audio/wav"
            />
          </div>
        </div>
        <button
          onClick={record ? stopRecording : startRecording}
          className={`w-full py-3 rounded-lg flex items-center justify-center space-x-2 text-lg font-medium transition-all duration-200 ${
            record
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          }`}
        >
          {record ? (
            <>
              <FaMicrophoneSlash className="w-5 h-5" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <FaMicrophone className="w-5 h-5" />
              <span>Start Recording</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceToTextFIR;
