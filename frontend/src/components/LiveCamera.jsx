import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

export default function LiveCamera({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      // Clean up on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Failed to access camera: " + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageSrc = canvas.toDataURL('image/jpeg');
      setImgSrc(imageSrc);
      stopCamera();
      
      // Convert base64 to File object
      canvas.toBlob((blob) => {
        if (blob) {
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
            onCapture(file);
        }
      }, 'image/jpeg');
    }
  };

  const retake = () => {
    setImgSrc(null);
    onCapture(null);
    startCamera();
  };

  return (
    <div className="live-camera-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%' }}>
      {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</div>}
      
      {imgSrc ? (
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px', borderRadius: '8px', overflow: 'hidden' }}>
          <img src={imgSrc} alt="captured" style={{ width: '100%', display: 'block' }} />
          <button 
            type="button"
            onClick={retake} 
            className="btn btn-secondary" 
            style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '0.5rem' }}
          >
            <RefreshCw size={16} style={{ marginRight: '4px' }}/> Retake
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#000', minHeight: '200px' }} 
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <button type="button" onClick={capture} className="btn btn-primary" style={{ width: '100%' }} disabled={!stream}>
            <Camera size={18} style={{ marginRight: '8px' }} /> Capture Photo
          </button>
        </div>
      )}
    </div>
  );
}
