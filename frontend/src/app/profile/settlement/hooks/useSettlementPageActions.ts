"use client";

import { useCallback } from "react";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getAppApiErrorMessageForCode } from "@/lib/api/i18nAppApiErrors";
import { getUIText } from "@/utils/i18n";
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

  const lang = currentLanguage as SupportedLanguage;

  const handleSubmitWithdrawal = useCallback(async () => {
    if (!user?.uid) return;
    const amount = parseInt(withdrawalAmount.replace(/\D/g, ""), 10) || 0;
    if (amount <= 0) {
      emitUserFacingSyncError({
        area: "generic",
        action: "withdrawal_validate",
        message: getUIText("withdrawalValidateAmount", lang),
      });
      return;
    }
    if (!selectedBankId) {
      emitUserFacingSyncError({
        area: "generic",
        action: "withdrawal_bank",
        message: getUIText("withdrawalSelectBankRequired", lang),
      });
      return;
    }
    const result = await bankProvider.createWithdrawalRequest({
      amount,
      bankAccountId: selectedBankId,
    });
    if (!result.ok) {
      const msg = result.appErrorCode
        ? getAppApiErrorMessageForCode(result.appErrorCode, lang)
        : result.message && result.message !== "request_failed"
          ? result.message
          : getUIText("withdrawalRequestFailedMessage", lang);
      emitUserFacingSyncError({
        area: "generic",
        action: "withdrawal_request",
        message: msg,
      });
      return;
    }
    setWithdrawalAmount("");
    await refreshFinanceData();
    emitUserFacingAppToast({
      tone: "success",
      area: "generic",
      action: "withdrawal_submitted",
      message: getUIText("withdrawalSubmittedSuccess", lang),
    });
  }, [
    user?.uid,
    lang,
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
        message: getUIText("bankAccountFormIncomplete", lang),
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
        message: getUIText("bankAccountAddFailed", lang),
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
      message: getUIText("bankAccountAddedSuccess", lang),
    });
  }, [
    user?.uid,
    lang,
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
