"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { doSignInWithGoogle } from "@/app/firebase/auth";
import { useAuth } from "@/context/authContext";

export default function LoginPage() {
  const { userLoggedIn, loading } = useAuth();

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Calendar Assistant
          </h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={onGoogleSignIn} className="space-y-6">
            <Button
              type="submit"
              disabled={isSigningIn}
              className="w-full bg-white text-gray-900 border hover:bg-accent flex items-center justify-center gap-2"
            >
              <span className="inline-block h-4 w-4 rounded-full bg-blue-600" />
              Continue with Google
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Don't have an account?{" "}
            <a
              href="#"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
