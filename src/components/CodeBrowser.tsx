"use client";

import { useState } from "react";
import {
  FileCode2,
  FileJson,
  FileText,
  MonitorSmartphone,
  Copy,
  Check,
  Download,
  Search,
  Server,
  Globe,
} from "lucide-react";

type FileKind = "manifest" | "server" | "client" | "docs";

export type FileItem = {
  path: string;
  name: string;
  order: number;
  kind: FileKind;
  title: string;
  description: string;
  size: number;
  lines: number;
};

const KIND_META: Record<FileKind, { label: string; cls: string; Icon: typeof Server }> = {
  manifest: { label: "Manifest", cls: "bg-violet-100 text-violet-800", Icon: FileJson },
  server: { label: "Server .gs", cls: "bg-teal-100 text-teal-800", Icon: Server },
  client: { label: "Klien HTML", cls: "bg-amber-100 text-amber-900", Icon: MonitorSmartphone },
  docs: { label: "Dokumentasi", cls: "bg-slate-200 text-slate-700", Icon: FileText },
};

export default function CodeBrowser({
  files,
  initialPath,
  initialContent,
}: {
  files: FileItem[];
  initialPath: string;
  initialContent: string;
}) {
  const [activePath, setActivePath] = useState(initialPath);
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");

  const active = files.find((f) => f.path === activePath) || files[0];

  async function openFile(path: string) {
    if (path === activePath) return;
    setLoading(true);
    setActivePath(path);
    try {
      const res = await fetch(`/api/gas/files?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      setContent(data.ok ? data.content : `// Gagal memuat file: ${data.error}`);
    } catch {
      setContent("// Gagal memuat file.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function downloadFile() {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = active.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = query.trim()
    ? files.filter((f) => {
        const q = query.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
        );
      })
    : files;

  const ActiveIcon = KIND_META[active.kind].Icon;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari file… (mis. Blogger, QR, Ticket)"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <a
          href="/api/gas/download"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-blue-800 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-teal-700/20 transition hover:shadow-xl"
        >
          <Download className="h-4 w-4" /> Unduh ZIP
        </a>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr]">
        {/* Daftar file */}
        <aside className="max-h-[320px] overflow-y-auto border-b border-slate-200 bg-slate-50/50 p-3 lg:max-h-[640px] lg:border-b-0 lg:border-r">
          <ul className="space-y-1.5">
            {filtered.map((f) => {
              const meta = KIND_META[f.kind];
              const isActive = f.path === activePath;
              return (
                <li key={f.path}>
                  <button
                    onClick={() => openFile(f.path)}
                    className={`w-full rounded-2xl px-3 py-2.5 text-left transition ${
                      isActive
                        ? "bg-gradient-to-r from-teal-700 to-blue-800 text-white shadow-lg shadow-teal-700/20"
                        : "hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <meta.Icon
                        className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-amber-300" : "text-teal-700"}`}
                      />
                      <span
                        className={`shrink-0 font-mono text-[10px] font-black ${
                          isActive ? "text-amber-300" : "text-slate-400"
                        }`}
                      >
                        {String(f.order ?? 0).padStart(2, "0")}
                      </span>
                      <span
                        className={`truncate font-mono text-[12.5px] font-bold ${
                          isActive ? "text-white" : "text-slate-800"
                        }`}
                      >
                        {f.name}
                      </span>
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-[10.5px] font-semibold ${
                        isActive ? "text-blue-100/80" : "text-slate-500"
                      }`}
                    >
                      {f.title} · {f.lines} baris
                    </span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-xs font-semibold text-slate-400">
                File tidak ditemukan.
              </li>
            )}
          </ul>
        </aside>

        {/* Penampil kode */}
        <section className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-start md:justify-between md:p-5">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${KIND_META[active.kind].cls}`}
                >
                  <ActiveIcon className="h-3 w-3" /> {KIND_META[active.kind].label}
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">
                  {active.name} · {active.lines} baris ·{" "}
                  {(active.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-950">{active.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                {active.description}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:bg-slate-700"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Tersalin" : "Salin"}
              </button>
              <button
                onClick={downloadFile}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50"
              >
                <FileCode2 className="h-3.5 w-3.5" /> Unduh
              </button>
            </div>
          </div>

          <div className="relative max-h-[520px] overflow-auto bg-[#0b1220] p-4 md:p-5">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b1220]/80 text-xs font-bold text-teal-300">
                Memuat…
              </div>
            )}
            <pre className="m-0 whitespace-pre font-mono text-[11.5px] leading-[1.65] text-slate-200 md:text-[12.5px]">
              <code>{content}</code>
            </pre>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 p-4 text-[11px] font-bold text-slate-500 md:p-5">
        <span className="inline-flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-teal-700" />
          Salin file sesuai urutan ke editor Apps Script — nama file harus sama persis.
        </span>
        <span className="font-mono">POST APP_URL = JSON API (doPost)</span>
      </div>
    </div>
  );
}
