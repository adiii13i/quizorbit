"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);
      localStorage.setItem("email", data.email);

      if (data.role === "TUTOR") {
        router.push("/dashboard/tutor");
      } else {
        router.push("/dashboard/student");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex items-center
                    justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">
            QuizOrbit
          </h1>
          <p className="text-secondary text-sm mt-1">
            Learn. Teach. Grow.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border
                        border-gray-100 p-8">

          <h2 className="text-xl font-semibold text-primary mb-1">
            Create your account
          </h2>
          <p className="text-secondary text-sm mb-6">
            Join QuizOrbit as a tutor or student
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border
                            border-red-200 rounded-lg
                            text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium
                                text-primary mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full px-4 py-2.5 border border-gray-200
                           rounded-lg text-sm text-primary
                           placeholder-gray-400
                           focus:outline-none focus:ring-2
                           focus:ring-tertiary focus:border-transparent
                           transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium
                                text-primary mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 border border-gray-200
                           rounded-lg text-sm text-primary
                           placeholder-gray-400
                           focus:outline-none focus:ring-2
                           focus:ring-tertiary focus:border-transparent
                           transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium
                                text-primary mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Min 8 characters"
                className="w-full px-4 py-2.5 border border-gray-200
                           rounded-lg text-sm text-primary
                           placeholder-gray-400
                           focus:outline-none focus:ring-2
                           focus:ring-tertiary focus:border-transparent
                           transition-all"
              />
            </div>

            {/* Role Toggle */}
            <div>
              <label className="block text-sm font-medium
                                text-primary mb-2">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, role: "STUDENT" })
                  }
                  className={`py-2.5 px-4 rounded-lg border text-sm
                              font-medium transition-all ${
                    formData.role === "STUDENT"
                      ? "bg-tertiary text-white border-tertiary"
                      : "bg-white text-secondary border-gray-200 hover:border-tertiary"
                  }`}
                >
                  🎓 Student
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, role: "TUTOR" })
                  }
                  className={`py-2.5 px-4 rounded-lg border text-sm
                              font-medium transition-all ${
                    formData.role === "TUTOR"
                      ? "bg-tertiary text-white border-tertiary"
                      : "bg-white text-secondary border-gray-200 hover:border-tertiary"
                  }`}
                >
                  👨‍🏫 Tutor
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5
                         rounded-lg text-sm font-medium
                         hover:bg-tertiary transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         mt-2"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-secondary mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-tertiary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}