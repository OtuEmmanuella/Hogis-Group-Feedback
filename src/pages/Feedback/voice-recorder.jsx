import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

const VoiceRecorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorder = useRef(null);
  const timerInterval = useRef(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    return () => {
      if (mediaRecorder.current?.state === 'recording') {
        stopRecording();
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Use WAV format instead of WebM
      const mimeType = 'audio/wav';
      
      mediaRecorder.current = new MediaRecorder(stream);

      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        
        // Check file size (10MB limit)
        if (audioBlob.size > 10 * 1024 * 1024) {
          setError('Audio recording exceeds 10MB limit. Please record a shorter message.');
          setAudioURL(null);
          onRecordingComplete(null);
          return;
        }

        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          onRecordingComplete(reader.result);
        };
      };

      mediaRecorder.current.start(250);
      setIsRecording(true);

      // Limit recording to 3 minutes
      const maxRecordingTime = 180; // 3 minutes in seconds
      timerInterval.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxRecordingTime) {
            stopRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone access error:', err);
      let message = 'Unable to access microphone. ';

      switch (err.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          message += 'Please enable microphone access in your browser settings.';
          break;
        case 'NotFoundError':
          message = 'No microphone detected. Please connect a microphone and try again.';
          break;
        case 'NotSupportedError':
          message = 'Audio recording is not supported in this browser. Please use Chrome, Safari, or Firefox.';
          break;
        default:
          message += err.message || 'Please check your browser settings and try again.';
      }

      setError(message);
      stopRecording();
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      clearInterval(timerInterval.current);
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const deleteRecording = () => {
    setAudioURL(null);
    setError(null);
    onRecordingComplete(null);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-red-500 text-sm mb-2 whitespace-pre-line p-3 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {!audioURL ? (
        <Button
          type="button"
          variant="outline"
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 ${
            isRecording ? 'bg-red-600 hover:bg-red-700' : ''
          }`}
        >
          {isRecording ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Stop ({formatTime(recordingTime)})
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              Record Voice
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-2">
          <audio 
            src={audioURL} 
            controls 
            className="w-full h-10 rounded-lg bg-gray-800"
          />
          <Button
            type="button"
            variant="outline"
            onClick={deleteRecording}
            className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Recording
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;