import { describe, expect, it } from "vitest";
import type { UserData } from "@/lib/api/auth";
import { deriveKycResumeState } from "./deriveKycResumeState";

function user(base: Pick<UserData, "uid" | "email"> & Partial<UserData>): UserData {
  return { ...base } as UserData;
}

describe("deriveKycResumeState", () => {
  it("null → 스텝 1부터, 데이터 없음", () => {
    expect(deriveKycResumeState(null)).toEqual({
      currentStepToShow: 1,
      phoneData: null,
      idDocumentData: null,
      faceData: null,
    });
  });

  it("kyc_steps 없음 → 스텝 1", () => {
    expect(deriveKycResumeState(user({ uid: "u1", email: "a@b.c" }))).toEqual({
      currentStepToShow: 1,
      phoneData: null,
      idDocumentData: null,
      faceData: null,
    });
  });

  it("step1만 완료 → 스텝 2, phoneData 채움", () => {
    const r = deriveKycResumeState(
      user({
        uid: "u1",
        email: "a@b.c",
        phoneNumber: "+8210",
        kyc_steps: { step1: true },
      }),
    );
    expect(r.currentStepToShow).toBe(2);
    expect(r.phoneData).toEqual({ phoneNumber: "+8210" });
    expect(r.idDocumentData).toBeNull();
    expect(r.faceData).toBeNull();
  });

  it("step1·2 완료 → 스텝 3", () => {
    const r = deriveKycResumeState(
      user({
        uid: "u1",
        email: "a@b.c",
        phoneNumber: "+84",
        kyc_steps: { step1: true, step2: true },
      }),
    );
    expect(r.currentStepToShow).toBe(3);
    expect(r.phoneData).toEqual({ phoneNumber: "+84" });
    expect(r.idDocumentData).toEqual({});
    expect(r.faceData).toBeNull();
  });

  it("전 스텝 완료 → currentStepToShow 없음, 세 데이터 존재", () => {
    const r = deriveKycResumeState(
      user({
        uid: "u1",
        email: "a@b.c",
        phoneNumber: "010",
        kyc_steps: { step1: true, step2: true, step3: true },
      }),
    );
    expect(r.currentStepToShow).toBeUndefined();
    expect(r.phoneData).toEqual({ phoneNumber: "010" });
    expect(r.idDocumentData).toEqual({});
    expect(r.faceData).toEqual({});
  });
});
