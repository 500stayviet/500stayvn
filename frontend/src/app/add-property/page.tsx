'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrentUserData } from '@/lib/api/auth';
import { addProperty, getPropertyCountByOwner } from '@/lib/api/properties';
import { searchPlaceIndexForSuggestions, searchPlaceIndexForText, getLocationServiceLanguage } from '@/lib/api/aws-location';
import { Camera, MapPin, Loader2, X, Bed, Bath, Wind, Sofa, UtensilsCrossed, WashingMachine, Refrigerator, Table, Shirt, Wifi, Maximize2, ArrowLeft, Check, Calendar, Users, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import TopBar from '@/components/TopBar';
import CalendarComponent from '@/components/CalendarComponent';

// 편의시설 옵션 정의
const AMENITY_OPTIONS = [
  { id: 'bed', label: { ko: '침대', vi: 'Giường', en: 'Bed' }, icon: Bed },
  { id: 'aircon', label: { ko: '에어컨', vi: 'Điều hòa', en: 'Air Conditioner' }, icon: Wind },
  { id: 'sofa', label: { ko: '소파', vi: 'Ghế sofa', en: 'Sofa' }, icon: Sofa },
  { id: 'kitchen', label: { ko: '주방', vi: 'Bếp', en: 'Kitchen' }, icon: UtensilsCrossed },
  { id: 'washing', label: { ko: '세탁기', vi: 'Máy giặt', en: 'Washing Machine' }, icon: WashingMachine },
  { id: 'refrigerator', label: { ko: '냉장고', vi: 'Tủ lạnh', en: 'Refrigerator' }, icon: Refrigerator },
  { id: 'table', label: { ko: '식탁', vi: 'Bàn ăn', en: 'Dining Table' }, icon: Table },
  { id: 'wardrobe', label: { ko: '옷장', vi: 'Tủ quần áo', en: 'Wardrobe' }, icon: Shirt },
  { id: 'wifi', label: { ko: '와이파이', vi: 'WiFi', en: 'WiFi' }, icon: Wifi },
] as const;

export default function AddPropertyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  // 폼 상태
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [apartmentName, setApartmentName] = useState('');
  const [buildingNumber, setBuildingNumber] = useState(''); // 동
  const [roomNumber, setRoomNumber] = useState(''); // 호실
  const [weeklyRent, setWeeklyRent] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [maxAdults, setMaxAdults] = useState(1);
  const [maxChildren, setMaxChildren] = useState(0);
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  
  // 임대 희망 날짜
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'checkin' | 'checkout'>('checkin');
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);

  // 사진첩 모달 상태
  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);
  const [photoLibraryFiles, setPhotoLibraryFiles] = useState<File[]>([]);
  const [photoLibraryPreviews, setPhotoLibraryPreviews] = useState<string[]>([]);
  const [selectedLibraryIndices, setSelectedLibraryIndices] = useState<Set<number>>(new Set());
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState<number | null>(null);

  // 이미지 소스 선택 메뉴 상태
  const [showImageSourceMenu, setShowImageSourceMenu] = useState(false);
  const [showGuidelinePopup, setShowGuidelinePopup] = useState(false);
  const photoLibraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // AWS Location Service 주소 자동완성
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 주소 검증 상태
  const [addressValidationStatus, setAddressValidationStatus] = useState<'none' | 'validating' | 'valid' | 'invalid'>('none');
  const [showMapPreview, setShowMapPreview] = useState(false);
  const mapPreviewRef = useRef<HTMLDivElement>(null);

  // 접근 권한 확인
  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userData = await getCurrentUserData(user.uid);
        
        // KYC 1~3단계 토큰이 모두 있어야 매물 등록 가능
        const kycSteps = userData?.kyc_steps || {};
        const allStepsCompleted = kycSteps.step1 && kycSteps.step2 && kycSteps.step3;
        
        if (userData?.is_owner === true && allStepsCompleted) {
          setHasAccess(true);
        } else {
          router.push('/profile');
        }
      } catch (error) {
        router.push('/profile');
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [user, authLoading, router]);

  // 주소 입력 시 추천 목록 가져오기 (AWS Location Service)
  const handleAddressInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    
    // 주소가 변경되면 좌표 초기화 및 검증 상태 리셋
    if (value !== address) {
      setCoordinates(null);
      setAddressValidationStatus('none');
      setShowMapPreview(false);
    }

    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      setAddressValidationStatus('none');
      return;
    }

    // 디바운싱: 300ms 후 검색
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const language = getLocationServiceLanguage(currentLanguage);
        const suggestions = await searchPlaceIndexForSuggestions(value, language);
        setAddressSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
        
        // 자동완성 목록이 없으면 직접 입력한 주소로 검증 시도
        if (suggestions.length === 0 && value.trim().length > 5) {
          setAddressValidationStatus('validating');
          await validateAddressDirectly(value, language);
        }
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setAddressSuggestions([]);
        setShowSuggestions(false);
        setAddressValidationStatus('invalid');
      }
    }, 300);
  };

  // 직접 입력한 주소 검증
  const validateAddressDirectly = async (addressText: string, language: string) => {
    try {
      const results = await searchPlaceIndexForText(addressText, language);
      
      if (results.length > 0) {
        const result = results[0];
        const position = result.Place?.Geometry?.Point || [];
        
        if (position.length >= 2) {
          setCoordinates({ 
            lat: position[1],
            lng: position[0]
          });
          setAddressValidationStatus('valid');
          setShowMapPreview(true);
          console.log('✅ 주소 검증 성공 및 좌표 설정:', { lat: position[1], lng: position[0] });
        } else {
          setAddressValidationStatus('invalid');
        }
      } else {
        setAddressValidationStatus('invalid');
      }
    } catch (error) {
      console.error('Error validating address:', error);
      setAddressValidationStatus('invalid');
    }
  };

  // 추천 주소 선택
  const handleSelectSuggestion = async (suggestion: any) => {
    const text = suggestion.Text || '';
    setAddress(text);
    setShowSuggestions(false);
    setAddressSuggestions([]);
    setAddressValidationStatus('validating');

    try {
      // 선택한 주소의 상세 정보 가져오기
      const language = getLocationServiceLanguage(currentLanguage);
      const results = await searchPlaceIndexForText(text, language);
      
      if (results.length > 0) {
        const result = results[0];
        const position = result.Place?.Geometry?.Point || [];
        
        if (position.length >= 2) {
          setCoordinates({ 
            lat: position[1], // 위도
            lng: position[0]  // 경도
          });
          setAddressValidationStatus('valid');
          setShowMapPreview(true);
          console.log('✅ Coordinates set:', { lat: position[1], lng: position[0] });
        } else {
          setAddressValidationStatus('invalid');
        }
        
        if (result.Place?.Label) {
          setAddress(result.Place.Label);
        }
      } else {
        setAddressValidationStatus('invalid');
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      setAddressValidationStatus('invalid');
    }
  };

  // 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 사진첩 열기 핸들러
  const handleOpenPhotoLibrary = () => {
    photoLibraryInputRef.current?.click();
  };

  // 사진첩에서 파일 선택 시
  const handlePhotoLibrarySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 사진첩에 파일 저장
    setPhotoLibraryFiles(files);
    
    // 미리보기 생성
    const previews = files.map(file => URL.createObjectURL(file));
    setPhotoLibraryPreviews(previews);
    
    // 선택 초기화
    setSelectedLibraryIndices(new Set());
    
    // 사진첩 모달 열기
    setShowPhotoLibrary(true);
    
    // input 초기화
    e.target.value = '';
  };

  // 사진첩에서 사진 선택/해제
  const togglePhotoSelection = (index: number) => {
    const maxSelectable = 5 - images.length;
    if (maxSelectable <= 0) return;

    setSelectedLibraryIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        if (newSet.size < maxSelectable) {
          newSet.add(index);
        }
      }
      return newSet;
    });
  };

  // 선택한 사진들을 추가
  const handleConfirmPhotoSelection = () => {
    const selectedFiles = Array.from(selectedLibraryIndices)
      .sort((a, b) => a - b)
      .map(index => photoLibraryFiles[index]);

    if (selectedFiles.length === 0) return;

    const newImages = [...images, ...selectedFiles];
    setImages(newImages);

    // 미리보기 생성
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);

    // 사진첩 닫기 및 정리
    setShowPhotoLibrary(false);
    setPhotoLibraryFiles([]);
    photoLibraryPreviews.forEach(url => URL.revokeObjectURL(url));
    setPhotoLibraryPreviews([]);
    setSelectedLibraryIndices(new Set());
    setFullScreenImageIndex(null);
  };

  // 전체화면 이미지 보기
  const handleViewFullScreen = (index: number) => {
    setFullScreenImageIndex(index);
  };

  // 전체화면에서 사진첩으로 돌아가기
  const handleBackToLibrary = () => {
    setFullScreenImageIndex(null);
  };

  // 카메라로 촬영 핸들러
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 5 - images.length;
    if (remainingSlots === 0) return;

    const file = files[0];
    const newImages = [...images, file];
    setImages(newImages);

    // 미리보기 생성
    const preview = URL.createObjectURL(file);
    setImagePreviews([...imagePreviews, preview]);
    
    // input 초기화
    e.target.value = '';
  };

  // 이미지 추가 버튼 클릭 (사진첩 또는 카메라 선택) - ref는 이미 위에서 선언됨

  const handleAddImageClick = () => {
    if (images.length >= 5) return;
    
    // 1시간에 한 번만 가이드라인 팝업 표시
    const GUIDELINE_STORAGE_KEY = 'property_guideline_last_shown';
    const lastShownTime = localStorage.getItem(GUIDELINE_STORAGE_KEY);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1시간 (밀리초)
    
    if (lastShownTime) {
      const timeSinceLastShown = now - parseInt(lastShownTime, 10);
      if (timeSinceLastShown < oneHour) {
        // 1시간이 지나지 않았으면 팝업 없이 바로 이미지 소스 메뉴 표시
        setShowImageSourceMenu(true);
        return;
      }
    }
    
    // 1시간이 지났거나 처음이면 가이드라인 팝업 표시
    setShowGuidelinePopup(true);
  };

  const handleSelectFromLibrary = () => {
    setShowImageSourceMenu(false);
    handleOpenPhotoLibrary();
  };

  const handleTakePhoto = () => {
    setShowImageSourceMenu(false);
    cameraInputRef.current?.click();
  };

  const handleGuidelinePopupClick = () => {
    setShowGuidelinePopup(false);
    
    // 가이드라인을 본 시간을 localStorage에 저장
    const GUIDELINE_STORAGE_KEY = 'property_guideline_last_shown';
    localStorage.setItem(GUIDELINE_STORAGE_KEY, Date.now().toString());
    
    setShowImageSourceMenu(true);
  };

  // 이미지 삭제 핸들러
  const handleImageRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // URL 해제
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // 편의시설 선택/해제
  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 정보 검증
    if (!address || address.trim() === '') {
      alert(currentLanguage === 'ko' 
        ? '주소를 입력해주세요.'
        : currentLanguage === 'vi'
        ? 'Vui lòng nhập địa chỉ.'
        : 'Please enter an address.');
      return;
    }

    // 좌표 검증
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      alert(currentLanguage === 'ko' 
        ? '주소를 선택하여 좌표를 설정해주세요. 주소 검색 후 목록에서 주소를 클릭해주세요.'
        : currentLanguage === 'vi'
        ? 'Vui lòng chọn địa chỉ để thiết lập tọa độ. Vui lòng nhấp vào địa chỉ từ danh sách sau khi tìm kiếm.'
        : 'Please select an address to set coordinates. Please click on an address from the search results.');
      return;
    }

    if (imagePreviews.length === 0) {
      alert(currentLanguage === 'ko' 
        ? '최소 1장의 사진을 등록해주세요.'
        : currentLanguage === 'vi'
        ? 'Vui lòng đăng ít nhất 1 ảnh.'
        : 'Please upload at least 1 image.');
      return;
    }

    if (!weeklyRent || weeklyRent.trim() === '') {
      alert(currentLanguage === 'ko' 
        ? '1주일 임대료를 입력해주세요.'
        : currentLanguage === 'vi'
        ? 'Vui lòng nhập giá thuê 1 tuần.'
        : 'Please enter weekly rent.');
      return;
    }

    const rentValue = parseInt(weeklyRent.replace(/\D/g, ''));
    if (isNaN(rentValue) || rentValue <= 0) {
      alert(currentLanguage === 'ko' 
        ? '유효한 임대료를 입력해주세요.'
        : currentLanguage === 'vi'
        ? 'Vui lòng nhập giá thuê hợp lệ.'
        : 'Please enter a valid rent amount.');
      return;
    }

    if (!user) {
      alert(currentLanguage === 'ko' 
        ? '로그인이 필요합니다.'
        : currentLanguage === 'vi'
        ? 'Cần đăng nhập.'
        : 'Please login.');
      return;
    }

    setLoading(true);
    try {
      // KYC 1~3단계 토큰 확인
      const userData = await getCurrentUserData(user.uid);
      const kycSteps = userData?.kyc_steps || {};
      const allStepsCompleted = kycSteps.step1 && kycSteps.step2 && kycSteps.step3;
      
      if (!allStepsCompleted) {
        alert(currentLanguage === 'ko' 
          ? '매물을 등록하려면 KYC 인증 1~3단계를 모두 완료해야 합니다.'
          : currentLanguage === 'vi'
          ? 'Bạn phải hoàn thành tất cả các bước xác thực KYC (1-3) để đăng bất động sản.'
          : 'You must complete all KYC verification steps (1-3) to register a property.');
        setLoading(false);
        router.push('/kyc');
        return;
      }

      // 인당 매물 수 제한 확인 (최대 5개)
      const propertyCount = await getPropertyCountByOwner(user.uid);
      if (propertyCount >= 5) {
        alert(currentLanguage === 'ko' 
          ? '매물은 인당 최대 5개까지 등록할 수 있습니다.'
          : currentLanguage === 'vi'
          ? 'Bạn chỉ có thể đăng tối đa 5 bất động sản.'
          : 'You can only register up to 5 properties.');
        setLoading(false);
        return;
      }

      // 동호수 조합 (비공개 - 별도 필드로만 저장)
      // 호실 번호는 4자리로 패딩 (예: 1호 → 0001호)
      const formatRoomNumber = (room: string) => {
        const num = parseInt(room.replace(/\D/g, ''));
        if (isNaN(num)) return room;
        return num.toString().padStart(4, '0');
      };

      const unitNumber = buildingNumber && roomNumber 
        ? `${buildingNumber}동 ${formatRoomNumber(roomNumber)}호`
        : buildingNumber 
        ? `${buildingNumber}동`
        : roomNumber
        ? `${formatRoomNumber(roomNumber)}호`
        : undefined;

      // 주소와 설명에는 동호수 포함하지 않음 (비공개)
      const publicAddress = `${apartmentName ? `${apartmentName}, ` : ''}${address}`;

      // 이미지를 base64로 변환하여 LocalStorage에 저장
      const imageUrls: string[] = [];
      for (const image of images) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
        imageUrls.push(base64);
      }

      // 날짜를 Date 객체로 변환 (LocalStorage용)
      const checkInDateObj = checkInDate || undefined;
      const checkOutDateObj = checkOutDate || undefined;

      await addProperty({
        title: apartmentName || address,
        original_description: publicAddress, // 동호수 제외
        translated_description: '', // 나중에 번역 서비스로 채움
        price: parseInt(weeklyRent.replace(/\D/g, '')),
        priceUnit: 'vnd',
        area: 0, // 나중에 추가 가능
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        coordinates: coordinates, // 좌표는 필수 (위에서 검증됨)
        address: publicAddress, // 동호수 제외
        images: imageUrls,
        amenities: selectedAmenities,
        unitNumber: unitNumber, // 동호수 (예약 완료 후에만 표시, 비공개)
        ownerId: user.uid, // 임대인 사용자 ID 저장
        checkInDate: checkInDateObj,
        checkOutDate: checkOutDateObj,
        maxAdults: maxAdults,
        maxChildren: maxChildren,
        status: 'active',
      });

      alert(currentLanguage === 'ko' 
        ? '매물이 성공적으로 등록되었습니다!'
        : currentLanguage === 'vi'
        ? 'Bất động sản đã được đăng ký thành công!'
        : 'Property registered successfully!');
      router.replace('/profile/my-properties');
    } catch (error) {
      console.error('매물 등록 실패:', error);
      alert(currentLanguage === 'ko' 
        ? '매물 등록 중 오류가 발생했습니다.'
        : currentLanguage === 'vi'
        ? 'Đã xảy ra lỗi khi đăng ký bất động sản.'
        : 'An error occurred while registering the property.');
    } finally {
      setLoading(false);
    }
  };

  // 접근 권한 확인 중
  if (checkingAccess || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          {currentLanguage === 'ko' ? '로딩 중...' : currentLanguage === 'vi' ? 'Đang tải...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="w-full max-w-[430px] mx-auto bg-white min-h-screen shadow-lg">
          {/* 상단 바 */}
          <TopBar 
            currentLanguage={currentLanguage}
            onLanguageChange={() => {}}
          />

          {/* 콘텐츠 */}
          <div className="px-6 py-6">
            {/* 헤더 */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {currentLanguage === 'ko' ? '새 매물 등록' : currentLanguage === 'vi' ? 'Đăng ký bất động sản mới' : 'Register New Property'}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLanguage === 'ko' ? '사진 등록' : currentLanguage === 'vi' ? 'Đăng ảnh' : 'Upload Photos'}
                  <span className="text-red-500 text-xs ml-1">*</span>
                  <span className="text-gray-500 text-xs ml-2">
                    ({images.length}/5)
                  </span>
                </label>
                
                
                <div className="grid grid-cols-3 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <>
                      <button
                        type="button"
                        onClick={handleAddImageClick}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Camera className="w-8 h-8 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">
                          {currentLanguage === 'ko' ? '추가' : currentLanguage === 'vi' ? 'Thêm' : 'Add'}
                        </span>
                      </button>
                      
                      {/* 숨겨진 input들 */}
                      <input
                        ref={photoLibraryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoLibrarySelect}
                        className="hidden"
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCameraCapture}
                        className="hidden"
                      />
                    </>
                  )}
                </div>

                {/* 이미지 소스 선택 메뉴 */}
                {showImageSourceMenu && (
                  <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowImageSourceMenu(false)}>
                    <div className="w-full bg-white rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                        {currentLanguage === 'ko' ? '사진 추가 방법 선택' : currentLanguage === 'vi' ? 'Chọn cách thêm ảnh' : 'Select Photo Source'}
                      </h3>
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={handleSelectFromLibrary}
                          className="w-full py-4 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
                        >
                          <Camera className="w-5 h-5" />
                          <span>{currentLanguage === 'ko' ? '사진첩에서 선택' : currentLanguage === 'vi' ? 'Chọn từ thư viện ảnh' : 'Select from Photo Library'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleTakePhoto}
                          className="w-full py-4 px-4 bg-gray-100 text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-3"
                        >
                          <Camera className="w-5 h-5" />
                          <span>{currentLanguage === 'ko' ? '카메라로 촬영' : currentLanguage === 'vi' ? 'Chụp ảnh' : 'Take Photo'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowImageSourceMenu(false)}
                          className="w-full py-3 px-4 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                        >
                          {currentLanguage === 'ko' ? '취소' : currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 사진첩 모달 (카톡 스타일) */}
                {showPhotoLibrary && (
                  <div className="fixed inset-0 bg-white z-50 flex flex-col">
                    {/* 헤더 */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPhotoLibrary(false);
                          setPhotoLibraryFiles([]);
                          photoLibraryPreviews.forEach(url => URL.revokeObjectURL(url));
                          setPhotoLibraryPreviews([]);
                          setSelectedLibraryIndices(new Set());
                          setFullScreenImageIndex(null);
                        }}
                        className="text-gray-700"
                      >
                        <X className="w-6 h-6" />
                      </button>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {currentLanguage === 'ko' ? '사진 선택' : currentLanguage === 'vi' ? 'Chọn ảnh' : 'Select Photos'}
                      </h2>
                      <div className="w-6" /> {/* 공간 맞춤 */}
                    </div>

                    {/* 사진 그리드 */}
                    <div className="flex-1 overflow-y-auto p-2">
                      <div className="grid grid-cols-4 gap-1">
                        {photoLibraryPreviews.map((preview, index) => {
                          const isSelected = selectedLibraryIndices.has(index);
                          return (
                            <div
                              key={index}
                              className="relative aspect-square"
                              onClick={() => togglePhotoSelection(index)}
                            >
                              <img
                                src={preview}
                                alt={`Photo ${index + 1}`}
                                className={`w-full h-full object-cover rounded ${
                                  isSelected ? 'opacity-50' : ''
                                }`}
                              />
                              {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center bg-blue-500/30 rounded">
                                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              )}
                              {/* 전체화면 보기 버튼 (우측 하단) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewFullScreen(index);
                                }}
                                className="absolute bottom-1 right-1 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
                              >
                                <Maximize2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 하단 버튼 */}
                    <div className="p-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleConfirmPhotoSelection}
                        disabled={selectedLibraryIndices.size === 0}
                        className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {currentLanguage === 'ko' 
                          ? `선택한 ${selectedLibraryIndices.size}장 추가`
                          : currentLanguage === 'vi'
                          ? `Thêm ${selectedLibraryIndices.size} ảnh đã chọn`
                          : `Add ${selectedLibraryIndices.size} selected`}
                      </button>
                    </div>
                  </div>
                )}

                {/* 전체화면 이미지 보기 */}
                {fullScreenImageIndex !== null && (
                  <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center">
                    <img
                      src={photoLibraryPreviews[fullScreenImageIndex]}
                      alt={`Full screen ${fullScreenImageIndex + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                    {/* 우측 하단: 사진첩으로 돌아가기 버튼 */}
                    <button
                      type="button"
                      onClick={handleBackToLibrary}
                      className="absolute bottom-6 right-6 bg-white/90 text-gray-900 rounded-full p-4 hover:bg-white transition-colors shadow-lg flex items-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span className="font-medium">
                        {currentLanguage === 'ko' ? '사진첩' : currentLanguage === 'vi' ? 'Thư viện ảnh' : 'Library'}
                      </span>
                    </button>
                    {/* 닫기 버튼 (좌측 상단) */}
                    <button
                      type="button"
                      onClick={handleBackToLibrary}
                      className="absolute top-6 left-6 bg-white/90 text-gray-900 rounded-full p-2 hover:bg-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>

              {/* 주소 입력 (자동완성) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLanguage === 'ko' ? '주소 입력 (자동완성)' : currentLanguage === 'vi' ? 'Nhập địa chỉ (Tự động hoàn thành)' : 'Enter Address (Autocomplete)'}
                  <span className="text-red-500 text-xs ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={address}
                    onChange={handleAddressInputChange}
                    onFocus={() => {
                      if (addressSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // 약간의 지연을 두어 클릭 이벤트가 먼저 발생하도록
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder={currentLanguage === 'ko' ? '주소를 입력하세요 (예: 41 hoang sa)' : currentLanguage === 'vi' ? 'Nhập địa chỉ (VD: 41 hoang sa)' : 'Enter address (e.g., 41 hoang sa)'}
                    className={`w-full px-4 py-2.5 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      addressValidationStatus === 'valid' 
                        ? 'border-green-500 bg-green-50' 
                        : addressValidationStatus === 'invalid'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200'
                    }`}
                    required
                  />
                  
                  {/* 좌표 설정 상태 아이콘 */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {addressValidationStatus === 'validating' && (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                    {addressValidationStatus === 'valid' && coordinates && (
                      <div className="flex items-center gap-1">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">
                          {currentLanguage === 'ko' ? '좌표 설정됨' : currentLanguage === 'vi' ? 'Đã thiết lập' : 'Set'}
                        </span>
                      </div>
                    )}
                    {addressValidationStatus === 'invalid' && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-xs text-red-500 font-medium">
                          {currentLanguage === 'ko' ? '주소 확인 필요' : currentLanguage === 'vi' ? 'Cần xác nhận' : 'Verify'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* 추천 주소 드롭다운 */}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.PlaceId || index}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {suggestion.Text}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* 주소 검증 상태 메시지 */}
                {addressValidationStatus === 'invalid' && address.trim().length > 5 && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {currentLanguage === 'ko' 
                      ? '주소를 확인할 수 없습니다. 자동완성 목록에서 주소를 선택해주세요.'
                      : currentLanguage === 'vi'
                      ? 'Không thể xác nhận địa chỉ. Vui lòng chọn địa chỉ từ danh sách tự động hoàn thành.'
                      : 'Address could not be verified. Please select an address from the autocomplete list.'}
                  </p>
                )}
                
                {/* 좌표 정보 및 지도 미리보기 */}
                {coordinates && addressValidationStatus === 'valid' && (
                  <div className="mt-3 space-y-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            {currentLanguage === 'ko' ? '위치 확인됨' : currentLanguage === 'vi' ? 'Vị trí đã xác nhận' : 'Location Confirmed'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowMapPreview(!showMapPreview)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          {showMapPreview 
                            ? (currentLanguage === 'ko' ? '지도 숨기기' : currentLanguage === 'vi' ? 'Ẩn bản đồ' : 'Hide Map')
                            : (currentLanguage === 'ko' ? '지도 보기' : currentLanguage === 'vi' ? 'Xem bản đồ' : 'Show Map')
                          }
                        </button>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Lat:</span> {coordinates.lat.toFixed(6)}
                        </div>
                        <div>
                          <span className="font-medium">Lng:</span> {coordinates.lng.toFixed(6)}
                        </div>
                      </div>
                      
                      {/* 지도 미리보기 */}
                      {showMapPreview && (
                        <div className="mt-3 border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                          <a
                            href={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative group"
                          >
                            <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center relative overflow-hidden">
                              {/* 간단한 지도 스타일 배경 */}
                              <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-4 left-4 w-16 h-16 border-2 border-gray-400 rounded"></div>
                                <div className="absolute top-8 left-8 w-12 h-12 border-2 border-gray-400 rounded"></div>
                                <div className="absolute bottom-4 right-4 w-20 h-20 border-2 border-gray-400 rounded"></div>
                                <div className="absolute bottom-8 right-8 w-14 h-14 border-2 border-gray-400 rounded"></div>
                              </div>
                              
                              {/* 중앙 마커 */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div className="w-8 h-8 bg-red-600 rounded-full border-4 border-white shadow-xl mb-2"></div>
                                <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-red-600"></div>
                              </div>
                              
                              {/* 호버 오버레이 */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black/60 px-4 py-2 rounded-full transition-opacity flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {currentLanguage === 'ko' ? 'Google 지도에서 보기' : currentLanguage === 'vi' ? 'Xem trên Google Maps' : 'View on Google Maps'}
                                </span>
                              </div>
                            </div>
                          </a>
                          <div className="px-3 py-2 bg-white border-t border-gray-200 text-xs text-gray-600 text-center">
                            {currentLanguage === 'ko' 
                              ? '클릭하여 Google 지도에서 위치 확인'
                              : currentLanguage === 'vi'
                              ? 'Nhấp để xem vị trí trên Google Maps'
                              : 'Click to view location on Google Maps'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {apartmentName && (
                  <p className="mt-2 text-sm text-gray-600">
                    {currentLanguage === 'ko' ? '아파트 이름' : currentLanguage === 'vi' ? 'Tên chung cư' : 'Apartment Name'}: {apartmentName}
                  </p>
                )}
              </div>

              {/* 구분선 */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* 동호수 입력 (동, 호실 분리) */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {currentLanguage === 'ko' ? '동호수' : currentLanguage === 'vi' ? 'Số phòng' : 'Unit Number'}
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {/* 동 입력 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      {currentLanguage === 'ko' ? '동' : currentLanguage === 'vi' ? 'Tòa' : 'Building'}
                    </label>
                    <input
                      type="text"
                      value={buildingNumber}
                      onChange={(e) => setBuildingNumber(e.target.value)}
                      placeholder={currentLanguage === 'ko' ? '예: A, 1' : currentLanguage === 'vi' ? 'VD: A, 1' : 'e.g., A, 1'}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                  {/* 호실 입력 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      {currentLanguage === 'ko' ? '호실' : currentLanguage === 'vi' ? 'Phòng' : 'Room'}
                    </label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder={currentLanguage === 'ko' ? '예: 101, 301' : currentLanguage === 'vi' ? 'VD: 101, 301' : 'e.g., 101, 301'}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-start gap-1">
                  <span className="text-blue-600">ℹ️</span>
                  <span>
                    {currentLanguage === 'ko' 
                      ? '동호수는 예약이 완료된 이후에 임차인에게만 표시됩니다.'
                      : currentLanguage === 'vi'
                      ? 'Số phòng chỉ hiển thị cho người thuê sau khi đặt chỗ được hoàn thành.'
                      : 'Unit number will only be visible to tenants after booking is completed.'}
                  </span>
                </p>
              </div>

              {/* 임대 희망 날짜 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {currentLanguage === 'ko' ? '임대 희망 날짜' : currentLanguage === 'vi' ? 'Ngày cho thuê mong muốn' : 'Desired Rental Dates'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* 체크인 날짜 */}
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarMode('checkin');
                      setShowCalendar(true);
                    }}
                    className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <div className="text-left">
                        <div className="text-xs text-gray-500">
                          {currentLanguage === 'ko' ? '시작일' : currentLanguage === 'vi' ? 'Ngày bắt đầu' : 'Start Date'}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {checkInDate ? (() => {
                            try {
                              let date: Date | null = null;
                              if (checkInDate instanceof Date) {
                                date = checkInDate;
                              } else if (typeof checkInDate === 'string') {
                                date = new Date(checkInDate);
                              }
                              if (!date || isNaN(date.getTime())) {
                                return currentLanguage === 'ko' ? '날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select date';
                              }
                              const month = date.getMonth() + 1;
                              const day = date.getDate();
                              if (isNaN(month) || isNaN(day)) {
                                return currentLanguage === 'ko' ? '날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select date';
                              }
                              return date.toLocaleDateString(currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                              });
                            } catch {
                              return currentLanguage === 'ko' ? '날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select date';
                            }
                          })() : (currentLanguage === 'ko' ? '날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select date')}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* 체크아웃 날짜 */}
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarMode('checkout');
                      setShowCalendar(true);
                    }}
                    className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <div className="text-left">
                        <div className="text-xs text-gray-500">
                          {currentLanguage === 'ko' ? '종료일' : currentLanguage === 'vi' ? 'Ngày kết thúc' : 'End Date'}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {checkOutDate ? (() => {
                            try {
                              let date: Date | null = null;
                              if (checkOutDate instanceof Date) {
                                date = checkOutDate;
                              } else if (typeof checkOutDate === 'string') {
                                date = new Date(checkOutDate);
                              }
                              if (!date || isNaN(date.getTime())) {
                                return currentLanguage === 'ko' ? '날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select date';
                              }
                              const month = date.getMonth() + 1;
                              const day = date.getDate();
                              if (isNaN(month) || isNaN(day)) {
                                return currentLanguage === 'ko' ? '날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select date';
                              }
                              return date.toLocaleDateString(currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                              });
                            } catch {
                              return currentLanguage === 'ko' ? '날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select date';
                            }
                          })() : (currentLanguage === 'ko' ? '날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select date')}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 최대 인원 수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {currentLanguage === 'ko' ? '최대 인원 수' : currentLanguage === 'vi' ? 'Số người tối đa' : 'Maximum Guests'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* 성인 */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="text-xs text-gray-500">
                          {currentLanguage === 'ko' ? '성인' : currentLanguage === 'vi' ? 'Người lớn' : 'Adults'}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{maxAdults}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMaxAdults(Math.max(1, maxAdults - 1))}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaxAdults(maxAdults + 1)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* 어린이 */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="text-xs text-gray-500">
                          {currentLanguage === 'ko' ? '어린이' : currentLanguage === 'vi' ? 'Trẻ em' : 'Children'}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{maxChildren}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMaxChildren(Math.max(0, maxChildren - 1))}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaxChildren(maxChildren + 1)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1주일 임대료 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLanguage === 'ko' ? '1주일 임대료' : currentLanguage === 'vi' ? 'Giá thuê 1 tuần' : 'Weekly Rent'}
                  <span className="text-red-500 text-xs ml-1">*</span>
                  <span className="text-gray-500 text-xs ml-2 font-normal">
                    ({currentLanguage === 'ko' ? '공과금/관리비 포함' : currentLanguage === 'vi' ? 'Bao gồm phí dịch vụ/quản lý' : 'Utilities/Management fees included'})
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                  value={weeklyRent ? parseInt(weeklyRent.replace(/\D/g, '') || '0', 10).toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setWeeklyRent(value);
                  }}
                    placeholder="0"
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                  <span className="text-gray-600 font-medium">VND</span>
                </div>
              </div>

              {/* 방/화장실 수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {currentLanguage === 'ko' ? '방/화장실 수' : currentLanguage === 'vi' ? 'Số phòng/phòng tắm' : 'Bedrooms/Bathrooms'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* 침실 */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="text-xs text-gray-500">
                          {currentLanguage === 'ko' ? '침실' : currentLanguage === 'vi' ? 'Phòng ngủ' : 'Bedrooms'}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{bedrooms}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBedrooms(Math.max(0, bedrooms - 1))}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBedrooms(bedrooms + 1)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* 화장실 */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center gap-2">
                      <Bath className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="text-xs text-gray-500">
                          {currentLanguage === 'ko' ? '화장실' : currentLanguage === 'vi' ? 'Phòng tắm' : 'Bathrooms'}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{bathrooms}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBathrooms(Math.max(0, bathrooms - 1))}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBathrooms(bathrooms + 1)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 편의시설 옵션 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {currentLanguage === 'ko' ? '편의시설' : currentLanguage === 'vi' ? 'Tiện ích' : 'Amenities'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {AMENITY_OPTIONS.map((amenity) => {
                    const Icon = amenity.icon;
                    const isSelected = selectedAmenities.includes(amenity.id);
                    const label = amenity.label[currentLanguage] || amenity.label.en;

                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-xs font-medium text-center">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 등록 버튼 */}
              <button
                type="submit"
                disabled={loading || imagePreviews.length === 0 || !weeklyRent || weeklyRent.replace(/\D/g, '') === ''}
                className="w-full py-4 px-6 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
              >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{currentLanguage === 'ko' ? '등록 중...' : currentLanguage === 'vi' ? 'Đang đăng ký...' : 'Registering...'}</span>
                    </>
                  ) : (
                    <span>{currentLanguage === 'ko' ? '등록' : currentLanguage === 'vi' ? 'Đăng ký' : 'Register'}</span>
                  )}
                </button>
            </form>
          </div>
        </div>

        {/* 달력 모달 */}
        {showCalendar && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowCalendar(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <CalendarComponent
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                onCheckInSelect={(date) => {
                  setCheckInDate(date);
                  setCheckOutDate(null);
                  setCalendarMode('checkout');
                  setShowCalendar(true);
                }}
                onCheckOutSelect={(date) => {
                  setCheckOutDate(date);
                  setShowCalendar(false);
                }}
                currentLanguage={currentLanguage}
                onClose={() => setShowCalendar(false)}
                mode={calendarMode}
              />
            </div>
          </div>
        )}

        {/* 가이드라인 팝업 */}
        {showGuidelinePopup && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={handleGuidelinePopupClick}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                {currentLanguage === 'ko' ? '📸 추천 사진 가이드라인' : currentLanguage === 'vi' ? '📸 Hướng dẫn ảnh đề xuất' : '📸 Recommended Photo Guidelines'}
              </h3>
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-2xl">🛏️</span>
                  <span>{currentLanguage === 'ko' ? '침실' : currentLanguage === 'vi' ? 'Phòng ngủ' : 'Bedroom'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-2xl">🍳</span>
                  <span>{currentLanguage === 'ko' ? '주방' : currentLanguage === 'vi' ? 'Bếp' : 'Kitchen'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-2xl">🛋️</span>
                  <span>{currentLanguage === 'ko' ? '거실' : currentLanguage === 'vi' ? 'Phòng khách' : 'Living Room'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-2xl">🚿</span>
                  <span>{currentLanguage === 'ko' ? '화장실' : currentLanguage === 'vi' ? 'Phòng tắm' : 'Bathroom'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-2xl">🪟</span>
                  <span>{currentLanguage === 'ko' ? '창문뷰' : currentLanguage === 'vi' ? 'Cửa sổ' : 'Window View'}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mb-4">
                {currentLanguage === 'ko' ? '아무 곳이나 터치하여 카메라를 시작하세요' : 
                 currentLanguage === 'vi' ? 'Chạm vào bất kỳ đâu để bắt đầu camera' : 
                 'Tap anywhere to start camera'}
              </p>
              <button
                onClick={handleGuidelinePopupClick}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                {currentLanguage === 'ko' ? '동의' : currentLanguage === 'vi' ? 'Đồng ý' : 'Agree'}
              </button>
            </motion.div>
          </div>
        )}
    </div>
  );
}
