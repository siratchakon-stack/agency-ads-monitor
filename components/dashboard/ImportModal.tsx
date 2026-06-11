"use client";

import { useState, useRef } from "react";
import { X, Upload, Download, CheckCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface ImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

interface ParsedRow {
  client_name: string;
  account_id: string;
  topup_amount: number;
  threshold: number;
  valid: boolean;
  error?: string;
}

const TEMPLATE = `client_name,account_id,topup_amount,threshold
บริษัท ABC จำกัด,act_111111111,50000,1500
ร้าน XYZ,act_222222222,30000,1500
The Brand Co.,act_333333333,20000,2000
`;

export default function ImportModal({ onClose, onImported }: ImportModalProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [imported, setImported] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const blob = new Blob(["﻿" + TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string).replace(/^﻿/, "");
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("CSV must have header + at least one row");
        return;
      }

      const headers = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""));
      const parsed: ParsedRow[] = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
        const get = (key: string) => cols[headers.indexOf(key)] || "";

        const client_name = get("client_name");
        const account_id = get("account_id").replace(/^act_/, "");
        const topup_amount = parseFloat(get("topup_amount")) || 0;
        const threshold = parseFloat(get("threshold")) || 1500;

        let valid = true;
        let error = "";
        if (!account_id) { valid = false; error = "Missing account_id"; }
        if (topup_amount < 0) { valid = false; error = "Invalid topup_amount"; }

        return { client_name, account_id, topup_amount, threshold, valid, error };
      }).filter((r) => r.account_id);

      setRows(parsed);
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) { toast.error("No valid rows to import"); return; }

    setImporting(true);
    let count = 0;
    try {
      const res = await fetch("/api/ad-accounts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: validRows }),
      });
      const data = await res.json();
      if (res.ok) {
        count = data.imported || validRows.length;
        setImported(count);
        setStep("done");
        onImported();
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-xl bg-white dark:bg-gray-900 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Import Ad Accounts</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {step === "upload" ? "Upload a CSV file to import accounts"
               : step === "preview" ? `Preview ${rows.length} rows`
               : `Imported ${imported} accounts`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === "upload" && (
            <>
              {/* Template Download */}
              <button
                onClick={downloadTemplate}
                className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group"
              >
                <Download size={18} className="text-gray-400 group-hover:text-blue-500" />
                <div className="text-left">
                  <p className="font-medium text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600">
                    Download Template CSV
                  </p>
                  <p className="text-xs text-gray-400">
                    client_name, account_id, topup_amount, threshold
                  </p>
                </div>
              </button>

              {/* Upload Area */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
                className="w-full flex flex-col items-center gap-3 p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <Upload size={22} className="text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    Click or drag & drop CSV
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Supports UTF-8 CSV files</p>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </>
          )}

          {step === "preview" && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{rows.filter((r) => r.valid).length}</p>
                  <p className="text-xs text-gray-500">Ready to import</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-500">{rows.filter((r) => !r.valid).length}</p>
                  <p className="text-xs text-gray-500">Errors</p>
                </div>
              </div>

              {/* Rows */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-500 font-semibold">Client</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-semibold">Account ID</th>
                      <th className="text-right px-3 py-2 text-gray-500 font-semibold">Topup</th>
                      <th className="text-center px-3 py-2 text-gray-500 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rows.map((row, i) => (
                      <tr key={i} className={!row.valid ? "bg-red-50/50 dark:bg-red-950/10" : ""}>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.client_name || "—"}</td>
                        <td className="px-3 py-2 font-mono text-gray-600 dark:text-gray-400">{row.account_id}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                          {row.topup_amount > 0 ? `฿${row.topup_amount.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.valid
                            ? <CheckCircle size={14} className="text-emerald-500 mx-auto" />
                            : <span className="text-red-500 text-[10px]">{row.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={() => setStep("upload")} className="text-sm text-blue-500 hover:underline">
                ← Upload different file
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{imported} accounts</p>
                <p className="text-gray-500 mt-1">successfully imported!</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            {step === "done" ? "Close" : "Cancel"}
          </button>
          {step === "preview" && (
            <button
              onClick={handleImport}
              disabled={importing || rows.filter((r) => r.valid).length === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {importing ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Importing...</>
              ) : (
                <><Upload size={14} />Import {rows.filter((r) => r.valid).length} accounts</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
