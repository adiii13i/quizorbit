"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CreateQuizPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState(null);

  const [aiForm, setAiForm] = useState({
    title: "",
    difficulty: "MEDIUM",
    numQuestions: 5,
    inputMode: "topic",
    topic: "",
    file: null,
  });

  const [manualForm, setManualForm] = useState({
    title: "",
    description: "",
    difficulty: "MEDIUM",
    isPublic: false,
  });

  // Manual Questions State
  const [questions, setQuestions] = useState([
    {
      questionText: "",
      orderIndex: 1,
      options: [
        { optionText: "", isCorrect: true },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
      ],
    },
  ]);

  const difficultyOptions = ["EASY", "MEDIUM", "HARD"];

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && allowedTypes.includes(file.type)) {
      setAiForm({ ...aiForm, file });
      setError("");
    } else {
      setError(
        "Unsupported file type. Please upload PDF, Word, PowerPoint or an image."
      );
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && allowedTypes.includes(file.type)) {
      setAiForm({ ...aiForm, file });
      setError("");
    } else {
      setError(
        "Unsupported file type. Please upload PDF, Word, PowerPoint or an image."
      );
    }
  };

  // ── AI Generation ──────────────────────────────────────

  const handleAiGenerate = async () => {
    if (!aiForm.title) {
      setError("Please enter a quiz title");
      return;
    }
    if (aiForm.inputMode === "topic" && !aiForm.topic) {
      setError("Please enter a topic or description");
      return;
    }
    if (aiForm.inputMode === "document" && !aiForm.file) {
      setError("Please upload a document");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = session?.user?.accessToken;
      let response;

      if (aiForm.inputMode === "document") {
        const formData = new FormData();
        formData.append("file", aiForm.file);
        formData.append("title", aiForm.title);
        formData.append("difficulty", aiForm.difficulty);
        formData.append("numQuestions", aiForm.numQuestions);

        response = await fetch(
          "http://localhost:8080/api/quiz/generate-from-file",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );
      } else {
        response = await fetch("http://localhost:8080/api/quiz/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: aiForm.title,
            topic: aiForm.topic,
            difficulty: aiForm.difficulty,
            numQuestions: aiForm.numQuestions,
          }),
        });
      }

      if (!response.ok) throw new Error("Failed to generate quiz");
      const data = await response.json();
      setGeneratedQuestions(data.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Save Quiz ──────────────────────────────────────────

  const handleSaveQuiz = async () => {
    setLoading(true);
    setError("");
    try {
      const token = session?.user?.accessToken;
      const response = await fetch("http://localhost:8080/api/quiz/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: aiForm.title,
          difficulty: aiForm.difficulty,
          isPublic: false,
          questions: generatedQuestions,
        }),
      });
      if (!response.ok) throw new Error("Failed to save quiz");
      router.push("/dashboard/tutor");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!manualForm.title) {
      setError("Please add a title");
      return;
    }
    if (questions.some((q) => !q.questionText)) {
      setError("Please fill in all questions");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = session?.user?.accessToken;
      const response = await fetch("http://localhost:8080/api/quiz/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...manualForm, questions }),
      });
      if (!response.ok) throw new Error("Failed to save quiz");
      router.push("/dashboard/tutor");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Generated Question Handlers ────────────────────────

  const updateGeneratedQuestion = (qIndex, value) => {
    const updated = [...generatedQuestions];
    updated[qIndex].questionText = value;
    setGeneratedQuestions(updated);
  };

  const updateGeneratedOption = (qIndex, oIndex, value) => {
    const updated = [...generatedQuestions];
    updated[qIndex].options[oIndex].optionText = value;
    setGeneratedQuestions(updated);
  };

  const setGeneratedCorrect = (qIndex, oIndex) => {
    const updated = [...generatedQuestions];
    updated[qIndex].options = updated[qIndex].options.map((o, i) => ({
      ...o,
      isCorrect: i === oIndex,
    }));
    setGeneratedQuestions(updated);
  };

  const deleteGeneratedQuestion = (qIndex) => {
    setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== qIndex));
  };

  const addManualToGenerated = () => {
    setGeneratedQuestions([
      ...generatedQuestions,
      {
        questionText: "",
        orderIndex: generatedQuestions.length + 1,
        options: [
          { optionText: "", isCorrect: true },
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
        ],
      },
    ]);
  };

  // ── Manual Question Handlers ───────────────────────────

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        orderIndex: questions.length + 1,
        options: [
          { optionText: "", isCorrect: true },
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
        ],
      },
    ]);
  };

  const updateQuestion = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].questionText = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex].optionText = value;
    setQuestions(updated);
  };

  const setCorrectAnswer = (qIndex, oIndex) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.map((o, i) => ({
      ...o,
      isCorrect: i === oIndex,
    }));
    setQuestions(updated);
  };

  const removeQuestion = (qIndex) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== qIndex));
  };

  // ── Shared Question Card ───────────────────────────────

  const QuestionCard = ({
    q,
    qIndex,
    onUpdateQuestion,
    onUpdateOption,
    onSetCorrect,
    onDelete,
  }) => (
    <div
      className="bg-white rounded-xl border p-6"
      style={{ borderColor: "#e2e8f0" }}
    >
      <div className="flex justify-between items-center mb-3">
        <span
          className="text-xs font-semibold px-2 py-1 rounded"
          style={{ backgroundColor: "#f1f5f9", color: "#475569" }}
        >
          Q{qIndex + 1}
        </span>
        <button
          onClick={() => onDelete(qIndex)}
          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
          style={{ color: "#94a3b8" }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px" }}
          >
            delete
          </span>
        </button>
      </div>

      <textarea
        value={q.questionText}
        onChange={(e) => onUpdateQuestion(qIndex, e.target.value)}
        placeholder="Enter your question here..."
        rows={2}
        className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none resize-none mb-4"
        style={{ borderColor: "#e2e8f0", color: "#1e2433" }}
      />

      <div className="space-y-2">
        <p
          className="text-xs font-medium mb-2"
          style={{ color: "#94a3b8" }}
        >
          OPTIONS — Click circle to mark correct answer
        </p>
        {q.options.map((opt, oIndex) => (
          <div key={oIndex} className="flex items-center gap-3">
            <button
              onClick={() => onSetCorrect(qIndex, oIndex)}
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                borderColor: opt.isCorrect ? "#16a34a" : "#cbd5e1",
                backgroundColor: opt.isCorrect ? "#16a34a" : "transparent",
              }}
            >
              {opt.isCorrect && (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "12px", color: "#ffffff" }}
                >
                  check
                </span>
              )}
            </button>
            <input
              type="text"
              value={opt.optionText}
              onChange={(e) => onUpdateOption(qIndex, oIndex, e.target.value)}
              placeholder={`Option ${oIndex + 1}`}
              className="flex-1 px-4 py-2 rounded-lg border text-sm focus:outline-none transition-all"
              style={{
                borderColor: opt.isCorrect ? "#bbf7d0" : "#e2e8f0",
                backgroundColor: opt.isCorrect ? "#f0fdf4" : "#ffffff",
                color: "#1e2433",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────

  return (
    <div
      className="min-h-screen px-6 py-8"
      style={{ backgroundColor: "#f8fafc", fontFamily: "Inter, sans-serif" }}
    >
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => {
              if (generatedQuestions) setGeneratedQuestions(null);
              else if (mode) setMode(null);
              else router.back();
            }}
            className="p-2 rounded-lg hover:bg-white border transition-all"
            style={{ borderColor: "#e2e8f0" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px", color: "#64748b" }}
            >
              arrow_back
            </span>
          </button>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "#1e2433" }}
            >
              {generatedQuestions ? "Review Questions" : "Create Quiz"}
            </h1>
            <p className="text-sm" style={{ color: "#64748b" }}>
              {generatedQuestions
                ? "Edit, add or remove questions before saving"
                : mode === "ai"
                ? "AI will generate and validate questions for you"
                : mode === "manual"
                ? "Add questions manually"
                : "Choose how you want to create your quiz"}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-6 p-4 rounded-lg border text-sm"
            style={{
              backgroundColor: "#fff5f5",
              borderColor: "#fecaca",
              color: "#dc2626",
            }}
          >
            {error}
          </div>
        )}

        {/* ── STEP 1: Mode Selection ── */}
        {!mode && !generatedQuestions && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* AI Mode Card */}
            <button
              onClick={() => setMode("ai")}
              className="p-8 rounded-xl border text-left transition-all hover:shadow-md"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "#e8f0fe" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "24px", color: "#1a56db" }}
                >
                  auto_awesome
                </span>
              </div>
              <h3
                className="font-semibold text-lg mb-2"
                style={{ color: "#1e2433" }}
              >
                Generate with AI
              </h3>
              <p className="text-sm" style={{ color: "#64748b" }}>
                Upload a document or describe your topic. AI generates and
                validates questions automatically.
              </p>
              <div
                className="mt-4 flex items-center gap-1 text-sm font-medium"
                style={{ color: "#1a56db" }}
              >
                Get started
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px" }}
                >
                  arrow_forward
                </span>
              </div>
            </button>

            {/* Manual Mode Card */}
            <button
              onClick={() => setMode("manual")}
              className="p-8 rounded-xl border text-left transition-all hover:shadow-md"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "#f1f5f9" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "24px", color: "#475569" }}
                >
                  edit_note
                </span>
              </div>
              <h3
                className="font-semibold text-lg mb-2"
                style={{ color: "#1e2433" }}
              >
                Create Manually
              </h3>
              <p className="text-sm" style={{ color: "#64748b" }}>
                Write your own questions and answers with full control over
                content.
              </p>
              <div
                className="mt-4 flex items-center gap-1 text-sm font-medium"
                style={{ color: "#475569" }}
              >
                Get started
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px" }}
                >
                  arrow_forward
                </span>
              </div>
            </button>
          </div>
        )}

        {/* ── STEP 2: AI Mode Form ── */}
        {mode === "ai" && !generatedQuestions && (
          <div
            className="bg-white rounded-xl border p-8"
            style={{ borderColor: "#e2e8f0" }}
          >
            <div className="space-y-6">

              {/* Quiz Title */}
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#1e2433" }}
                >
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={aiForm.title}
                  onChange={(e) =>
                    setAiForm({ ...aiForm, title: e.target.value })
                  }
                  placeholder="e.g. Operating Systems Quiz"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none"
                  style={{ borderColor: "#e2e8f0", color: "#1e2433" }}
                />
              </div>

              {/* Input Mode Toggle */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#1e2433" }}
                >
                  How would you like to provide content?
                </label>
                <div
                  className="flex gap-2 p-1 rounded-lg w-fit"
                  style={{ backgroundColor: "#f1f5f9" }}
                >
                  {[
                    { id: "topic", label: "Describe Topic", icon: "text_fields" },
                    { id: "document", label: "Upload Document", icon: "upload_file" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setAiForm({ ...aiForm, inputMode: opt.id })}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        backgroundColor:
                          aiForm.inputMode === opt.id ? "#ffffff" : "transparent",
                        color:
                          aiForm.inputMode === opt.id ? "#1e2433" : "#64748b",
                        boxShadow:
                          aiForm.inputMode === opt.id
                            ? "0 1px 3px rgba(0,0,0,0.1)"
                            : "none",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "16px" }}
                      >
                        {opt.icon}
                      </span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Description Input */}
              {aiForm.inputMode === "topic" && (
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#1e2433" }}
                  >
                    Topic / Description
                  </label>
                  <textarea
                    value={aiForm.topic}
                    onChange={(e) =>
                      setAiForm({ ...aiForm, topic: e.target.value })
                    }
                    placeholder="e.g. Process scheduling in Operating Systems — covering FCFS, SJF, Round Robin algorithms and their trade-offs"
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none resize-none"
                    style={{ borderColor: "#e2e8f0", color: "#1e2433" }}
                  />
                  <p
                    className="text-xs mt-1"
                    style={{ color: "#94a3b8" }}
                  >
                    The more detail you provide, the better the questions will be.
                  </p>
                </div>
              )}

              {/* Document Upload */}
              {aiForm.inputMode === "document" && (
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#1e2433" }}
                  >
                    Upload Document
                  </label>

                  {/* Supported Formats */}
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {[
                      { ext: "PDF", icon: "picture_as_pdf", color: "#ef4444" },
                      { ext: "DOCX", icon: "description", color: "#3b82f6" },
                      { ext: "PPTX", icon: "slideshow", color: "#f97316" },
                      { ext: "Image", icon: "image", color: "#8b5cf6" },
                    ].map((f) => (
                      <div
                        key={f.ext}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium"
                        style={{ borderColor: "#e2e8f0", color: "#64748b" }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "14px", color: f.color }}
                        >
                          {f.icon}
                        </span>
                        {f.ext}
                      </div>
                    ))}
                  </div>

                  {/* Drop Zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-slate-50"
                    style={{
                      borderColor: aiForm.file ? "#16a34a" : "#cbd5e1",
                      backgroundColor: aiForm.file ? "#f0fdf4" : "#fafafa",
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {aiForm.file ? (
                      <div>
                        <span
                          className="material-symbols-outlined block mb-2"
                          style={{ fontSize: "36px", color: "#16a34a" }}
                        >
                          check_circle
                        </span>
                        <p
                          className="font-medium text-sm"
                          style={{ color: "#16a34a" }}
                        >
                          {aiForm.file.name}
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: "#64748b" }}
                        >
                          {(aiForm.file.size / 1024).toFixed(1)} KB — Click to
                          change
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span
                          className="material-symbols-outlined block mb-2"
                          style={{ fontSize: "36px", color: "#cbd5e1" }}
                        >
                          upload_file
                        </span>
                        <p
                          className="font-medium text-sm"
                          style={{ color: "#1e2433" }}
                        >
                          Drop your file here or click to browse
                        </p>
                        <p
                          className="text-xs mt-2"
                          style={{ color: "#94a3b8" }}
                        >
                          Supports PDF, Word, PowerPoint and Images — up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Difficulty + Questions Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#1e2433" }}
                  >
                    Difficulty
                  </label>
                  <div className="flex gap-2">
                    {difficultyOptions.map((d) => (
                      <button
                        key={d}
                        onClick={() => setAiForm({ ...aiForm, difficulty: d })}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all"
                        style={{
                          backgroundColor:
                            aiForm.difficulty === d ? "#1e2433" : "#ffffff",
                          color:
                            aiForm.difficulty === d ? "#ffffff" : "#64748b",
                          borderColor:
                            aiForm.difficulty === d ? "#1e2433" : "#e2e8f0",
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#1e2433" }}
                  >
                    No. of Questions
                  </label>
                  <select
                    value={aiForm.numQuestions}
                    onChange={(e) =>
                      setAiForm({
                        ...aiForm,
                        numQuestions: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none"
                    style={{ borderColor: "#e2e8f0", color: "#1e2433" }}
                  >
                    {[5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n} Questions
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AI Info Box */}
              <div
                className="flex gap-3 p-4 rounded-lg"
                style={{ backgroundColor: "#e8f0fe" }}
              >
                <span
                  className="material-symbols-outlined flex-shrink-0"
                  style={{ fontSize: "20px", color: "#1a56db" }}
                >
                  info
                </span>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#1a56db" }}
                  >
                    Dual-Agent AI Validation
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#3b5fc0" }}>
                    A second AI agent verifies all generated questions for
                    accuracy before showing them to you.
                  </p>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleAiGenerate}
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                style={{ backgroundColor: "#1e2433", color: "#ffffff" }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating & Validating...
                  </>
                ) : (
                  <>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "18px" }}
                    >
                      auto_awesome
                    </span>
                    Generate Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review Generated Questions ── */}
        {generatedQuestions && (
          <div className="space-y-4">

            {/* Validation badge */}
            <div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px", color: "#16a34a" }}
                >
                  verified
                </span>
                <p
                  className="text-sm font-medium"
                  style={{ color: "#16a34a" }}
                >
                  {generatedQuestions.length} questions validated by AI
                </p>
              </div>
              <p className="text-xs" style={{ color: "#64748b" }}>
                Edit, delete or add questions below
              </p>
            </div>

            {/* Question Cards */}
            {generatedQuestions.map((q, qIndex) => (
              <QuestionCard
                key={qIndex}
                q={q}
                qIndex={qIndex}
                onUpdateQuestion={updateGeneratedQuestion}
                onUpdateOption={updateGeneratedOption}
                onSetCorrect={setGeneratedCorrect}
                onDelete={deleteGeneratedQuestion}
              />
            ))}

            {/* Add manual question */}
            <button
              onClick={addManualToGenerated}
              className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-all hover:bg-white"
              style={{ borderColor: "#cbd5e1", color: "#64748b" }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px" }}
              >
                add
              </span>
              Add Question Manually
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveQuiz}
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
              style={{ backgroundColor: "#1e2433", color: "#ffffff" }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "18px" }}
                  >
                    save
                  </span>
                  Save Quiz
                </>
              )}
            </button>
          </div>
        )}

        {/* ── STEP 2 (alt): Manual Mode Form ── */}
        {mode === "manual" && !generatedQuestions && (
          <div className="space-y-4">

            {/* Quiz Details Card */}
            <div
              className="bg-white rounded-xl border p-6"
              style={{ borderColor: "#e2e8f0" }}
            >
              <h3
                className="font-semibold mb-4"
                style={{ color: "#1e2433" }}
              >
                Quiz Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#1e2433" }}
                  >
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    value={manualForm.title}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, title: e.target.value })
                    }
                    placeholder="e.g. DBMS Mid-term Quiz"
                    className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none"
                    style={{ borderColor: "#e2e8f0", color: "#1e2433" }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#1e2433" }}
                  >
                    Description (optional)
                  </label>
                  <textarea
                    value={manualForm.description}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brief description of this quiz..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none resize-none"
                    style={{ borderColor: "#e2e8f0", color: "#1e2433" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "#1e2433" }}
                    >
                      Difficulty
                    </label>
                    <div className="flex gap-2">
                      {difficultyOptions.map((d) => (
                        <button
                          key={d}
                          onClick={() =>
                            setManualForm({ ...manualForm, difficulty: d })
                          }
                          className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all"
                          style={{
                            backgroundColor:
                              manualForm.difficulty === d
                                ? "#1e2433"
                                : "#ffffff",
                            color:
                              manualForm.difficulty === d
                                ? "#ffffff"
                                : "#64748b",
                            borderColor:
                              manualForm.difficulty === d
                                ? "#1e2433"
                                : "#e2e8f0",
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "#1e2433" }}
                    >
                      Visibility
                    </label>
                    <div className="flex gap-2">
                      {["Private", "Public"].map((v) => (
                        <button
                          key={v}
                          onClick={() =>
                            setManualForm({
                              ...manualForm,
                              isPublic: v === "Public",
                            })
                          }
                          className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all"
                          style={{
                            backgroundColor:
                              manualForm.isPublic === (v === "Public")
                                ? "#1e2433"
                                : "#ffffff",
                            color:
                              manualForm.isPublic === (v === "Public")
                                ? "#ffffff"
                                : "#64748b",
                            borderColor:
                              manualForm.isPublic === (v === "Public")
                                ? "#1e2433"
                                : "#e2e8f0",
                          }}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Question Cards */}
            {questions.map((q, qIndex) => (
              <QuestionCard
                key={qIndex}
                q={q}
                qIndex={qIndex}
                onUpdateQuestion={updateQuestion}
                onUpdateOption={updateOption}
                onSetCorrect={setCorrectAnswer}
                onDelete={removeQuestion}
              />
            ))}

            {/* Add Question */}
            <button
              onClick={addQuestion}
              className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-all hover:bg-white"
              style={{ borderColor: "#cbd5e1", color: "#64748b" }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px" }}
              >
                add
              </span>
              Add Question
            </button>

            {/* Save */}
            <button
              onClick={handleManualSave}
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
              style={{ backgroundColor: "#1e2433", color: "#ffffff" }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "18px" }}
                  >
                    save
                  </span>
                  Save Quiz
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Material Icons */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        rel="stylesheet"
      />
    </div>
  );
}