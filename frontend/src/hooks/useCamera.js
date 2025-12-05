import { useState, useEffect, useRef } from 'react';

const useCamera = () => {
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);

    useEffect(() => {
        if (isCameraActive) {
            const startCamera = async () => {
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: { ideal: 640 },
                            height: { ideal: 480 },
                            facingMode: "user"
                        }
                    });
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                } catch (err) {
                    console.error("Camera error:", err);
                    setIsCameraActive(false);
                }
            };
            startCamera();
        } else {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    }, [isCameraActive]);

    const toggleCamera = () => {
        setIsCameraActive(prev => !prev);
    };

    return { isCameraActive, toggleCamera, videoRef };
};

export default useCamera;
