"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { LogIn, Shield, User, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left side: Premium Branding Cover (visible on desktop) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-dark via-primary to-[#085a61] text-teal-50 p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract decorative background elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-80 h-80 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 relative z-10">
          <img src="/logo.png" alt="Logo Pemkab Tana Toraja" className="w-12 h-14 object-contain filter drop-shadow-md" />
          <div>
            <h1 className="font-display font-bold text-white tracking-tight leading-none text-lg">
              SENTER ASN
            </h1>
            <span className="text-[11px] font-bold text-primary-light/90 tracking-wider block mt-1">
              BKPSDM Kabupaten Tana Toraja
            </span>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="space-y-4 max-w-lg my-auto relative z-10">
          <span className="text-[10px] font-bold tracking-widest text-primary-light bg-white/10 px-3 py-1 rounded-full border border-white/5">
            Sistem Early Warning Presensi
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight leading-tight text-white">
            Pengawasan Disiplin ASN yang Lebih Cerdas & Transparan
          </h2>
          <p className="text-xs text-[#ccfbf1]/90 leading-relaxed font-medium">
            SENTER ASN membantu Pemerintah Kabupaten Tana Toraja memantau tingkat kehadiran, kepatuhan jam kerja, dan hadir efektif OPD pelayanan publik secara akurat dan real-time.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-primary-light/70 font-semibold relative z-10">
          © {new Date().getFullYear()} BKPSDM Kabupaten Tana Toraja. All rights reserved.
        </div>
      </div>

      {/* Right side: Login Form Pane */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/30 sm:bg-white">
        <div className="w-full max-w-sm space-y-8 bg-white p-8 sm:p-0 rounded-3xl border sm:border-0 border-slate-200/80">
          {/* Brand Header for Form */}
          <div className="text-center md:text-left space-y-2">
            {/* Mobile logo only (hidden on desktop view) */}
            <div className="flex md:hidden items-center justify-center gap-3 mb-2">
              <img src="/logo.png" alt="Logo Pemkab Tana Toraja" className="w-10 h-12 object-contain drop-shadow-sm" />
              <div className="text-left">
                <h2 className="font-display text-lg font-extrabold text-slate-800 tracking-tight leading-none">
                  SENTER ASN
                </h2>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                  BKPSDM Kab. Tana Toraja
                </p>
              </div>
            </div>

            <h2 className="font-display text-2xl font-extrabold text-slate-800 tracking-tight">
              Selamat Datang
            </h2>
            <p className="text-xs text-slate-400 font-semibold">
              Silakan masuk ke akun Anda untuk mengelola dashboard presensi
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-2xl border border-red-100 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white text-slate-700 font-medium placeholder-slate-400"
                  placeholder="Masukkan username"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white text-slate-700 font-medium placeholder-slate-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-dark hover:bg-[#085a61] text-white py-3 rounded-xl transition duration-150 disabled:opacity-50 font-bold text-xs shadow-none mt-2"
            >
              <LogIn className="w-4 h-4" /> {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Debug API URL */}
          <div className="text-center text-[9px] text-slate-300 font-mono select-none">
            API: {process.env.NEXT_PUBLIC_API_URL || "fallback (localhost)"}
          </div>

          {/* Footer info for Mobile View */}
          <div className="block md:hidden text-center text-[10px] text-slate-400 font-medium pt-4 border-t border-slate-100">
            © {new Date().getFullYear()} BKPSDM Tana Toraja.
          </div>
        </div>
      </div>
    </div>
  );
}
