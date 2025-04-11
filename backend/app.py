from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import os
import uuid

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # ✅ Enable CORS for all origins (dev-friendly)

# Load Whisper model
model = whisper.load_model("base")

# Upload folder setup
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio = request.files["audio"]
    filename = f"{uuid.uuid4()}.wav"
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    try:
        # Save uploaded file
        audio.save(filepath)

        # Transcribe using Whisper
        result = model.transcribe(filepath)

        # Clean up
        os.remove(filepath)

        # Return transcription
        return jsonify({"transcript": result["text"]})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run the app
if __name__ == "__main__":
    app.run(debug=True, port=5000)
