"use client";

import { useState } from "react";
import { AdAccount } from "@/types";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils/helpers";

interface TopupModalProps {
  account: AdAccount;
  onClose: () => void;
  onSave: () => void;
}

export default function TopupModal({ account, onClose, onSave }: TopupModalProps) {
  const [topupAmount, setTopupAmount] = useState(
    account.topup_amount ? String(account.topup_amount) : ""
  );
  const [clientName, setClientName] = useState(account.client_name || "");
  const [threshold, setThreshold] = useState(String(account.threshold || 1500));
  const [saving, setSaving] = useState(false);

  const presets = [5000, 10000, 20000, 50000];

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/ad-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topup_amount: parseFloat(topupAmount) || 0,
          client_name: clientName,
          threshold: parseFloat(threshold) || 1500,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Account updated successfully");
        onSave();
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const estimatedRemaining =
    topupAmount ? parseFloat(topupAmount) - account.total_spend : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">
              Edit Account
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {account.ad_account_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Client Name */}
          <div>
            <label className="label">Client Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Company ABC"
              className="input"
            />
          </div>

          {/* Topup Amount */}
          <div>
            <label className="label">
              Latest Topup Amount ({account.currency})
            </label>
            <input
              type="number"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="input"
            />
            {/* Preset buttons */}
            <div className="flex gap-2 mt-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setTopupAmount(String(preset))}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 transition-colors"
                >
                  {preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Alert Threshold */}
          <div>
            <label className="label">
              Alert Threshold ({account.currency})
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="1500"
              min="0"
              className="input"
            />
            <p className="text-xs text-gray-400 mt-1">
              LINE alert is sent when remaining balance drops below this amount
            </p>
          </div>

          {/* Preview */}
          {estimatedRemaining !== null && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Preview
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Topup</span>
                <span className="font-medium">
                  {formatCurrency(parseFloat(topupAmount) || 0, account.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Spend</span>
                <span className="font-medium text-red-500">
                  -{formatCurrency(account.total_spend, account.currency)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Estimated Remaining
                </span>
                <span
                  className={`font-bold ${
                    estimatedRemaining < parseFloat(threshold)
                      ? "text-red-600"
                      : estimatedRemaining < 3000
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {formatCurrency(estimatedRemaining, account.currency)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
