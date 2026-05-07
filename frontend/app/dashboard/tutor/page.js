"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TutorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("overview");

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: "dashboard" },
    { id: "classes", label: "My Classes", icon: "school" },
    { id: "library", label: "Quiz Library", icon: "library_books" },
    { id: "live", label: "Live Sessions", icon: "live_tv" },
  ];

  const stats = [
    { label: "Total Students", value: "0", icon: "groups" },
    { label: "Quizzes Hosted", value: "0", icon: "assignment" },
    { label: "Average Score", value: "N/A", icon: "analytics" },
  ];

  return (
    <div className="flex min-h-screen"
         style={{ backgroundColor: "#f8fafc", fontFamily: "Inter, sans-serif" }}>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full flex flex-col py-6 z-50 transition-all duration-300"
             style={{
               width: collapsed ? "64px" : "232px",
               backgroundColor: "#ffffff",
               borderRight: "1px solid #e2e8f0",
             }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 mb-8">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#1e2433" }}>
                QuizOrbit
              </h1>
              <p className="text-xs" style={{ color: "#64748b" }}>
                Educator Suite
              </p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg transition-colors hover:bg-slate-100"
            style={{ color: "#64748b" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              {collapsed ? "menu" : "menu_open"}
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-grow">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveNav(item.id)}
                    title={collapsed ? item.label : ""}
                    className="w-full flex items-center transition-all text-left py-2.5"
                    style={{
                      paddingLeft: "16px",
                      paddingRight: "16px",
                      color: isActive ? "#1e2433" : "#64748b",
                      fontWeight: isActive ? "600" : "400",
                      backgroundColor: isActive ? "#f1f5f9" : "transparent",
                      borderRight: isActive
                        ? "3px solid #1e2433"
                        : "3px solid transparent",
                      borderRadius: "0",
                    }}
                  >
                    <span className="material-symbols-outlined flex-shrink-0"
                          style={{ fontSize: "20px" }}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="ml-3 text-sm whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="px-3 mt-auto">
          <button
            onClick={() => router.push("/dashboard/tutor/live")}
            title={collapsed ? "Start Session" : ""}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90 mb-4 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#1e2433", color: "#ffffff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              play_circle
            </span>
            {!collapsed && <span>Start Session</span>}
          </button>

          <div className="flex items-center gap-3 border-t pt-4"
               style={{ borderColor: "#e2e8f0" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white text-sm flex-shrink-0"
                 style={{ backgroundColor: "#1e2433" }}>
              {session?.user?.name?.charAt(0) || "T"}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate"
                   style={{ color: "#1e2433" }}>
                  {session?.user?.name || "Tutor"}
                </p>
                <button onClick={handleSignOut}
                        className="text-xs hover:underline"
                        style={{ color: "#64748b" }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 transition-all duration-300"
            style={{ marginLeft: collapsed ? "64px" : "232px" }}>

        {/* Top Bar */}
        <header className="sticky top-0 z-40 border-b px-6 h-16 flex items-center justify-between"
                style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
          <div className="flex items-center flex-grow max-w-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ fontSize: "18px", color: "#94a3b8" }}>
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border focus:outline-none transition-all"
                style={{
                  backgroundColor: "#f8fafc",
                  borderColor: "#e2e8f0",
                  color: "#1e2433",
                }}
                placeholder="Search quizzes, students..."
              />
            </div>
          </div>
          <div className="flex items-center gap-3 ml-6 pl-6 border-l"
               style={{ borderColor: "#e2e8f0" }}>
            <button className="material-symbols-outlined"
                    style={{ fontSize: "22px", color: "#64748b" }}>
              notifications
            </button>
            <button className="material-symbols-outlined"
                    style={{ fontSize: "22px", color: "#64748b" }}>
              help_outline
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="px-8 py-8 max-w-5xl mx-auto">

          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#1e2433" }}>
                Dashboard
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
                Welcome back, {session?.user?.name?.split(" ")[0] || "Tutor"}!
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/tutor/create-quiz")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-all"
              style={{ backgroundColor: "#1e2433", color: "#ffffff" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                add
              </span>
              Create Quiz
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div key={i}
                   className="p-5 rounded-xl border"
                   style={{
                     backgroundColor: "#ffffff",
                     borderColor: "#e2e8f0",
                   }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg"
                       style={{ backgroundColor: "#f1f5f9" }}>
                    <span className="material-symbols-outlined"
                          style={{ fontSize: "18px", color: "#475569" }}>
                      {stat.icon}
                    </span>
                  </div>
                </div>
                <p className="text-xs font-medium uppercase tracking-wide mb-1"
                   style={{ color: "#94a3b8" }}>
                  {stat.label}
                </p>
                <h3 className="text-3xl font-bold" style={{ color: "#1e2433" }}>
                  {stat.value}
                </h3>
              </div>
            ))}
          </div>

          {/* Recent Quizzes */}
          <div className="rounded-xl border overflow-hidden mb-6"
               style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
            <div className="px-6 py-4 border-b flex justify-between items-center"
                 style={{ borderColor: "#e2e8f0" }}>
              <h4 className="font-semibold text-base" style={{ color: "#1e2433" }}>
                Recent Quizzes
              </h4>
            </div>
            <div className="py-14 text-center">
              <span className="material-symbols-outlined mb-3 block"
                    style={{ fontSize: "40px", color: "#cbd5e1" }}>
                assignment
              </span>
              <p className="font-medium text-sm mb-1" style={{ color: "#1e2433" }}>
                No quizzes yet
              </p>
              <p className="text-sm mb-5" style={{ color: "#94a3b8" }}>
                Create your first quiz to get started
              </p>
              <button
                onClick={() => router.push("/dashboard/tutor/create-quiz")}
                className="px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: "#e8f0fe", color: "#1a56db" }}
              >
                Create Your First Quiz
              </button>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Create Quiz CTA */}
            <div className="rounded-xl border p-6"
                 style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
              <h4 className="font-semibold mb-1" style={{ color: "#1e2433" }}>
                Create a Quiz
              </h4>
              <p className="text-sm mb-4" style={{ color: "#64748b" }}>
                Enter a topic and let AI generate quiz questions for you instantly.
              </p>
              <button
                onClick={() => router.push("/dashboard/tutor/create-quiz")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: "#1e2433", color: "#ffffff" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  auto_awesome
                </span>
                Generate with AI
              </button>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border p-6"
                 style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
              <h4 className="font-semibold mb-4" style={{ color: "#1e2433" }}>
                Quick Actions
              </h4>
              <div className="space-y-2">
                {[
                  { icon: "live_tv", label: "Start Live Session", path: "/dashboard/tutor/live" },
                  { icon: "bar_chart", label: "View Analytics", path: "/dashboard/tutor/analytics" },
                  { icon: "people", label: "View Followers", path: "/dashboard/tutor/followers" },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(action.path)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all hover:bg-slate-50 text-left border"
                    style={{ borderColor: "#e2e8f0", color: "#475569" }}
                  >
                    <span className="material-symbols-outlined"
                          style={{ fontSize: "18px", color: "#94a3b8" }}>
                      {action.icon}
                    </span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        rel="stylesheet"
      />
    </div>
  );
}