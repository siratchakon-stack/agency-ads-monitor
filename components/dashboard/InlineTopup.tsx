"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";

interface InlineTopupProps {
  accountId: string;
  currentValue: number;
  currency: string;
  onSave: (newValue: number) => void;
  onCancel: () => void;
}

export default function InlineTopup({
  accountId,
  currentValue,
  currency,
  onSave,
  onCancel,
}: InlineTopupProps) {
  const [value, setValue] = useState(
    currentValue > 0 ? String(currentValue) : ""
  );
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = async () => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      toast.error("Invalid amount");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/ad-accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topup_amount: num }),
      });
      if (res.ok) {
        toast.success(`Topup set to ${num.toLocaleString()} ${currency}`);
        onSave(num);
      } else {
        toast.error("Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        min="0"
        step="100"
        className="w-28 px-2 py-1 text-xs border border-blue-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white tabular-nums"
        disabled={saving}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
      >
        <Check size={12} />
      </button>
      <button
        onClick={onCancel}
        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  );
}
