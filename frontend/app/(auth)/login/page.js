"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password");
      } else {
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        if (session?.user?.role === "TUTOR") {
          router.push("/dashboard/tutor");
        } else {
          router.push("/dashboard/student");
        }
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard/student" });
    } catch (err) {
      setError("Google login failed");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">QuizOrbit</h1>
          <p className="text-secondary text-sm mt-1">Learn. Teach. Grow.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-primary mb-1">Welcome back</h2>
          <p className="text-secondary text-sm mb-6">Sign in to your account</p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-2.5 px-4 text-sm font-medium text-primary hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
            </svg>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-secondary">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tertiary focus:border-transparent transition-all"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-primary">
                  Password
                </label>
                <button type="button" className="text-xs text-tertiary hover:underline">
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tertiary focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="text-center text-sm text-secondary mt-6">
            Don't have an account?{" "}
            <Link href="/signup" className="text-tertiary font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}