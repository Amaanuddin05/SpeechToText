from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import os
import uuid
import torch
import torchaudio
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # ✅ Enable CORS for all origins (dev-friendly)

# Load Whisper model
model = whisper.load_model("base")

# Upload folder setup
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def preprocess_audio(filepath):
    """Preprocess audio file to ensure it's in the correct format for Whisper"""
    try:
        # Load the audio file
        logger.info(f"Loading audio file: {filepath}")
        waveform, sample_rate = torchaudio.load(filepath)
        
        # Resample to 16kHz if needed (Whisper expects 16kHz)
        if sample_rate != 16000:
            logger.info(f"Resampling from {sample_rate}Hz to 16000Hz")
            resampler = torchaudio.transforms.Resample(sample_rate, 16000)
            waveform = resampler(waveform)
        
        # Convert to mono if stereo
        if waveform.shape[0] > 1:
            logger.info("Converting stereo to mono")
            waveform = torch.mean(waveform, dim=0, keepdim=True)
        
        # Normalize audio
        waveform = waveform / torch.max(torch.abs(waveform))
        
        # Save the preprocessed audio
        processed_filepath = filepath.replace('.webm', '_processed.wav')
        logger.info(f"Saving processed audio to: {processed_filepath}")
        torchaudio.save(processed_filepath, waveform, 16000)
        
        return processed_filepath
    except Exception as e:
        logger.error(f"Error in audio preprocessing: {str(e)}")
        raise

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio = request.files["audio"]
    if not audio.filename:
        return jsonify({"error": "Empty filename"}), 400

    filename = f"{uuid.uuid4()}.webm"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    processed_filepath = None

    try:
        # Save uploaded file
        logger.info(f"Saving uploaded file to: {filepath}")
        audio.save(filepath)
        
        # Preprocess the audio
        processed_filepath = preprocess_audio(filepath)
        logger.info("Audio preprocessing completed")

        # Transcribe using Whisper
        logger.info("Starting transcription")
        result = model.transcribe(processed_filepath)
        logger.info("Transcription completed")

        # Return transcription
        return jsonify({"transcript": result["text"]})
    
    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
    finally:
        # Clean up
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
            if processed_filepath and os.path.exists(processed_filepath):
                os.remove(processed_filepath)
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")

# Run the app
if __name__ == "__main__":
    app.run(debug=True, port=5000)
