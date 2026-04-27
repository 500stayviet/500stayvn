import { AnimatePresence, motion } from "framer-motion";
import { getUIText } from "@/utils/i18n";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { HostInventoryTab } from "../hooks/useMyPropertiesPageState";

interface LiveExistsConfirmState {
  activeId: string;
  shadowId: string;
  activeLabel: string;
  activeAddress: string;
  activeUnit?: string;
  returnTab: HostInventoryTab;
}

interface MyPropertiesDialogsProps {
  currentLanguage: SupportedLanguage;
  showDeleteConfirm: string | null;
  deletingId: string | null;
  showEndAdFromPendingConfirm: string | null;
  liveExistsConfirm: LiveExistsConfirmState | null;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: (id: string) => void;
  onClosePendingEndConfirm: () => void;
  onConfirmPendingEnd: (id: string) => void;
  onCloseLiveExistsConfirm: () => void;
  onConfirmLiveExists: (value: LiveExistsConfirmState) => void;
}

export default function MyPropertiesDialogs({
  currentLanguage,
  showDeleteConfirm,
  deletingId,
  showEndAdFromPendingConfirm,
  liveExistsConfirm,
  onCloseDeleteConfirm,
  onConfirmDelete,
  onClosePendingEndConfirm,
  onConfirmPendingEnd,
  onCloseLiveExistsConfirm,
  onConfirmLiveExists,
}: MyPropertiesDialogsProps) {
  return (
    <>
      <AnimatePresence>
        {showDeleteConfirm ? (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {getUIText("permanentDeleteConfirmTitle", currentLanguage)}
              </h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                {getUIText("permanentDeleteConfirmDesc", currentLanguage)}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCloseDeleteConfirm}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold"
                >
                  {getUIText("cancel", currentLanguage)}
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmDelete(showDeleteConfirm)}
                  disabled={!!deletingId}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold disabled:bg-red-300"
                >
                  {deletingId ? getUIText("processing", currentLanguage) : getUIText("delete", currentLanguage)}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showEndAdFromPendingConfirm ? (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {getUIText("myPropertiesPendingEndAdTitle", currentLanguage)}
              </h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                {getUIText("myPropertiesPendingEndAdDesc", currentLanguage)}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClosePendingEndConfirm}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold"
                >
                  {getUIText("cancel", currentLanguage)}
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmPendingEnd(showEndAdFromPendingConfirm)}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold"
                >
                  {getUIText("confirm", currentLanguage)}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {liveExistsConfirm ? (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {getUIText("myPropertiesDuplicateLiveTitle", currentLanguage)}
              </h3>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-3 text-xs text-gray-800 space-y-1">
                <p className="font-semibold">{liveExistsConfirm.activeLabel}</p>
                {liveExistsConfirm.activeAddress ? (
                  <p className="text-gray-600">{liveExistsConfirm.activeAddress}</p>
                ) : null}
                {liveExistsConfirm.activeUnit ? (
                  <p className="text-gray-600">{liveExistsConfirm.activeUnit}</p>
                ) : null}
              </div>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                {getUIText("myPropertiesDuplicateLiveHint", currentLanguage)}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCloseLiveExistsConfirm}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold"
                >
                  {getUIText("dialogNo", currentLanguage)}
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmLiveExists(liveExistsConfirm)}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold"
                >
                  {getUIText("dialogYes", currentLanguage)}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
