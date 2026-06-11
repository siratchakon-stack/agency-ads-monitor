"use client";

import { useState } from "react";
import { BarChart3, Shield, Zap, Bell } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/facebook");
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: "Monitor 100+ Accounts",
      desc: "Centralized dashboard for all Facebook Ad accounts",
    },
    {
      icon: Bell,
      title: "LINE Auto-Alerts",
      desc: "Instant notifications when balance drops below threshold",
    },
    {
      icon: Zap,
      title: "Real-time Sync",
      desc: "Auto-sync every 2 hours via cron jobs",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      desc: "Bank-grade security with encrypted token storage",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950/20 to-gray-950 flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <div className="text-white space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Agency Ads Monitor</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Never let your{" "}
              <span className="text-blue-400">ads stop</span>{" "}
              again
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Monitor all your Facebook Ad account balances in one dashboard.
              Get instant LINE alerts before your budget runs out.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <f.icon className="w-4 h-4 text-blue-400" />
                </div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-gray-400 text-sm">
              Sign in with your Facebook Agency account to get started
            </p>
          </div>

          {/* Notice */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">One Agency Account</p>
              <p className="text-blue-400/80">
                Connect your primary Facebook agency account to monitor all
                client ad accounts automatically.
              </p>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleFacebookLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#1664d4] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Continue with Facebook</span>
              </>
            )}
          </button>

          {/* Permissions Info */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 text-center font-medium uppercase tracking-wider">
              Permissions Required
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["ads_management", "ads_read", "business_management"].map(
                (perm) => (
                  <span
                    key={perm}
                    className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full border border-gray-700"
                  >
                    {perm}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Demo Mode */}
          <div className="border-t border-white/10 pt-4">
            <p className="text-xs text-gray-500 text-center mb-3">
              ยังไม่มี Facebook App?
            </p>
            <a
              href="/api/auth/demo"
              className="w-full flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-gray-300 hover:text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 text-sm"
            >
              🎯 ทดลองดู Demo Dashboard
            </a>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-600 text-center">
            By signing in, you agree to our Terms of Service. Your data is
            encrypted and never shared.
          </p>
        </div>
      </div>
    </div>
  );
}
