/**
 * 카메라 훅
 * 
 * getUserMedia를 사용한 실시간 카메라 스트림 관리
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export type CameraFacingMode = 'user' | 'environment';

interface UseCameraOptions {
  facingMode?: CameraFacingMode;
  onError?: (error: Error) => void;
}

export function useCamera(options: UseCameraOptions = {}) {
  const { facingMode = 'environment', onError } = options;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);

      // 비디오 요소에 스트림 연결
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      
      // 권한 거부 에러 처리
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(new Error('카메라 권한이 거부되었습니다. 설정에서 카메라 권한을 허용해주세요.'));
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError(new Error('카메라를 찾을 수 없습니다.'));
      } else {
        setError(new Error(`카메라 오류: ${err.message}`));
      }
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, onError]);

  // 카메라 중지
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // 카메라 전환 (전면/후면)
  const switchCamera = useCallback(async (newFacingMode: CameraFacingMode) => {
    // 기존 스트림 정리
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    await new Promise((resolve) => setTimeout(resolve, 100)); // 짧은 지연
    
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: newFacingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    try {
      setIsLoading(true);
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(new Error('카메라 권한이 거부되었습니다. 설정에서 카메라 권한을 허용해주세요.'));
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError(new Error('카메라를 찾을 수 없습니다.'));
      } else {
        setError(new Error(`카메라 오류: ${err.message}`));
      }
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // 비디오에서 캔버스로 캡처
  const captureFrame = useCallback((): HTMLCanvasElement | null => {
    if (!videoRef.current || !stream) {
      return null;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }, [stream]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    stream,
    isLoading,
    error,
    startCamera,
    stopCamera,
    switchCamera,
    captureFrame,
  };
}
