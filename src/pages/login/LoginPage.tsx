import { useState } from "react";
import {
  Mail, Lock, Eye, EyeOff, HelpCircle, ChevronDown,
  Users, Building2, Shield, Briefcase, Star, CalendarDays,
} from "lucide-react";
import type { User, Role } from "../../lib/types";
import { USERS, COLLEGE_NAME, COLLEGE_SHORT, COLLEGE_AFFILIATION } from "../../lib/data";
import kiotLogo from "../../imports/images.png";

interface Props {
  onLogin: (user: User) => void;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.4 0 6.4 1.17 8.8 3.46l6.5-6.5C35.4 2.5 30.1 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.6 5.9C11.9 13.1 17.4 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.15-3.1-.4-4.6H24v9.1h12.7c-.55 2.9-2.2 5.4-4.7 7l7.4 5.7C43.9 37.4 46.5 31.5 46.5 24.5z" />
      <path fill="#FBBC05" d="M10.1 19.1c-.5 1.4-.75 2.9-.75 4.4s.25 3 .75 4.4l-7.6 5.9C.9 30.9 0 27.5 0 23.5s.9-7.4 2.5-10.3l7.6 5.9z" />
      <path fill="#34A853" d="M24 47c6.1 0 11.3-2 15-5.5l-7.4-5.7c-2.1 1.4-4.7 2.2-7.6 2.2-6.6 0-12.1-4.5-14-10.5l-7.6 5.9C6.5 41.6 14.6 47 24 47z" />
    </svg>
  );
}

const ROLE_CHIP: Record<Role, { cls: string; icon: React.ReactNode; label: string }> = {
  staff: { cls: "bg-blue-50 text-blue-700 border-blue-200", icon: <Users size={10} />, label: "Faculty" },
  hod: { cls: "bg-purple-50 text-purple-700 border-purple-200", icon: <Building2 size={10} />, label: "HOD" },
  principal: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Shield size={10} />, label: "Principal" },
  placement_coordinator: { cls: "bg-teal-50 text-teal-700 border-teal-200", icon: <Briefcase size={10} />, label: "Placement Coord." },
  placement_director: { cls: "bg-rose-50 text-rose-700 border-rose-200", icon: <Star size={10} />, label: "Placement Director" },
  event_coordinator: { cls: "bg-pink-50 text-pink-700 border-pink-200", icon: <CalendarDays size={10} />, label: "Event Coordinator" },
};

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = USERS.find(u => u.email === email && u.password === password);
    if (user) onLogin(user);
    else setError("Invalid email or password. Please try a demo account below.");
  }

  return (
    <div className="min-h-screen flex overflow-hidden">
      <style>{`
        @keyframes orbit-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes orbit-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
        @keyframes slide-up  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pen-draw  { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
      `}</style>

      {/* ── LEFT: navy orbital panel ── */}
      <div
        className="hidden lg:flex flex-col relative overflow-hidden"
        style={{ width: "46%", background: "linear-gradient(145deg, #08122e 0%, #1a3567 55%, #0c1a3a 100%)" }}
      >
        {/* Ambient glow blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[20%] left-[15%] w-72 h-72 rounded-full"
               style={{ background: "radial-gradient(circle, rgba(200,168,75,0.12), transparent 65%)" }} />
          <div className="absolute bottom-[20%] right-[10%] w-56 h-56 rounded-full"
               style={{ background: "radial-gradient(circle, rgba(100,140,220,0.10), transparent 65%)" }} />
        </div>

        {/* Logo + college name */}
        <div className="relative z-10 flex items-center gap-3 px-9 pt-9">
          <div className="w-11 h-11 rounded-xl bg-white/95 flex items-center justify-center shadow-lg overflow-hidden p-0.5">
            <img src={kiotLogo} alt="KIOT Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <p className="text-[#c8a84b] text-sm font-bold tracking-widest">{COLLEGE_SHORT}</p>
            <p className="text-white/40 text-[10px] tracking-wider">e-Circular System</p>
          </div>
        </div>

        {/* Orbital animation */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-[300px] h-[300px]">
            {/* Ring 1 — outermost, slow CW, dashed */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: "1px dashed rgba(255,255,255,0.10)",
                animation: "orbit-cw 45s linear infinite",
              }}
            >
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#c8a84b]/50 rounded-sm" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#c8a84b]/30 rounded-sm" />
            </div>

            {/* Ring 2 — mid, CCW */}
            <div
              className="absolute inset-[40px] rounded-full"
              style={{
                border: "1.5px solid rgba(255,255,255,0.18)",
                animation: "orbit-ccw 28s linear infinite",
              }}
            >
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/70" />
              <span className="absolute top-[22%] -right-1 w-2 h-2 rounded-full bg-[#c8a84b]/60" />
              <span className="absolute bottom-[22%] -left-1 w-1.5 h-1.5 rounded-full bg-white/30" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/50" />
            </div>

            {/* Ring 3 — inner, fast CW */}
            <div
              className="absolute inset-[76px] rounded-full"
              style={{
                border: "1px solid rgba(200,168,75,0.22)",
                animation: "orbit-cw 16s linear infinite",
              }}
            >
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#c8a84b]/80" />
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30" />
            </div>

            {/* Centre — document icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[100px] h-[100px] rounded-full bg-white/6 border border-white/12 flex items-center justify-center backdrop-blur-sm shadow-xl">
                <div className="w-[68px] h-[68px] rounded-full border border-[#c8a84b]/35 bg-[#c8a84b]/10 flex items-center justify-center">
                  <svg viewBox="0 0 36 42" width="26" height="30" fill="none">
                    <rect x="2" y="2" width="32" height="38" rx="3" fill="rgba(255,255,255,0.08)" stroke="#c8a84b" strokeWidth="1.5"/>
                    <line x1="8" y1="12" x2="28" y2="12" stroke="#c8a84b" strokeWidth="1.5" opacity="0.9" strokeLinecap="round"/>
                    <line x1="8" y1="18" x2="28" y2="18" stroke="#c8a84b" strokeWidth="1.5" opacity="0.65" strokeLinecap="round"/>
                    <line x1="8" y1="24" x2="22" y2="24" stroke="#c8a84b" strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/>
                    <circle cx="25" cy="32" r="4.5" fill="#c8a84b" opacity="0.85"/>
                    <path d="M23 32l1.5 1.5L27 29.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="relative z-10 px-9 pb-9" />
      </div>

      {/* ── RIGHT: form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f5f4ef] relative overflow-y-auto px-6 py-10">
        {/* Soft background blobs */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ backgroundImage: "radial-gradient(circle at 88% 8%, rgba(26,53,103,0.05) 0%, transparent 42%), radial-gradient(circle at 8% 92%, rgba(200,168,75,0.04) 0%, transparent 42%)" }} />

        <div className="relative w-full max-w-[360px]" style={{ animation: "slide-up 0.45s ease-out" }}>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl border border-[#e2e7f0] bg-white shadow-sm overflow-hidden mb-2 p-1">
              <img src={kiotLogo} alt="KIOT Logo" className="w-full h-full object-contain p-0.5" />
            </div>
            <p className="text-sm font-bold text-[#0f1c3f]">{COLLEGE_NAME}</p>
          </div>

          {/* Heading */}
          <p className="text-[11px] font-semibold text-[#6b7597] tracking-[0.18em] uppercase mb-2">Portal Access</p>
          <h1 className="text-[32px] text-[#0f1c3f] font-normal leading-tight mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}>
            Welcome back
          </h1>
          <p className="text-sm text-[#6b7597] mb-7 leading-relaxed">
            Sign in to manage circulars, track approvals and apply digital signatures.
          </p>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,0.07)] p-6">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-[#1a2340] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a8b3d0]" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="you@kiot.ac.in"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#e2e7f0] bg-[#f8faff] text-sm text-[#0f1c3f] placeholder:text-[#b8c2d8] outline-none focus:border-[#1a3567] focus:ring-2 focus:ring-[#1a3567]/12 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-[#1a2340] mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a8b3d0]" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#e2e7f0] bg-[#f8faff] text-sm text-[#0f1c3f] placeholder:text-[#b8c2d8] outline-none focus:border-[#1a3567] focus:ring-2 focus:ring-[#1a3567]/12 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8b3d0] hover:text-[#5a6483] transition-colors"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-[#5a6483] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[#c8d0e8] accent-[#1a3567]"
                  />
                  Remember me
                </label>
                <button type="button" className="text-xs text-[#1a3567] font-medium hover:underline">
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-red-700 text-xs">
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold shrink-0">!</span>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="w-full rounded-full bg-[#1a3567] hover:bg-[#152d58] active:scale-[0.98] text-white text-sm font-semibold py-3 transition-all shadow-sm hover:shadow-md mt-1"
              >
                Sign In to Portal
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <span className="h-px flex-1 bg-[#eaecf5]" />
              <span className="text-[10px] text-[#a8b3d0] uppercase tracking-widest">or</span>
              <span className="h-px flex-1 bg-[#eaecf5]" />
            </div>

            {/* Google button */}
            <button className="w-full flex items-center justify-center gap-2.5 rounded-full border border-[#e2e7f0] py-2.5 text-sm text-[#1a2340] hover:bg-[#f4f6fc] transition-colors font-medium">
              <GoogleIcon />
              Sign in with Google Workspace
            </button>
          </div>

          {/* Demo accounts */}
          <div className="mt-5">
            <button
              onClick={() => setShowDemo(v => !v)}
              className="flex items-center gap-1.5 mx-auto text-xs text-[#6b7597] hover:text-[#1a3567] transition-colors"
            >
              <ChevronDown size={13} className={`transition-transform duration-200 ${showDemo ? "rotate-180" : ""}`} />
              Demo Accounts
            </button>

            {showDemo && (
              <div className="mt-3 bg-white rounded-xl border border-[#e2e7f0] p-3 shadow-sm">
                <p className="text-[10px] text-center text-[#a8b3d0] mb-2">Click a row to auto-fill credentials</p>
                <div className="space-y-1">
                  {USERS.map(u => {
                    const chip = ROLE_CHIP[u.role];
                    return (
                      <button
                        key={u.id}
                        onClick={() => { setEmail(u.email); setPassword(u.password); setError(""); setShowDemo(false); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#f4f6fc] border border-transparent hover:border-[#e2e7f0] transition-all text-left group"
                      >
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${chip.cls}`}>
                          {chip.icon} {chip.label}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0f1c3f] truncate group-hover:text-[#1a3567]">{u.name}</p>
                          <p className="text-[10px] text-[#a8b3d0] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {u.email}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-[#a8b3d0] mt-6 leading-relaxed">
            © 2025 {COLLEGE_NAME}<br />{COLLEGE_AFFILIATION}
          </p>
        </div>

        {/* Help button */}
        <button className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-[#1a3567] text-white shadow-lg hover:bg-[#152d58] hover:scale-105 flex items-center justify-center transition-all">
          <HelpCircle size={18} />
        </button>
      </div>
    </div>
  );
}
