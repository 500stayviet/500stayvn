"use client";

import { useState } from "react";
import {
  Home,
  Search,
  Building2,
  User,
  Camera,
  X,
  ChevronRight,
  Check,
  Wifi,
  Car,
  Waves,
  Wind,
  Tv,
  UtensilsCrossed,
  ShieldCheck,
  Sparkles,
  Clock,
  Dog,
  Music,
  Cigarette,
  Users,
  ArrowLeft,
  Plus,
  MapPin,
  DollarSign,
  FileText,
  ImageIcon,
  Settings,
  Star,
} from "lucide-react";

// Property types with icons
const propertyTypes = [
  { id: "apartment", label: "Căn hộ", icon: Building2 },
  { id: "house", label: "Nhà phố", icon: Home },
  { id: "villa", label: "Biệt thự", icon: Sparkles },
  { id: "studio", label: "Studio", icon: Tv },
  { id: "homestay", label: "Homestay", icon: Users },
];

// Facilities with icons
const facilities = [
  { id: "wifi", label: "WiFi miễn phí", icon: Wifi },
  { id: "parking", label: "Bãi đỗ xe", icon: Car },
  { id: "pool", label: "Hồ bơi", icon: Waves },
  { id: "ac", label: "Điều hòa", icon: Wind },
  { id: "tv", label: "Smart TV", icon: Tv },
  { id: "kitchen", label: "Bếp đầy đủ", icon: UtensilsCrossed },
  { id: "security", label: "An ninh 24/7", icon: ShieldCheck },
  { id: "cleaning", label: "Dọn dẹp", icon: Sparkles },
];

// Policies with icons
const policies = [
  { id: "no_smoking", label: "Cấm hút thuốc", icon: Cigarette },
  { id: "no_pets", label: "Không thú cưng", icon: Dog },
  { id: "no_party", label: "Cấm tiệc tùng", icon: Music },
  { id: "quiet_hours", label: "Giờ yên tĩnh", icon: Clock },
];

// Time options
const timeOptions = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

// Vietnamese cities
const cities = [
  "Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Nha Trang", "Đà Lạt", 
  "Phú Quốc", "Vũng Tàu", "Hội An", "Huế", "Cần Thơ"
];

// Steps configuration
const steps = [
  { id: 1, title: "Thông tin", icon: FileText },
  { id: 2, title: "Hình ảnh", icon: ImageIcon },
  { id: 3, title: "Tiện ích", icon: Settings },
  { id: 4, title: "Hoàn tất", icon: Check },
];

export default function AddPropertyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    propertyType: "",
    address: "",
    city: "",
    district: "",
    pricePerNight: "",
    description: "",
    maxGuests: "2",
    bedrooms: "1",
    bathrooms: "1",
    checkInTime: "14:00",
    checkOutTime: "12:00",
    facilities: [] as string[],
    policies: [] as string[],
    images: [] as string[],
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: "facilities" | "policies", itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(itemId)
        ? prev[field].filter((id) => id !== itemId)
        : [...prev[field], itemId],
    }));
  };

  const handleImageUpload = () => {
    const newImage = `https://picsum.photos/400/300?random=${Date.now()}`;
    setPreviewImages((prev) => [...prev, newImage]);
    setFormData((prev) => ({ ...prev, images: [...prev.images, newImage] }));
  };

  const removeImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    alert("Đăng ký thành công! Chúng tôi sẽ xem xét và phê duyệt trong 24h.");
  };

  const getStepProgress = () => {
    return (currentStep / 4) * 100;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* App Container - Mobile-first centered view */}
      <div className="flex-1 w-full max-w-[480px] mx-auto bg-white min-h-screen flex flex-col shadow-xl">
        
        {/* Header with gradient */}
        <header className="bg-gradient-to-r from-[#E63946] to-[#FF6B35] px-4 pt-12 pb-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={prevStep}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Đăng ký căn hộ</h1>
              <p className="text-white/80 text-sm">Bước {currentStep} / 4</p>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between px-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-white text-[#E63946]"
                          : isActive
                          ? "bg-white text-[#E63946] shadow-lg scale-110"
                          : "bg-white/30 text-white"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? "font-semibold" : "opacity-80"}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mx-1 mb-5 ${
                        isCompleted ? "bg-white" : "bg-white/30"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </header>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-[#E63946] to-[#FF6B35] transition-all duration-500"
            style={{ width: `${getStepProgress()}%` }}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-32">
          
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="p-5 space-y-6">
              {/* Property Type Selection */}
              <section>
                <h2 className="text-lg font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#E63946] text-white text-xs flex items-center justify-center">1</span>
                  Loại hình căn hộ
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {propertyTypes.map((type) => {
                    const TypeIcon = type.icon;
                    const isSelected = formData.propertyType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleInputChange("propertyType", type.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all min-h-[88px] ${
                          isSelected
                            ? "border-[#E63946] bg-[#FFF5F5] text-[#E63946]"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <TypeIcon className={`w-6 h-6 mb-2 ${isSelected ? "text-[#E63946]" : ""}`} />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Title Input */}
              <section>
                <h2 className="text-lg font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#FF6B35] text-white text-xs flex items-center justify-center">2</span>
                  Tên căn hộ
                </h2>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Ví dụ: Căn hộ view sông Sài Gòn"
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 text-base focus:border-[#E63946] focus:outline-none bg-white"
                />
              </section>

              {/* Location */}
              <section>
                <h2 className="text-lg font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#FFB627] text-white text-xs flex items-center justify-center">3</span>
                  Địa điểm
                </h2>
                <div className="space-y-3">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 text-base focus:border-[#E63946] focus:outline-none bg-white appearance-none"
                    >
                      <option value="">Chọn thành phố</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 rotate-90" />
                  </div>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => handleInputChange("district", e.target.value)}
                    placeholder="Quận/Huyện"
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 text-base focus:border-[#E63946] focus:outline-none bg-white"
                  />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Địa chỉ chi tiết"
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 text-base focus:border-[#E63946] focus:outline-none bg-white"
                  />
                </div>
              </section>

              {/* Price */}
              <section>
                <h2 className="text-lg font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#E63946] text-white text-xs flex items-center justify-center">4</span>
                  Giá thuê
                </h2>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.pricePerNight}
                    onChange={(e) => handleInputChange("pricePerNight", e.target.value)}
                    placeholder="500000"
                    className="w-full pl-12 pr-24 py-4 rounded-xl border-2 border-gray-200 text-base focus:border-[#E63946] focus:outline-none bg-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    VNĐ/đêm
                  </span>
                </div>
              </section>

              {/* Room Details */}
              <section>
                <h2 className="text-lg font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#FF6B35] text-white text-xs flex items-center justify-center">5</span>
                  Chi tiết phòng
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Khách tối đa", field: "maxGuests", max: 20 },
                    { label: "Phòng ngủ", field: "bedrooms", max: 10 },
                    { label: "Phòng tắm", field: "bathrooms", max: 10 },
                  ].map((item) => (
                    <div key={item.field} className="bg-gray-50 rounded-xl p-3">
                      <label className="text-xs text-gray-500 block mb-2">{item.label}</label>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            const current = parseInt(formData[item.field as keyof typeof formData] as string) || 1;
                            if (current > 1) handleInputChange(item.field, String(current - 1));
                          }}
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600"
                        >
                          -
                        </button>
                        <span className="text-lg font-bold text-[#1A1A2E]">{formData[item.field as keyof typeof formData]}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const current = parseInt(formData[item.field as keyof typeof formData] as string) || 1;
                            if (current < item.max) handleInputChange(item.field, String(current + 1));
                          }}
                          className="w-8 h-8 rounded-full bg-[#E63946] text-white flex items-center justify-center text-lg font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Step 2: Images */}
          {currentStep === 2 && (
            <div className="p-5 space-y-6">
              <section>
                <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">Hình ảnh căn hộ</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Thêm ít nhất 5 hình ảnh chất lượng cao để thu hút khách hàng
                </p>

                {/* Image Upload Area */}
                <button
                  type="button"
                  onClick={handleImageUpload}
                  className="w-full aspect-video rounded-2xl border-2 border-dashed border-[#E63946] bg-[#FFF5F5] flex flex-col items-center justify-center gap-3 hover:bg-[#FFEBEE] transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E63946] to-[#FF6B35] flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-[#E63946] font-semibold">Thêm hình ảnh</p>
                    <p className="text-gray-400 text-sm">JPG, PNG (tối đa 10MB)</p>
                  </div>
                </button>

                {/* Preview Images */}
                {previewImages.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Đã tải lên ({previewImages.length}/10)
                      </span>
                      {previewImages.length >= 5 && (
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <Check className="w-4 h-4" />
                          Đủ điều kiện
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                      {previewImages.map((img, index) => (
                        <div key={index} className="relative flex-shrink-0">
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-xl"
                            crossOrigin="anonymous"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#E63946] text-white flex items-center justify-center shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-[#FFB627] text-xs font-medium rounded text-white">
                              Ảnh bìa
                            </span>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleImageUpload}
                        className="w-24 h-24 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-[#E63946] hover:bg-[#FFF5F5] transition-colors"
                      >
                        <Plus className="w-6 h-6 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Tips Card */}
                <div className="mt-6 p-4 bg-gradient-to-r from-[#FFF8F0] to-[#FFFBEB] rounded-2xl border border-[#FFB627]/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FFB627] flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A1A2E] mb-1">Mẹo chụp ảnh đẹp</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>- Chụp vào ban ngày với ánh sáng tự nhiên</li>
                        <li>- Dọn dẹp gọn gàng trước khi chụp</li>
                        <li>- Chụp từ góc rộng để thấy toàn cảnh</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Step 3: Facilities & Policies */}
          {currentStep === 3 && (
            <div className="p-5 space-y-6">
              {/* Facilities */}
              <section>
                <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">Tiện nghi</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Chọn các tiện nghi có sẵn tại căn hộ của bạn
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {facilities.map((facility) => {
                    const FacilityIcon = facility.icon;
                    const isSelected = formData.facilities.includes(facility.id);
                    return (
                      <button
                        key={facility.id}
                        type="button"
                        onClick={() => toggleArrayItem("facilities", facility.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-h-[56px] ${
                          isSelected
                            ? "border-[#E63946] bg-[#FFF5F5]"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected ? "bg-[#E63946] text-white" : "bg-gray-100 text-gray-500"
                        }`}>
                          <FacilityIcon className="w-5 h-5" />
                        </div>
                        <span className={`text-sm font-medium ${
                          isSelected ? "text-[#E63946]" : "text-gray-700"
                        }`}>
                          {facility.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Badge Achievement */}
                {formData.facilities.length === facilities.length && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-[#E63946] to-[#FF6B35] rounded-xl text-white flex items-center gap-3">
                    <Sparkles className="w-6 h-6" />
                    <div>
                      <p className="font-bold">Tuyệt vời!</p>
                      <p className="text-sm opacity-90">Bạn đã nhận được huy hiệu Tiện nghi đầy đủ</p>
                    </div>
                  </div>
                )}
              </section>

              {/* Policies */}
              <section>
                <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">Quy định</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Thiết lập các quy định cho căn hộ của bạn
                </p>
                <div className="space-y-3">
                  {policies.map((policy) => {
                    const PolicyIcon = policy.icon;
                    const isSelected = formData.policies.includes(policy.id);
                    return (
                      <button
                        key={policy.id}
                        type="button"
                        onClick={() => toggleArrayItem("policies", policy.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all min-h-[56px] ${
                          isSelected
                            ? "border-[#E63946] bg-[#FFF5F5]"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isSelected ? "bg-[#E63946] text-white" : "bg-gray-100 text-gray-500"
                          }`}>
                            <PolicyIcon className="w-5 h-5" />
                          </div>
                          <span className={`font-medium ${
                            isSelected ? "text-[#E63946]" : "text-gray-700"
                          }`}>
                            {policy.label}
                          </span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-[#E63946] bg-[#E63946] text-white"
                            : "border-gray-300"
                        }`}>
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Check-in/Check-out Times */}
              <section>
                <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">Thời gian nhận/trả phòng</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="text-sm text-gray-500 block mb-2">Nhận phòng</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E63946]" />
                      <select
                        value={formData.checkInTime}
                        onChange={(e) => handleInputChange("checkInTime", e.target.value)}
                        className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 bg-white text-base appearance-none focus:outline-none"
                      >
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="text-sm text-gray-500 block mb-2">Trả phòng</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF6B35]" />
                      <select
                        value={formData.checkOutTime}
                        onChange={(e) => handleInputChange("checkOutTime", e.target.value)}
                        className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 bg-white text-base appearance-none focus:outline-none"
                      >
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="p-5 space-y-6">
              <section>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#E63946] to-[#FF6B35] flex items-center justify-center mb-4">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-[#1A1A2E]">Xác nhận thông tin</h2>
                  <p className="text-gray-500 mt-1">Kiểm tra lại thông tin trước khi đăng ký</p>
                </div>

                {/* Summary Cards */}
                <div className="space-y-4">
                  {/* Property Info Card */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h3 className="font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#E63946]" />
                      Thông tin căn hộ
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Loại hình</span>
                        <span className="font-medium">{propertyTypes.find(t => t.id === formData.propertyType)?.label || "Chưa chọn"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tên</span>
                        <span className="font-medium">{formData.title || "Chưa nhập"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Địa điểm</span>
                        <span className="font-medium">{formData.city || "Chưa chọn"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Giá/đêm</span>
                        <span className="font-bold text-[#E63946]">
                          {formData.pricePerNight ? `${parseInt(formData.pricePerNight).toLocaleString()} VNĐ` : "Chưa nhập"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Room Details Card */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h3 className="font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#FF6B35]" />
                      Chi tiết phòng
                    </h3>
                    <div className="flex justify-between text-sm">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#1A1A2E]">{formData.maxGuests}</p>
                        <p className="text-gray-500">Khách</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#1A1A2E]">{formData.bedrooms}</p>
                        <p className="text-gray-500">Phòng ngủ</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#1A1A2E]">{formData.bathrooms}</p>
                        <p className="text-gray-500">Phòng tắm</p>
                      </div>
                    </div>
                  </div>

                  {/* Facilities Card */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h3 className="font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#FFB627]" />
                      Tiện nghi ({formData.facilities.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.facilities.map((id) => {
                        const facility = facilities.find((f) => f.id === id);
                        return facility ? (
                          <span
                            key={id}
                            className="px-3 py-1.5 bg-white rounded-full text-sm font-medium text-gray-700 border"
                          >
                            {facility.label}
                          </span>
                        ) : null;
                      })}
                      {formData.facilities.length === 0 && (
                        <span className="text-gray-400 text-sm">Chưa chọn tiện nghi nào</span>
                      )}
                    </div>
                  </div>

                  {/* Images Card */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h3 className="font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#E63946]" />
                      Hình ảnh ({previewImages.length})
                    </h3>
                    {previewImages.length > 0 ? (
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {previewImages.slice(0, 4).map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            crossOrigin="anonymous"
                          />
                        ))}
                        {previewImages.length > 4 && (
                          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-gray-600">+{previewImages.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Chưa tải hình ảnh nào</span>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Fixed Bottom Action Button */}
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 py-4 bg-white border-t border-gray-100">
          <button
            type="button"
            onClick={currentStep === 4 ? handleSubmit : nextStep}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E63946] to-[#FF6B35] text-white font-bold text-lg shadow-lg shadow-[#E63946]/30 active:scale-[0.98] transition-transform"
          >
            {currentStep === 4 ? "Đăng ký căn hộ" : "Tiếp tục"}
          </button>
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 px-2 py-2">
          <div className="flex items-center justify-around">
            {[
              { icon: Home, label: "Trang chủ", active: false },
              { icon: Search, label: "Tìm kiếm", active: false },
              { icon: Building2, label: "Đăng tin", active: true },
              { icon: User, label: "Tài khoản", active: false },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  type="button"
                  className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl min-w-[64px] min-h-[56px] transition-colors ${
                    item.active
                      ? "text-[#E63946]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${item.active ? "text-[#E63946]" : ""}`} />
                  <span className={`text-xs mt-1 ${item.active ? "font-semibold" : ""}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
