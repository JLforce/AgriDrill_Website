"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullname } },
      });
      if (error) {
        setErrorMessage(error.message);
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleSubmitting(true);
    setErrorMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setErrorMessage(error.message);
        setIsGoogleSubmitting(false);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl relative animate-fade-in-up">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-3 text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none"
          aria-label="Close signup modal"
        >
          ×
        </button>

        {/* Scrollable content */}
        <div className="px-8 py-5">

          {/* Logo + brand */}
          <div className="mb-3 text-center flex flex-col items-center">
            <Image
              src="/agridrill-logo.png"
              alt="AgriDrill Logo"
              width={40}
              height={40}
              className="mb-1"
            />
            <span className="text-xl font-bold text-gray-900">AgriDrill</span>
          </div>

          {/* Heading */}
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-1 text-sm text-gray-600">Start managing your autonomous drilling operations</p>
          </div>

          {errorMessage && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleSubmitting}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-6 py-2.5 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            {isGoogleSubmitting ? "Redirecting..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">or sign up with email</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <form onSubmit={handleSignup}>
            <div className="space-y-3">

              <div>
                <label htmlFor="signup-fullname" className="mb-1 block text-sm font-medium text-gray-900">
                  Full Name
                </label>
                <input
                  type="text"
                  id="signup-fullname"
                  name="fullname"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-500 transition focus:border-[#16d39a] focus:outline-none focus:ring-2 focus:ring-[#16d39a]/20"
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-gray-900">
                  Email
                </label>
                <input
                  type="email"
                  id="signup-email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-500 transition focus:border-[#16d39a] focus:outline-none focus:ring-2 focus:ring-[#16d39a]/20"
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-gray-900">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="signup-password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pr-12 text-gray-900 placeholder-gray-500 transition focus:border-[#16d39a] focus:outline-none focus:ring-2 focus:ring-[#16d39a]/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="signup-confirm-password" className="mb-1 block text-sm font-medium text-gray-900">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="signup-confirm-password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pr-12 text-gray-900 placeholder-gray-500 transition focus:border-[#16d39a] focus:outline-none focus:ring-2 focus:ring-[#16d39a]/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="signup-terms"
                  name="terms"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#16d39a] focus:ring-2 focus:ring-[#16d39a]/20"
                  required
                />
                <label htmlFor="signup-terms" className="ml-2 text-sm text-gray-700">
                  I agree to the{" "}
                  <Link href="#" className="font-medium text-[#16d39a] transition hover:text-[#12b684]">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="font-medium text-[#16d39a] transition hover:text-[#12b684]">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-[#16d39a] px-6 py-2.5 font-semibold text-white shadow-lg shadow-[#16d39a]/25 transition hover:bg-[#14c78f] hover:shadow-xl hover:shadow-[#16d39a]/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => { onClose(); onSwitchToLogin(); }}
              className="font-semibold text-[#16d39a] transition hover:text-[#12b684]"
            >
              Sign in
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}