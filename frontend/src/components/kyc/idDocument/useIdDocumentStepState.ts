'use client';

import { useState, useEffect } from 'react';
import { IdDocumentData, IdType } from '@/types/kyc.types';
import { useCamera } from '@/hooks/useCamera';
import { canvasToBlob, resizeImage } from '@/utils/imageUtils';
import type { IdDocumentStepProps } from './types';

export function useIdDocumentStepState({ currentLanguage, onComplete, onNext }: IdDocumentStepProps) {
  const [step, setStep] = useState<'select' | 'camera' | 'preview' | 'form'>('select');
  const [idType, setIdType] = useState<IdType | null>(null);
  const [captureStep, setCaptureStep] = useState<'front' | 'back'>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    idNumber: '',
    fullName: '',
    dateOfBirth: '',
    issueDate: '',
    expiryDate: '',
  });
  const [error, setError] = useState<string>('');
  const [capturing, setCapturing] = useState(false);

  const { videoRef, stream, isLoading, error: cameraError, startCamera, stopCamera, captureFrame } = useCamera({
    facingMode: 'environment',
    onError: (err) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    if (step === 'camera' && !stream) {
      startCamera();
    }
    return () => {
      if (step !== 'camera') {
        stopCamera();
      }
    };
  }, [step, stream, startCamera, stopCamera]);

  const openIdCardCamera = () => {
    setIdType('id_card');
    setStep('camera');
  };

  const openPassportCamera = () => {
    setIdType('passport');
    setStep('camera');
  };

  const handleCapture = async () => {
    if (!stream || capturing) return;

    setCapturing(true);
    try {
      const canvas = captureFrame();
      if (!canvas) {
        throw new Error('캔버스를 생성할 수 없습니다');
      }

      const blob = await canvasToBlob(canvas, 0.9);
      const resizedBlob = await resizeImage(new File([blob], 'capture.jpg', { type: 'image/jpeg' }), 1920, 1080, 0.85);

      const file = new File([resizedBlob], `${captureStep}_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const imageUrl = URL.createObjectURL(file);

      if (captureStep === 'front') {
        setFrontImage(imageUrl);
        setFrontImageFile(file);
        if (idType === 'id_card') {
          setCaptureStep('back');
        } else {
          setStep('preview');
          stopCamera();
        }
      } else {
        setBackImage(imageUrl);
        setBackImageFile(file);
        setStep('preview');
        stopCamera();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '촬영에 실패했습니다');
    } finally {
      setCapturing(false);
    }
  };

  const handleRetake = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontImage(null);
      setFrontImageFile(null);
      setCaptureStep('front');
      setStep('camera');
      startCamera();
    } else {
      setBackImage(null);
      setBackImageFile(null);
      setCaptureStep('back');
      setStep('camera');
      startCamera();
    }
  };

  const handleConfirmImage = () => {
    setStep('form');
  };

  const handleSubmit = () => {
    if (!formData.idNumber || !formData.fullName || !formData.dateOfBirth) {
      setError(
        currentLanguage === 'ko'
          ? '필수 항목을 모두 입력해주세요'
          : currentLanguage === 'vi'
            ? 'Vui lòng điền đầy đủ các trường bắt buộc'
            : currentLanguage === 'ja'
              ? '必須項目をすべて入力してください'
              : currentLanguage === 'zh'
                ? '请填写所有必填项'
                : 'Please fill in all required fields',
      );
      return;
    }

    if (!idType || !frontImageFile) {
      setError(
        currentLanguage === 'ko'
          ? '이미지를 선택해주세요'
          : currentLanguage === 'vi'
            ? 'Vui lòng chọn hình ảnh'
            : currentLanguage === 'ja'
              ? '画像を選択してください'
              : currentLanguage === 'zh'
                ? '请选择图片'
                : 'Please select an image',
      );
      return;
    }

    const idDocumentData: IdDocumentData = {
      type: idType,
      idNumber: formData.idNumber,
      fullName: formData.fullName,
      dateOfBirth: formData.dateOfBirth,
      ...(formData.issueDate && { issueDate: formData.issueDate }),
      ...(formData.expiryDate && { expiryDate: formData.expiryDate }),
      imageUrl: frontImage || undefined,
    };

    onComplete(idDocumentData, frontImageFile, backImageFile || undefined);
  };

  const handleBackToSelect = () => {
    stopCamera();
    setStep('select');
  };

  const handleTestModeButton = () => {
    if (onNext) {
      onNext();
    } else {
      const dummyData: IdDocumentData = {
        type: 'id_card',
        idNumber: 'TEST123456',
        fullName: 'Test User',
        dateOfBirth: '1990-01-01',
        issueDate: '',
        expiryDate: '',
      };
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.fillText('Test ID Document', 50, 250);
      }
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const dummyFile = new File([blob], 'test-id-front.jpg', { type: 'image/jpeg' });
            onComplete(dummyData, dummyFile);
          }
        },
        'image/jpeg',
      );
    }
  };

  const handlePreviewSecondary = () => {
    if (idType === 'id_card' && !backImage) {
      setStep('camera');
      setCaptureStep('back');
      startCamera();
    } else {
      handleConfirmImage();
    }
  };

  return {
    currentLanguage,
    step,
    idType,
    captureStep,
    frontImage,
    backImage,
    frontImageFile,
    backImageFile,
    formData,
    setFormData,
    error,
    setError,
    capturing,
    videoRef,
    stream,
    isLoading,
    cameraError,
    startCamera,
    stopCamera,
    openIdCardCamera,
    openPassportCamera,
    handleCapture,
    handleRetake,
    handleConfirmImage,
    handleSubmit,
    handleBackToSelect,
    handleTestModeButton,
    handlePreviewSecondary,
  };
}
