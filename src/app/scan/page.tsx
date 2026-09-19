"use client";
import { useState, useRef, useEffect } from "react";
import { QrCode, ScanLine, ShieldCheck, AlertCircle, UserCheck, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ScanPage() {
  const [qrValue, setQrValue] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScan = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
      setScanning(false);
    }
  };

  const stopScan = () => {
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopScan();
  }, []);

  const handleCheckIn = async () => {
    if (!qrValue.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: qrValue.trim(), scannedBy: "Scan Portal" }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setQrValue("");
      }
    } catch (e) {
      setResult({ error: "Koneksi gagal" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50">
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-900 via-blue-950 to-teal-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 md:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Scan QR Check-in</h1>
          <p className="text-blue-100/90 text-lg max-w-2xl mx-auto">Scan QR code peserta untuk validasi kehadiran secara otomatis. Proses cepat dan akurat.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 md:px-8 -mt-10 relative z-10 pb-20">
        <div className="rounded-3xl bg-white shadow-2xl shadow-slate-200/60 border border-slate-100 p-6 md:p-10">
          {/* Manual Input */}
          <div className="mb-8">
            <h2 className="text-lg font-extrabold text-slate-950 mb-4">Input Manual</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={qrValue}
                onChange={(e) => setQrValue(e.target.value)}
                placeholder="Masukkan kode QR atau scan otomatis..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleCheckIn()}
              />
              <button onClick={handleCheckIn} disabled={loading || !qrValue.trim()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-blue-800 text-white px-6 py-3.5 font-extrabold shadow-lg shadow-teal-700/20 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60">
                {loading ? <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (<><ScanLine className="h-5 w-5" /> Check-in</>)}
              </button>
            </div>
          </div>

          {/* Camera Scanner */}
          <div className="mb-8">
            <h2 className="text-lg font-extrabold text-slate-950 mb-4">Scan dengan Kamera</h2>
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-lg">
              {!scanning ? (
                <button onClick={startScan} className="w-full flex flex-col items-center justify-center gap-3 py-12 text-white hover:bg-slate-900 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-blue-700 flex items-center justify-center shadow-xl shadow-teal-500/30">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <span className="font-extrabold text-base">Aktifkan Kamera</span>
                  <span className="text-xs text-slate-400">Klik untuk memulai scan QR</span>
                </button>
              ) : (
                <div className="relative">
                  <video ref={videoRef} className="w-full h-72 object-cover" playsInline muted />
                  <div className="absolute inset-0 pointer-events-none border-[3px] border-amber-400/80 rounded-2xl m-6" />
                  <button onClick={stopScan} className="absolute bottom-3 right-3 rounded-full bg-red-600 text-white px-3 py-1.5 text-xs font-extrabold shadow-lg hover:bg-red-500 transition-colors">Stop</button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-3 font-medium">Pastikan QR code berada di dalam area kotak kuning untuk hasil terbaik.</p>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-2xl p-6 border-2 shadow-lg ${result.success ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-start gap-4">
                <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-md ${result.success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {result.success ? <CheckCircle2 className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
                </div>
                <div>
                  <h3 className={`text-lg font-extrabold mb-1 ${result.success ? "text-emerald-900" : "text-red-900"}`}>
                    {result.success ? (result.checkedIn ? "Check-in Berhasil" : "Sudah Check-in") : "Check-in Gagal"}
                  </h3>
                  <p className="text-sm font-medium text-slate-600 mb-3">{result.error || result.message || (result.success ? "Peserta berhasil diverifikasi." : "QR code tidak valid.")}</p>
                  {result.participant && (
                    <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-blue-800 text-white flex items-center justify-center font-extrabold text-sm shadow-lg">{result.participant.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</div>
                        <div>
                          <p className="font-extrabold text-slate-900">{result.participant.fullName}</p>
                          <p className="text-xs text-slate-500 font-medium">{result.participant.organization || "Tidak disebutkan"}</p>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-400 flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-teal-600" /> Status: {result.registration?.status === "checked_in" ? "Sudah Hadir" : result.registration?.status}</div>
                    </div>
                  )}
                  {result.success && result.checkedIn && (
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-extrabold shadow-sm"><UserCheck className="h-3.5 w-3.5" /> Kehadiran tercatat otomatis</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
