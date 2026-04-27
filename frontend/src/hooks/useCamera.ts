/**
 * Camera hook — getUserMedia stream management
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { readStoredUiLanguage } from '@/lib/uiLanguageStorage';
import { getUIText } from '@/utils/i18n';

export type CameraFacingMode = 'user' | 'environment';

interface UseCameraOptions {
  facingMode?: CameraFacingMode;
  onError?: (error: Error) => void;
}

function mapCameraError(err: unknown): Error {
  const lang = readStoredUiLanguage();
  const name = err instanceof Error ? err.name : '';
  const message = err instanceof Error ? err.message : String(err);
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return new Error(getUIText('cameraErrPermissionDenied', lang));
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return new Error(getUIText('cameraErrNotFound', lang));
  }
  return new Error(
    getUIText('cameraErrGeneric', lang).replace(/\{\{detail\}\}/g, message),
  );
}

export function useCamera(options: UseCameraOptions = {}) {
  const { facingMode = 'environment', onError } = options;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      const mapped = mapCameraError(err);
      setError(mapped);
      onError?.(mapped);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, onError]);

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

  const switchCamera = useCallback(
    async (newFacingMode: CameraFacingMode) => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

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
      } catch (err: unknown) {
        const mapped = mapCameraError(err);
        setError(mapped);
        onError?.(mapped);
      } finally {
        setIsLoading(false);
      }
    },
    [onError],
  );

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
