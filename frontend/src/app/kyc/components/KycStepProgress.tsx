"use client";

import { CheckCircle2, Circle } from "lucide-react";

interface KycStepProgressProps {
  currentStep: 1 | 2 | 3;
  steps: { number: 1 | 2 | 3; title: string; completed: boolean }[];
}

export default function KycStepProgress({ currentStep, steps }: KycStepProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex-1 flex flex-col items-center">
            <div className="relative">
              {step.completed || currentStep > step.number ? (
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              ) : currentStep === step.number ? (
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">{step.number}</span>
                </div>
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <Circle className="w-6 h-6 text-gray-400" />
                </div>
              )}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-5 left-5 w-full h-0.5 ${step.completed ? "bg-green-600" : "bg-gray-200"}`}
                  style={{ width: "calc(100% + 1rem)" }}
                />
              )}
            </div>
            <p
              className={`mt-2 text-xs text-center ${currentStep === step.number ? "font-semibold text-blue-600" : step.completed ? "text-green-600" : "text-gray-400"}`}
            >
              {step.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
