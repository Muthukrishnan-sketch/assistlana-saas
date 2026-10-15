"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import { supabase } from "@/lib/supabase";

const BACKEND = typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "https://assistlana-backend.onrender.com";

// ── Job role map ──
const ROLE_MAP = [
  { role:"Data Scientist",       match:["python","machine learning","pandas","numpy","scikit-learn","deep learning","tensorflow","pytorch","statistics"], color:"#8B5CF6", icon:"🧠", it:true  },
  { role:"Backend Developer",    match:["python","django","fastapi","flask","node.js","java","spring","postgresql","mysql","rest api","sql"],              color:"#1253A4", icon:"⚙️", it:true  },
  { role:"Frontend Developer",   match:["react","javascript","html","css","tailwind","bootstrap","vue","angular","next.js","redux"],                       color:"#0EA5C9", icon:"🎨", it:true  },
  { role:"Full Stack Developer", match:["react","node.js","javascript","python","django","postgresql","mongodb","html","css"],                             color:"#10B981", icon:"💻", it:true  },
  { role:"Data Analyst",         match:["sql","excel","tableau","power bi","statistics","data analysis","python","pandas","bi"],                           color:"#F59E0B", icon:"📊", it:true  },
  { role:"DevOps Engineer",      match:["docker","kubernetes","aws","linux","ci/cd","terraform","jenkins","github actions"],                               color:"#EF4444", icon:"🔧", it:true  },
  { role:"ML Engineer",          match:["machine learning","deep learning","tensorflow","pytorch","python","nlp","opencv","scikit-learn"],                 color:"#EC4899", icon:"🤖", it:true  },
  { role:"HR Executive",         match:["communication","leadership","management","hr management","team work","public speaking"],                          color:"#8B5CF6", icon:"👥", it:false },
  { role:"Marketing Executive",  match:["marketing","communication","ms office","excel","customer service","sales","public speaking"],                     color:"#F59E0B", icon:"📣", it:false },
  { role:"Business Analyst",     match:["excel","sql","data analysis","statistics","power bi","tableau","communication","problem solving"],                color:"#10B981", icon:"📋", it:false },
  { role:"Sales Executive",      match:["sales","communication","customer service","leadership","problem solving","ms office"],                            color:"#0EA5C9", icon:"💼", it:false },
  { role:"Operations Manager",   match:["management","leadership","team work","problem solving","ms office","excel","communication"],                      color:"#1253A4", icon:"🏢", it:false },
];

// ── Job Suggestions Component ──
function JobSuggestions({ skills, mcqScore, codeScore, isNonIT, candidate, onChoice }) {
  const [selected,    setSelected]    = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  const skillLw = skills.map(s => s.toLowerCase());

  const getExtraScore = () => {
    let extra = 0;
    const resumeText = (candidate?.resume_text || "").toLowerCase();
    if (resumeText.includes("project") || resumeText.includes("github")) extra += 5;
    if (resumeText.includes("certif") || resumeText.includes("aws") || resumeText.includes("google")) extra += 3;
    if (candidate?.linkedin || resumeText.includes("linkedin")) extra += 2;
    return Math.min(extra, 10);
  };

  const extraScore = getExtraScore();

  const matched = ROLE_MAP
    .filter(r => isNonIT ? !r.it : r.it)
    .map(r => {
      const hits          = r.match.filter(m =>
        skillLw.some(s => s.includes(m) || m.includes(s))
      );
      const skillMatchPct = Math.round((hits.length / r.match.length) * 100);

      let eligibility;
      if (isNonIT) {
        eligibility = Math.round(
          (mcqScore * 0.70) +
          (skillMatchPct * 0.20) +
          (extraScore)
        );
      } else {
        eligibility = Math.round(
          (codeScore  * 0.40) +
          (mcqScore   * 0.30) +
          (skillMatchPct * 0.20) +
          (extraScore)
        );
      }

      return {
        ...r,
        hits:         hits.length,
        skillMatchPct,
        extraScore,
        pct:          Math.min(eligibility, 99),
      };
    })
    .filter(r => r.hits > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  if (matched.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <div className="text-3xl mb-2">💼</div>
          <div className="text-sm">Add more skills to see job suggestions</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
      <div className="font-bold text-[#1E293B] mb-1">💼 Suggested Job Roles</div>
      <div className="text-xs text-slate-400 mb-3">
        Eligibility = {isNonIT ? "MCQ 70% + Skills 20% + Profile 10%" : "Code 40% + MCQ 30% + Skills 20% + Profile 10%"}
      </div>

      <div className="space-y-2 mb-3">
        {matched.map((r, i) => (
          <button key={i}
            onClick={() => { setSelected(r); setShowOptions(true); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              selected?.role === r.role
                ? "border-[#1253A4] bg-[#EFF6FF]"
                : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#1253A4]"
            }`}>
            <span className="text-xl flex-shrink-0">{r.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#1E293B]">{r.role}</div>
              <div className="flex items-center gap-1 mt-1">
                <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width:`${r.pct}%`, background: r.pct >= 75 ? "#10B981" : r.pct >= 50 ? "#F59E0B" : "#EF4444" }}/>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">Skills {r.skillMatchPct}%</span>
              </div>
            </div>
            <span className={`text-xs font-bold flex-shrink-0 px-2 py-1 rounded-full text-white ${
              r.pct >= 75 ? "bg-[#10B981]" : r.pct >= 50 ? "bg-[#F59E0B]" : "bg-[#EF4444]"
            }`}>
              {r.pct}%
            </span>
          </button>
        ))}
      </div>

      <div className="bg-[#F8FAFC] rounded-xl p-3 mb-3 border border-[#E2E8F0]">
        <div className="text-xs font-bold text-slate-500 mb-2">Your Score Breakdown</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-xs text-slate-500">
            📝 MCQ ({isNonIT ? "70%" : "30%"}):
            <span className="font-bold text-[#1253A4] ml-1">{mcqScore}%</span>
          </div>
          {!isNonIT && (
            <div className="text-xs text-slate-500">
              💻 Code (40%):
              <span className="font-bold text-[#1253A4] ml-1">{codeScore}/100</span>
            </div>
          )}
          <div className="text-xs text-slate-500">
            🔧 Skills (20%):
            <span className="font-bold text-[#1253A4] ml-1">varies by role</span>
          </div>
          <div className="text-xs text-slate-500">
            📂 Profile (10%):
            <span className="font-bold text-[#1253A4] ml-1">{extraScore}/10</span>
          </div>
        </div>
      </div>

      {showOptions && selected && (
        <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
          <div className="text-xs font-bold text-slate-600 mb-1">
            <span style={{ color:selected.color }}>{selected.icon} {selected.role}</span>
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-white text-xs ${
              selected.pct >= 75 ? "bg-[#10B981]" : selected.pct >= 50 ? "bg-[#F59E0B]" : "bg-[#EF4444]"
            }`}>{selected.pct}% eligible</span>
          </div>
          <div className="text-xs text-slate-400 mb-3">
            {selected.pct >= 75
              ? "Great score! You qualify for job and internship opportunities."
              : selected.pct >= 50
              ? "Good score! Internship will build your real-world experience."
              : "Training will strengthen your skills for this role."}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {selected.pct < 50 && (
              <button onClick={() => onChoice(selected.role, "Training")}
                className="w-full py-2.5 bg-[#1253A4] text-white rounded-xl text-sm font-semibold hover:bg-[#0d47a1]">
                📚 Enroll in Training
              </button>
            )}
            {selected.pct >= 50 && selected.pct < 75 && (
              <>
                <button onClick={() => onChoice(selected.role, "Internship")}
                  className="w-full py-2.5 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-[#D97706]">
                  🚀 Apply for Internship
                </button>
                <button onClick={() => onChoice(selected.role, "Training")}
                  className="w-full py-2.5 border border-[#1253A4] text-[#1253A4] rounded-xl text-sm font-semibold hover:bg-[#EFF6FF]">
                  📚 Take Training Instead
                </button>
              </>
            )}
            {selected.pct >= 75 && (
              <>
                <button onClick={() => onChoice(selected.role, "Job")}
                  className="w-full py-2.5 bg-[#10B981] text-white rounded-xl text-sm font-semibold hover:bg-[#059669]">
                  ⭐ Apply for Job
                </button>
                <button onClick={() => onChoice(selected.role, "Internship")}
                  className="w-full py-2.5 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-[#D97706]">
                  🚀 Apply for Internship Instead
                </button>
              </>
            )}
          </div>
          <button onClick={() => { setShowOptions(false); setSelected(null); }}
            className="mt-2 w-full text-xs text-slate-400 hover:text-slate-600 py-1">
            ← Choose different role
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main ──
export default function SkillTest() {
  const router = useRouter();

  const [user,       setUser]       = useState(null);
  const [candidate,  setCandidate]  = useState(null);
  const [test,       setTest]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [answers,    setAnswers]    = useState({});
  const [submitted,  setSubmitted]  = useState(false);
  const [score,      setScore]      = useState(null);
  const [codeAnswer, setCodeAnswer] = useState("");
  const [codeResult, setCodeResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [phase,      setPhase]      = useState("intro");
  const [codeError,  setCodeError]  = useState("");
  const [isNonIT,    setIsNonIT]    = useState(false);
  const [tabWarning, setTabWarning] = useState(false);
  const [tabCount,   setTabCount]   = useState(0);
  const warningRef = useRef(0);

  useEffect(() => {
    const stored = localStorage.getItem("candidate_user");
    if (!stored) { router.push("/"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    supabase.from("candidates").select("*").eq("email", u.email).maybeSingle()
      .then(({ data }) => { if (data) setCandidate(data); });
  }, []);

  useEffect(() => {
    if (phase !== "mcq" && phase !== "code") return;

    const handleBlur = () => {
      warningRef.current += 1;
      setTabCount(warningRef.current);
      setTabWarning(true);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        warningRef.current += 1;
        setTabCount(warningRef.current);
        setTabWarning(true);
      }
    };
    const blockRightClick = (e) => e.preventDefault();
    const blockKeys = (e) => {
      if (
        (e.ctrlKey && (e.key === "t" || e.key === "w" || e.key === "Tab")) ||
        (e.altKey  &&  e.key === "Tab") ||
        e.key === "F12"
      ) {
        e.preventDefault();
        setTabWarning(true);
      }
    };

    window.addEventListener("blur",               handleBlur);
    document.addEventListener("visibilitychange",  handleVisibility);
    document.addEventListener("contextmenu",       blockRightClick);
    document.addEventListener("keydown",           blockKeys);

    return () => {
      window.removeEventListener("blur",               handleBlur);
      document.removeEventListener("visibilitychange",  handleVisibility);
      document.removeEventListener("contextmenu",       blockRightClick);
      document.removeEventListener("keydown",           blockKeys);
    };
  }, [phase]);

  useEffect(() => {
    if (tabCount >= 3) {
      if (phase === "mcq" && !submitted) submitMCQ();
      else if (phase === "code") evaluateCode();
    }
  }, [tabCount]);

  const generateTest = async () => {
    if (!candidate?.skills?.length) return;
    setLoading(true);
    try {
      const nonITSkills = [
        "communication","leadership","management","ms office","excel",
        "marketing","sales","customer service","accounting","public speaking",
        "team work","problem solving","time management","tally","hr management"
      ];
      const itSkills = [
        "python","java","javascript","react","django","fastapi","sql","node.js",
        "docker","aws","machine learning","html","css","git","mongodb"
      ];

      const skillsLw   = candidate.skills.map(s => s.toLowerCase());
      const itCount    = skillsLw.filter(s => itSkills.some(it => s.includes(it))).length;
      const nonItCount = skillsLw.filter(s => nonITSkills.some(n => s.includes(n))).length;

      let nonIT;
      if (candidate.field === "Non-IT") {
        nonIT = true;
      } else if (candidate.field === "IT") {
        nonIT = false;
      } else {
        nonIT = nonItCount > itCount;
      }

      console.log(`Field: ${candidate.field}, IT skills: ${itCount}, Non-IT skills: ${nonItCount}, nonIT: ${nonIT}`);

      const res = await fetch(`${BACKEND}/api/resume/generate-skill-test`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          skills:         candidate.skills,
          candidate_name: candidate.name,
          is_non_it:      nonIT,
        }),
      });
      const data = await res.json();
      if (data.success && data.test?.mcq?.length > 0) {
        setTest(data.test);
        setIsNonIT(nonIT);
        if (data.test.code_challenge) {
          setCodeAnswer(data.test.code_challenge.starter_code || "");
        }
        setPhase("mcq");
      } else {
        alert(data.error || "Could not generate questions. Please try again.");
      }
    } catch (e) {
      alert("Could not reach backend. Make sure it is running.");
      console.error(e);
    }
    setLoading(false);
  };

  const submitMCQ = () => {
    if (!test) return;
    let correct = 0;
    test.mcq.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    const pct = Math.round((correct / test.mcq.length) * 100);
    setScore({ correct, total: test.mcq.length, pct });
    setSubmitted(true);

    const hasValidCode = !isNonIT &&
      test.code_challenge &&
      test.code_challenge.description &&
      test.code_challenge.description.length > 10;

    console.log("isNonIT:", isNonIT, "code_challenge:", test.code_challenge, "hasValidCode:", hasValidCode);

    if (!hasValidCode) {
      const syntheticCodeScore = isNonIT ? pct : Math.round(pct * 0.8);
      setCodeResult({
        passed:           pct >= 60,
        score:            syntheticCodeScore,
        feedback:         pct >= 75
          ? "Excellent MCQ performance!"
          : pct >= 50
          ? "Good effort! Keep practising."
          : "Practice more to improve.",
        improvements:     ["Retake the test to get a coding challenge next time."],
        correct_approach: "",
      });
      setTimeout(() => setPhase("result"), 1500);
    } else {
      setPhase("code");
    }
  };

  const evaluateCode = async () => {
    setCodeError("");
    const starterCode = (test?.code_challenge?.starter_code || "").trim();
    const studentCode = codeAnswer.trim();

    if (!studentCode) {
      setCodeError("⚠️ Please write your solution before submitting.");
      return;
    }
    if (studentCode === starterCode) {
      setCodeError("⚠️ You haven't changed the starter code. Write your own solution first.");
      return;
    }
    const meaningfulLines = studentCode.split("\n")
      .filter(l => l.trim() && !l.trim().startsWith("#") && l.trim() !== "pass");
    if (meaningfulLines.length < 2) {
      setCodeError("⚠️ Your solution looks incomplete. Add more code to solve the problem.");
      return;
    }

    setEvaluating(true);
    try {
      const res = await fetch(`${BACKEND}/api/resume/evaluate-code`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill:        test.code_challenge.skill,
          question:     test.code_challenge.title,
          description:  test.code_challenge.description,
          code:         codeAnswer,
          language:     "python",
          starter_code: test.code_challenge.starter_code,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCodeResult(data.evaluation);
        setPhase("result");
      } else {
        setCodeError("❌ Evaluation failed. Please try again.");
      }
    } catch (e) {
      setCodeError("❌ Could not reach backend. Make sure it is running.");
      console.error(e);
    }
    setEvaluating(false);
  };

  const resetTest = () => {
    setPhase("intro"); setTest(null); setAnswers({});
    setSubmitted(false); setScore(null);
    setCodeResult(null); setCodeAnswer(""); setCodeError("");
    setIsNonIT(false); setTabWarning(false);
    setTabCount(0); warningRef.current = 0;
  };

  if (!user) return null;

  const mcqCount = !candidate?.skills?.length ? 4 :
    candidate.skills.length === 1 ? 4 :
    candidate.skills.length === 2 ? 6 :
    candidate.skills.length <= 5  ? 8 : 10;

  const overall = score && codeResult
    ? Math.round((score.pct + codeResult.score) / 2)
    : score?.pct || 0;

  return (
    <div className="min-h-screen flex bg-[#F0F4FA]">
      <CandidateSidebar user={user}/>
      <div className="ml-0 md:ml-56 flex-1 w-full min-w-0">

        <div className="bg-white border-b border-[#E2E8F0] px-4 md:px-8 py-4 sticky top-0 z-10">
          <div className="pl-12 md:pl-0">
            <div className="text-lg font-bold text-[#1E293B]">🧪 Skill Verification Test</div>
            <div className="text-xs text-slate-400">AI-generated questions · Powered by Ollama</div>
          </div>
        </div>

        {tabWarning && (phase === "mcq" || phase === "code") && (
          <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <div className="font-bold text-sm">
                  Tab switch detected! ({tabCount} warning{tabCount > 1 ? "s" : ""})
                </div>
                <div className="text-xs text-red-200">
                  {tabCount >= 3
                    ? "3 warnings reached — test is being auto-submitted now."
                    : `Stay on this page. ${3 - tabCount} warning${3 - tabCount > 1 ? "s" : ""} left before auto-submit.`}
                </div>
              </div>
            </div>
            <button onClick={() => setTabWarning(false)}
              className="text-red-200 hover:text-white text-xl font-bold px-2">
              ×
            </button>
          </div>
        )}

        <div className="p-4 md:p-8 max-w-3xl">

          {/* ── INTRO ── */}
          {phase === "intro" && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-bold text-xl text-[#1E293B] mb-2">Ready to verify your skills?</div>
              <p className="text-slate-500 text-sm mb-6">
                {candidate?.field === "Non-IT"
                  ? "AI generates scenario-based workplace questions from your soft skills. No coding required."
                  : "AI generates technical MCQ questions + a coding challenge from your skills. Powered by Ollama."}
              </p>

              {candidate?.skills?.length > 0 ? (
                <>
                  <div className="mb-5">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">
                      Skills from your profile ({candidate.skills.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map(s => (
                        <span key={s} className="text-xs bg-[#F0FDF4] text-[#10B981] border border-[#A7F3D0] px-3 py-1.5 rounded-full font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      [String(mcqCount),                                       "MCQ Questions"   ],
                      [candidate?.field === "Non-IT" ? "0" : "1",             "Coding Challenge"],
                      [candidate?.field === "Non-IT" ? "~10 min" : "~15 min", "Time Needed"     ],
                    ].map(([val, label]) => (
                      <div key={label} className="bg-[#F8FAFC] rounded-xl p-3 text-center border border-[#E2E8F0]">
                        <div className="text-lg font-bold text-[#1253A4]">{val}</div>
                        <div className="text-xs text-slate-400">{label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#F8FAFC] rounded-xl p-4 mb-5 border border-[#E2E8F0]">
                    <div className="text-xs font-bold text-slate-500 mb-2 uppercase">Instructions</div>
                    <ul className="text-xs text-slate-500 space-y-1.5">
                      <li>📝 Answer all questions before submitting</li>
                      {candidate?.field !== "Non-IT" && (
                        <li>💻 Write your own code — don't leave starter code unchanged</li>
                      )}
                      <li>🚫 Do not switch tabs or open new windows during test</li>
                      <li>⚠️ 3 tab switches = auto-submit</li>
                      <li>✅ Honest scores help us match you to the right opportunity</li>
                    </ul>
                  </div>

                  <button onClick={generateTest} disabled={loading}
                    className="w-full py-3 bg-[#10B981] text-white rounded-xl font-semibold text-sm hover:bg-[#059669] disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Generating questions with AI... (may take 30-60 seconds)</>
                      : "🚀 Start Skill Test"}
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📄</div>
                  <div className="font-semibold text-slate-600 mb-2">No skills found in your profile</div>
                  <div className="text-sm text-slate-400 mb-4">Complete your profile or upload your resume first.</div>
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => router.push("/candidate/dashboard")}
                      className="px-5 py-2.5 bg-[#10B981] text-white rounded-xl text-sm font-semibold hover:bg-[#059669]">
                      Build Profile →
                    </button>
                    <button onClick={() => router.push("/candidate/resume")}
                      className="px-5 py-2.5 bg-[#1253A4] text-white rounded-xl text-sm font-semibold hover:bg-[#0d47a1]">
                      Upload Resume →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MCQ ── */}
          {phase === "mcq" && test && (
            <div className="space-y-4">
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-sm text-[#1253A4] font-medium flex items-center justify-between">
                <span>📝 {isNonIT ? "" : "Part 1 of 2 — "}Multiple Choice ({test.mcq.length} questions)</span>
                <span className="text-xs font-normal text-[#1253A4]">
                  {Object.keys(answers).length}/{test.mcq.length} answered
                </span>
              </div>

              {test.mcq.map((q, qi) => (
                <div key={qi} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      answers[qi] ? "bg-[#10B981] text-white" : "bg-[#1253A4] text-white"
                    }`}>
                      {answers[qi] ? "✓" : qi + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-400 mb-1 font-medium">{q.skill}</div>
                      <div className="text-sm font-semibold text-[#1E293B]">{q.question}</div>
                    </div>
                  </div>
                  <div className="space-y-2 ml-10">
                    {q.options.map((opt, oi) => {
                      const letter     = opt.charAt(0);
                      const isSelected = answers[qi] === letter;
                      const isCorrect  = submitted && letter === q.answer;
                      const isWrong    = submitted && isSelected && letter !== q.answer;
                      return (
                        <button key={oi} disabled={submitted}
                          onClick={() => !submitted && setAnswers(p => ({ ...p, [qi]: letter }))}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${
                            isCorrect  ? "bg-green-50 border-green-400 text-green-700 font-semibold" :
                            isWrong    ? "bg-red-50 border-red-400 text-red-700" :
                            isSelected ? "bg-[#EFF6FF] border-[#1253A4] text-[#1253A4] font-semibold" :
                            "bg-[#F8FAFC] border-[#E2E8F0] text-slate-600 hover:border-[#1253A4]"
                          }`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {submitted && (
                    <div className="mt-3 ml-10 text-xs text-slate-500 bg-[#F8FAFC] rounded-lg p-2 border border-[#E2E8F0]">
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              ))}

              {!submitted ? (
                <div className="space-y-2">
                  {Object.keys(answers).length < test.mcq.length && (
                    <div className="text-center text-xs text-slate-400">
                      {test.mcq.length - Object.keys(answers).length} question{test.mcq.length - Object.keys(answers).length > 1 ? "s" : ""} remaining
                    </div>
                  )}
                  <button onClick={submitMCQ}
                    disabled={Object.keys(answers).length < test.mcq.length}
                    className="w-full py-3 bg-[#1253A4] text-white rounded-xl font-semibold text-sm hover:bg-[#0d47a1] disabled:opacity-50 disabled:cursor-not-allowed">
                    Submit MCQ Answers →
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {score?.correct}/{score?.total} correct ({score?.pct}%)
                  </div>
                  <div className="text-sm text-green-600 mb-3">
                    {score?.pct >= 75 ? "Excellent! 🎉" : score?.pct >= 50 ? "Good attempt!" : "Keep going! 💪"}
                  </div>
                  {!isNonIT && test.code_challenge && (
                    <button onClick={() => setPhase("code")}
                      className="px-5 py-2.5 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-[#D97706]">
                      Continue to Coding Challenge →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── CODE CHALLENGE ── */}
          {phase === "code" && test?.code_challenge && (
            <div className="space-y-4">
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-4 py-3 text-sm text-[#92400E] font-medium">
                💻 Part 2 of 2 — Coding Challenge
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-[#F0FDF4] text-[#10B981] border border-[#A7F3D0] px-2 py-1 rounded-full font-bold">
                    {test.code_challenge.skill}
                  </span>
                  <span className="font-bold text-[#1E293B] text-sm">{test.code_challenge.title}</span>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-4 mb-4 text-sm text-slate-600 border border-[#E2E8F0]">
                  {test.code_challenge.description}
                </div>

                {test.code_challenge.explanation && (
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 mb-4">
                    <div className="text-xs font-bold text-[#1253A4] mb-2 uppercase tracking-wide">
                      💡 How to Approach This
                    </div>
                    <div className="text-sm text-[#1E293B] leading-relaxed whitespace-pre-line">
                      {test.code_challenge.explanation}
                    </div>
                  </div>
                )}

                {test.code_challenge.expected_output && (
                  <div className="text-xs text-slate-400 mb-4 font-mono bg-[#F1F5F9] px-3 py-2 rounded-lg">
                    ✅ Expected: {test.code_challenge.expected_output}
                  </div>
                )}

                <div className="bg-[#FEF9C3] border border-[#FDE68A] rounded-xl px-3 py-2 mb-4 text-xs text-[#92400E]">
                  ⚠️ Write your own solution — don't submit the starter code unchanged
                </div>

                <div className="rounded-xl overflow-hidden border border-[#E2E8F0]">
                  <div className="bg-[#1E293B] px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 bg-red-500 rounded-full"/>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"/>
                      <div className="w-3 h-3 bg-green-500 rounded-full"/>
                    </div>
                    <span className="text-xs text-slate-400 font-mono ml-2">solution.py</span>
                    <span className="ml-auto text-xs text-slate-500">
                      {codeAnswer.split("\n").length} lines
                    </span>
                  </div>
                  <textarea
                    value={codeAnswer}
                    onChange={e => { setCodeAnswer(e.target.value); setCodeError(""); }}
                    rows={12}
                    spellCheck={false}
                    className="w-full bg-[#0F172A] text-green-400 font-mono text-sm p-4 outline-none resize-none"
                    placeholder="Write your solution here..."/>
                </div>

                {codeError && (
                  <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    {codeError}
                  </div>
                )}

                <button onClick={evaluateCode} disabled={evaluating}
                  className="mt-4 w-full py-3 bg-[#F59E0B] text-white rounded-xl font-semibold text-sm hover:bg-[#D97706] disabled:opacity-50 flex items-center justify-center gap-2">
                  {evaluating
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Ollama is evaluating your code...</>
                    : "🤖 Submit Code for AI Evaluation"}
                </button>
              </div>
            </div>
          )}

          {/* ── RESULT ── */}
          {phase === "result" && codeResult && (
            <div className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className={`rounded-2xl border p-5 flex flex-col items-center justify-center text-center ${
                  overall >= 75 ? "bg-green-50 border-green-200" :
                  overall >= 50 ? "bg-yellow-50 border-yellow-200" :
                  "bg-blue-50 border-blue-200"
                }`}>
                  <div className="text-4xl mb-2">
                    {overall >= 75 ? "🎉" : overall >= 50 ? "💪" : "🌱"}
                  </div>
                  <div className={`text-xl font-bold mb-1 ${
                    overall >= 75 ? "text-green-700" :
                    overall >= 50 ? "text-yellow-700" : "text-blue-700"
                  }`}>
                    {overall >= 75 ? "Outstanding!" : overall >= 50 ? "Well Done!" : "Keep Going!"}
                  </div>
                  <div className="text-4xl font-bold text-[#1253A4] mb-3">{overall}%</div>

                  <div className="w-full grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white rounded-xl p-2 text-center border border-[#E2E8F0]">
                      <div className="text-sm font-bold" style={{
                        color: score?.pct >= 75 ? "#10B981" : score?.pct >= 50 ? "#F59E0B" : "#EF4444"
                      }}>
                        {score?.correct}/{score?.total} ({score?.pct}%)
                      </div>
                      <div className="text-xs text-slate-400">MCQ Score</div>
                    </div>
                    {!isNonIT && test?.code_challenge && (
                      <div className="bg-white rounded-xl p-2 text-center border border-[#E2E8F0]">
                        <div className="text-sm font-bold" style={{
                          color: codeResult.score >= 70 ? "#10B981" : codeResult.score >= 50 ? "#F59E0B" : "#EF4444"
                        }}>
                          {codeResult.score}/100
                        </div>
                        <div className="text-xs text-slate-400">Code Score</div>
                      </div>
                    )}
                    <div className="bg-white rounded-xl p-2 text-center border border-[#E2E8F0]">
                      <div className="text-sm font-bold text-[#1253A4]">{overall}%</div>
                      <div className="text-xs text-slate-400">Overall</div>
                    </div>
                    <div className="bg-white rounded-xl p-2 text-center border border-[#E2E8F0]">
                      <div className={`text-sm font-bold ${
                        overall >= 75 ? "text-green-600" :
                        overall >= 50 ? "text-yellow-600" : "text-red-500"
                      }`}>
                        {overall >= 75 ? "PASS ✅" : overall >= 50 ? "GOOD 👍" : "RETRY 🔄"}
                      </div>
                      <div className="text-xs text-slate-400">Result</div>
                    </div>
                  </div>

                  <div className={`w-full text-xs font-medium p-2 rounded-xl ${
                    overall >= 75 ? "bg-green-100 text-green-700" :
                    overall >= 50 ? "bg-yellow-100 text-yellow-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {overall >= 75
                      ? "⭐ You qualify for job opportunities! HR will connect with you."
                      : overall >= 50
                      ? "🚀 You qualify for internship opportunities. Keep building!"
                      : "🌱 Our training programs will help you level up. You've got this!"}
                  </div>
                </div>

                {/* ── UPDATED onChoice handler ── */}
                <JobSuggestions
                  skills={candidate?.skills || []}
                  mcqScore={score?.pct || 0}
                  codeScore={codeResult?.score || 0}
                  isNonIT={isNonIT}
                  candidate={candidate}
                  onChoice={(job, choice) => {
                    fetch(`${BACKEND}/api/whatsapp/trigger`, {
                      method:  "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        candidate_id:  candidate?.id,
                        job_choice:    job,
                        career_choice: choice,
                        score:         overall,
                      }),
                    })
                      .then(r => r.json())
                      .then(data => {
                        if (data.success) {
                          alert(`✅ Noted! You chose "${choice}" for ${job}. We've sent you a WhatsApp confirmation!`);
                        } else if (data.error === "sandbox_not_joined") {
                          alert(`✅ Choice noted: "${choice}" for ${job}.\n\n⚠️ WhatsApp: Please send "join twilio-trial" to +14155238886 on WhatsApp to receive your confirmation message.`);
                        } else {
                          alert(`✅ Choice noted: "${choice}" for ${job}. Our team will contact you shortly.`);
                        }
                      })
                      .catch(() => {
                        alert(`✅ Choice noted: "${choice}" for ${job}. Our team will contact you on WhatsApp soon.`);
                      });
                    localStorage.setItem("job_choice", JSON.stringify({ job, choice, score: overall }));
                  }}
                />
              </div>

              {codeResult.improvements?.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                  <div className="font-bold text-[#1E293B] mb-3">💡 How to Improve</div>
                  <div className="space-y-2">
                    {codeResult.improvements.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-600 p-2 bg-[#F8FAFC] rounded-lg">
                        <span className="text-[#F59E0B] font-bold flex-shrink-0">{i+1}.</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {codeResult.correct_approach && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                  <div className="font-bold text-[#1E293B] mb-2">✅ Ideal Solution</div>
                  <div className="bg-[#0F172A] rounded-xl p-4 font-mono text-sm text-green-400 overflow-x-auto">
                    {codeResult.correct_approach}
                  </div>
                </div>
              )}

              {test?.mcq && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                  <div className="font-bold text-[#1E293B] mb-4">📋 Question-wise Review</div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {test.mcq.map((q, i) => (
                      <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                        answers[i] === q.answer
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          answers[i] === q.answer ? "bg-green-500 text-white" : "bg-red-400 text-white"
                        }`}>
                          {answers[i] === q.answer ? "✓" : "✗"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-[#1E293B] truncate">{q.question}</div>
                          <div className="text-xs text-slate-400">
                            Your: <span className="font-bold">{answers[i] || "—"}</span>
                            {" · "}Correct: <span className="font-bold text-green-600">{q.answer}</span>
                          </div>
                        </div>
                        <span className="text-xs bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-full text-slate-400 flex-shrink-0">
                          {q.skill}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={resetTest}
                  className="flex-1 py-2.5 bg-[#1253A4] text-white rounded-xl text-sm font-semibold hover:bg-[#0d47a1]">
                  🔄 Retake Test
                </button>
                <button onClick={() => router.push("/candidate/dashboard")}
                  className="flex-1 py-2.5 bg-[#10B981] text-white rounded-xl text-sm font-semibold hover:bg-[#059669]">
                  Back to Dashboard →
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}