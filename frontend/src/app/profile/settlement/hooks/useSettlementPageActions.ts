"use client";

import { useCallback } from "react";
import {
  emitUserFacingAppToast,
  emitUserFacingSyncError,
} from "@/lib/runtime/networkResilience";
import type { SettlementPageData } from "./useSettlementPageData";

/** 정산·지갑 — 출금 신청·계좌 추가 액션. */
export function useSettlementPageActions(data: SettlementPageData) {
  const {
    user,
    currentLanguage,
    withdrawalAmount,
    selectedBankId,
    bankProvider,
    refreshFinanceData,
    setWithdrawalAmount,
    setNewBankName,
    setNewAccountNumber,
    setNewAccountHolder,
    setSetAsPrimaryOnCreate,
    newBankName,
    newAccountNumber,
    newAccountHolder,
    setAsPrimaryOnCreate,
  } = data;

  const handleSubmitWithdrawal = useCallback(async () => {
    if (!user?.uid) return;
    const amount = parseInt(withdrawalAmount.replace(/\D/g, ""), 10) || 0;
    if (amount <= 0) {
      emitUserFacingSyncError({
        area: "generic",
        action: "withdrawal_validate",
        message:
          currentLanguage === "ko"
            ? "출금 금액을 입력해주세요."
            : "Vui lòng nhập số tiền rút.",
      });
      return;
    }
    if (!selectedBankId) {
      emitUserFacingSyncError({
        area: "generic",
        action: "withdrawal_bank",
        message:
          currentLanguage === "ko"
            ? "계좌를 선택해주세요."
            : "Vui lòng chọn tài khoản.",
      });
      return;
    }
    const result = await bankProvider.createWithdrawalRequest({
      amount,
      bankAccountId: selectedBankId,
    });
    if (!result.ok) {
      emitUserFacingSyncError({
        area: "generic",
        action: "withdrawal_request",
        message: result.message || "Withdrawal request failed",
      });
      return;
    }
    setWithdrawalAmount("");
    await refreshFinanceData();
    emitUserFacingAppToast({
      tone: "success",
      area: "generic",
      action: "withdrawal_submitted",
      message:
        currentLanguage === "ko"
          ? "출금 신청이 접수되었습니다."
          : "Yêu cầu rút tiền đã được gửi.",
    });
  }, [
    user?.uid,
    currentLanguage,
    withdrawalAmount,
    selectedBankId,
    bankProvider,
    refreshFinanceData,
    setWithdrawalAmount,
  ]);

  const handleAddBankAccount = useCallback(async () => {
    if (!user?.uid) return;
    if (!newBankName.trim() || !newAccountNumber.trim() || !newAccountHolder.trim()) {
      emitUserFacingSyncError({
        area: "generic",
        action: "bank_form",
        message:
          currentLanguage === "ko"
            ? "계좌 정보를 모두 입력해주세요."
            : "Vui lòng nhập đầy đủ thông tin tài khoản.",
      });
      return;
    }
    const ok = await bankProvider.addBankAccount({
      bankName: newBankName.trim(),
      accountNumber: newAccountNumber.trim(),
      accountHolder: newAccountHolder.trim(),
      isPrimary: setAsPrimaryOnCreate,
    });
    if (!ok) {
      emitUserFacingSyncError({
        area: "generic",
        action: "bank_add",
        message:
          currentLanguage === "ko"
            ? "계좌 등록에 실패했습니다."
            : "Đăng ký tài khoản thất bại.",
      });
      return;
    }
    setNewBankName("");
    setNewAccountNumber("");
    setNewAccountHolder("");
    setSetAsPrimaryOnCreate(false);
    await refreshFinanceData();
    emitUserFacingAppToast({
      tone: "success",
      area: "generic",
      action: "bank_added",
      message:
        currentLanguage === "ko"
          ? "계좌가 등록되었습니다."
          : "Tài khoản đã được thêm.",
    });
  }, [
    user?.uid,
    currentLanguage,
    newBankName,
    newAccountNumber,
    newAccountHolder,
    setAsPrimaryOnCreate,
    bankProvider,
    refreshFinanceData,
    setNewBankName,
    setNewAccountNumber,
    setNewAccountHolder,
    setSetAsPrimaryOnCreate,
  ]);

  return {
    handleSubmitWithdrawal,
    handleAddBankAccount,
  };
}
