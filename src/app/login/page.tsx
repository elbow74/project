"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { doSignInWithGoogle } from "@/app/firebase/auth";
import { useAuth } from "@/context/authContext";

export default function LoginPage() {
  const auth = useAuth();
  const { userLoggedIn = false, loading = false } = auth || {};

  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && userLoggedIn) {
      router.replace("/dashboard");
    }
  }, [userLoggedIn, loading, router]);

  const onGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSigningIn) return;

    setIsSigningIn(true);
    try {
      await doSignInWithGoogle();
    } catch (err) {
      console.error(err); // or toast.error("Google sign-in failed")
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="max-w-md w-full space-y-10 relative z-10">
        {/* Header with Bubble Letters */}
        <div className="text-center space-y-6">
          {/* Bubble Letter Logo */}
          <div className="flex items-center justify-center mb-2">
            <h1 
              className="text-7xl md:text-8xl font-black relative inline-block select-none"
              style={{
                fontFamily: "system-ui, -apple-system, 'SF Pro Display', sans-serif",
                letterSpacing: "-0.02em",
                fontWeight: 900,
                background: "linear-gradient(135deg, #60a5fa 0%, #818cf8 30%, #a78bfa 60%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: `
                  3px 3px 0px rgba(96, 165, 250, 0.4),
                  6px 6px 0px rgba(96, 165, 250, 0.2),
                  9px 9px 15px rgba(0, 0, 0, 0.3),
                  0 0 50px rgba(96, 165, 250, 0.2)
                `,
                filter: "drop-shadow(0 8px 16px rgba(96, 165, 250, 0.25))",
                transform: "perspective(1200px) rotateX(3deg) scale(1)",
                lineHeight: "1.05",
                WebkitTextStroke: "1px rgba(96, 165, 250, 0.1)",
              }}
            >
              grouply
            </h1>
          </div>

          {/* Made by text */}
          <div className="space-y-1">
            <p className="text-sm text-gray-400 font-light tracking-wider uppercase">
              made by
            </p>
            <p className="text-base text-gray-300 font-medium tracking-wide">
              mukund, elton, and bhrugu
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-700/50">
          <form onSubmit={onGoogleSignIn} className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-gray-300 text-sm font-medium">Sign in to continue</p>
            </div>
            <Button
              type="submit"
              disabled={isSigningIn}
              className="w-full bg-white text-gray-900 border-2 border-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg flex items-center justify-center gap-3 py-6 text-base font-semibold shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isSigningIn ? "Signing in..." : "Continue with Google"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
