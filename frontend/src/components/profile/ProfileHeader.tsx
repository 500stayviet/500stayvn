"use client";

import { motion } from "framer-motion";
import { User, Camera, CheckCircle2 } from "lucide-react";
import { UserData } from "@/lib/api/auth";

interface ProfileHeaderProps {
  userData: UserData | null;
  isLoading: boolean;
  isDemoMode: boolean;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProfileHeader({
  userData,
  isLoading,
  isDemoMode,
  onImageUpload,
}: ProfileHeaderProps) {
  const displayName = isDemoMode ? "Demo Host" : userData?.displayName || "User";
  const photoURL = userData?.photoURL;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-lg">
            {photoURL ? (
              <img
                src={photoURL}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8" />
            )}
          </div>
          {!isDemoMode && onImageUpload && (
            <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50">
              <Camera className="w-4 h-4 text-gray-700" />
              <input
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          )}
          {!isDemoMode && (
            <div className="absolute -top-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {isDemoMode
              ? "Demo Account Preview"
              : "Property Host • Verified Member"}
          </p>
          {isDemoMode && (
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 border border-amber-200 rounded-full">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-amber-700">
                Preview Mode
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
