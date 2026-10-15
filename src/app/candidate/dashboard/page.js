"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import { JOBS } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import { Bell, ArrowRight, Check, User, BookOpen, Briefcase, ChevronRight } from "lucide-react";

// ── IT vs Non-IT skill suggestions ──
const IT_SKILLS     = ["Python","JavaScript","React","Django","FastAPI","SQL","Machine Learning","Java","C++","Node.js","Docker","AWS","MongoDB","HTML","CSS","Git","Data Analysis","Power BI"];
const NON_IT_SKILLS = ["Communication","Leadership","MS Office","Excel","Management","Marketing","Sales","Customer Service","Accounting","Public Speaking","Team Work","Problem Solving","Time Management","Tally","HR Management"];

// ── Profile completeness check ──
function isProfileComplete(candidate) {
  return candidate &&
    candidate.name &&
    candidate.phone &&
    candidate.education &&
    candidate.education !== "Unknown" &&
    candidate.skills?.length > 0 &&
    candidate.field; // IT or Non-IT
}

export default function CandidateDashboard() {
  const router = useRouter();
  const [user,      setUser]      = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading,   setLoading]   = useState(true);

  // Profile builder state
  const [step,       setStep]       = useState(0); // 0=field 1=personal 2=education 3=skills
  const [field,      setField]      = useState(""); // "IT" or "Non-IT"
  const [form,       setForm]       = useState({ name:"", phone:"", location:"", age:"", education:"", experience:"" });
  const [skills,     setSkills]     = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("candidate_user");
    if (!stored) { router.push("/"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    supabase.from("candidates").select("*").eq("email", u.email).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCandidate(data);
          // Pre-fill form if partial data exists
          setForm({
            name:       data.name       || u.name  || "",
            phone:      data.phone      || "",
            location:   data.location   || "",
            age:        data.age?.toString() || "",
            education:  data.education  || "",
            experience: data.experience_years?.toString() || "",
          });
          setSkills(data.skills || []);
          setField(data.field   || "");
        }
        setLoading(false);
      });
  }, []);

  const addSkill = (sk) => {
    const s = sk.trim();
    if (s && !skills.includes(s)) setSkills(p => [...p, s]);
    setSkillInput("");
  };

  const removeSkill = (sk) => setSkills(p => p.filter(x => x !== sk));

  const saveProfile = async () => {
  if (!user || skills.length === 0) return;
  setSaving(true);

  // Auto-detect field from skills if not explicitly chosen
  const nonITKeywords = ["communication","leadership","management","ms office","excel","marketing","sales","customer service","accounting","public speaking","team work","problem solving","time management"];
  const itKeywords    = ["python","java","javascript","react","django","sql","node.js","docker","aws","machine learning","html","css"];

  const skillsLw  = skills.map(s => s.toLowerCase());
  const itCount   = skillsLw.filter(s => itKeywords.some(k => s.includes(k))).length;
  const nonItCount = skillsLw.filter(s => nonITKeywords.some(k => s.includes(k))).length;

  // Only override if field not explicitly set yet
  const detectedField = field || (nonItCount > itCount ? "Non-IT" : "IT");

  const { data } = await supabase.from("candidates")
    .update({
      name:             form.name,
      phone:            form.phone,
      location:         form.location,
      age:              form.age ? parseInt(form.age) : null,
      education:        form.education,
      experience_years: form.experience ? parseInt(form.experience) : 0,
      skills,
      field:            detectedField,
      status:           "Reviewing",
    })
    .eq("email", user.email)
    .select()
    .maybeSingle();

  if (data) {
    setCandidate(data);
    setSaved(true);
    setTimeout(() => router.push("/candidate/skill-test"), 1500);
  }
  setSaving(false);
};
  if (loading) return (
    <div className="min-h-screen flex bg-[#F0F4FA]">
      <div className="w-56 bg-[#0B1D3A] min-h-screen hidden md:block flex-shrink-0"/>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"/>
      </div>
    </div>
  );

  const score          = candidate?.ai_score || 0;
  const profileDone    = isProfileComplete(candidate);
  const suggestedSkills = field === "IT" ? IT_SKILLS : field === "Non-IT" ? NON_IT_SKILLS : [];

  // ── STEPS CONFIG ──
  const STEPS = ["Choose Field", "Personal Info", "Education", "Skills"];

  // ════════════════════════════════════════════
  // PROFILE BUILDER VIEW (if profile incomplete)
  // ════════════════════════════════════════════
  if (!profileDone) {
    return (
      <div className="min-h-screen flex bg-[#F0F4FA]">
        <CandidateSidebar user={user}/>
        <div className="ml-0 md:ml-56 flex-1 w-full min-w-0">

          {/* Topbar */}
          <div className="bg-white border-b border-[#E2E8F0] px-4 md:px-8 py-4 sticky top-0 z-10">
            <div className="pl-12 md:pl-0">
              <div className="text-lg font-bold text-[#1E293B]">👋 Welcome, {user?.name?.split(" ")[0]}!</div>
              <div className="text-xs text-slate-400">Complete your profile to get started — takes less than 2 minutes</div>
            </div>
          </div>

          <div className="p-4 md:p-8 max-w-2xl">

            {/* Progress Steps */}
            <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
              {STEPS.map((st, i) => (
                <div key={i} className="flex items-center gap-1 flex-shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    i < step  ? "bg-green-100 text-green-700" :
                    i === step ? "bg-[#1253A4] text-white" :
                    "bg-white border border-[#E2E8F0] text-slate-400"
                  }`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                      i < step  ? "bg-green-500 text-white" :
                      i === step ? "bg-white text-[#1253A4]" :
                      "bg-[#E2E8F0] text-slate-400"
                    }`}>
                      {i < step ? <Check size={9}/> : i+1}
                    </div>
                    {st}
                  </div>
                  {i < STEPS.length-1 && <ChevronRight size={12} className="text-slate-300 flex-shrink-0"/>}
                </div>
              ))}
            </div>

            {/* ── STEP 0: Choose Field ── */}
            {step === 0 && (
  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
    <div className="text-lg font-bold text-[#1E293B] mb-1">Which field are you from?</div>
    <div className="text-sm text-slate-400 mb-6">This helps us personalise your resume and skill test</div>

    <div className="grid grid-cols-2 gap-4 mb-6">
      {[
        { label:"IT / Tech",         value:"IT",     emoji:"💻", desc:"Software, Data, AI, Web, Cloud",          color:"blue"  },
        { label:"Non-IT / Business", value:"Non-IT", emoji:"🏢", desc:"Management, Marketing, Finance, HR, Sales", color:"green" },
      ].map(opt => (
        <button key={opt.value}
          onClick={() => setField(opt.value)}
          className={`p-5 rounded-2xl border-2 text-left transition-all ${
            field === opt.value
              ? opt.color === "blue"
                ? "border-[#1253A4] bg-[#EFF6FF]"
                : "border-[#10B981] bg-[#F0FDF4]"
              : "border-[#E2E8F0] hover:border-slate-300"
          }`}>
          <div className="text-2xl mb-2">{opt.emoji}</div>
          <div className={`font-bold mb-1 ${
            field === opt.value
              ? opt.color === "blue" ? "text-[#1253A4]" : "text-[#10B981]"
              : "text-[#1E293B]"
          }`}>{opt.label}</div>
          <div className="text-xs text-slate-400">{opt.desc}</div>
        </button>
      ))}
    </div>

    {/* After field chosen — show Build or Upload */}
    {field && (
      <div>
        <div className="text-sm font-semibold text-slate-600 mb-3 text-center">
          How do you want to add your details?
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              // Save field first, then redirect to resume builder
              supabase.from("candidates")
                .update({ field })
                .eq("email", user.email)
                .then(() => router.push("/candidate/resume-builder"));
            }}
            className="p-4 bg-[#1253A4] text-white rounded-2xl text-center hover:bg-[#0d47a1] transition-all">
            <div className="text-2xl mb-1">📝</div>
            <div className="font-bold text-sm">Build Resume</div>
            <div className="text-xs text-blue-200 mt-0.5">Fill details step by step</div>
          </button>

          <button
            onClick={() => setStep(1)}
            className="p-4 bg-[#10B981] text-white rounded-2xl text-center hover:bg-[#059669] transition-all">
            <div className="text-2xl mb-1">⬆️</div>
            <div className="font-bold text-sm">Upload Resume</div>
            <div className="text-xs text-green-200 mt-0.5">Extract skills automatically</div>
          </button>
        </div>
      </div>
    )}
  </div>
)}

            {/* ── STEP 1: Personal Info ── */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-[#EFF6FF] rounded-xl flex items-center justify-center">
                    <User size={16} className="text-[#1253A4]"/>
                  </div>
                  <div>
                    <div className="font-bold text-[#1E293B]">Personal Information</div>
                    <div className="text-xs text-slate-400">Name and phone are mandatory</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label:"Full Name *",   key:"name",       type:"text",   ph:"e.g. Muthukrishnan S",    req:true  },
                    { label:"Phone *",        key:"phone",      type:"tel",    ph:"+91 9876543210",           req:true  },
                    { label:"Location",       key:"location",   type:"text",   ph:"Chennai, Tamil Nadu",      req:false },
                    { label:"Age",            key:"age",        type:"number", ph:"e.g. 22",                  req:false },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{f.label}</label>
                      <input type={f.type} value={form[f.key]} placeholder={f.ph}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none bg-[#F8FAFC] transition-all focus:bg-white ${
                          f.req ? "border-[#1253A4]/30 focus:border-[#1253A4]" : "border-[#E2E8F0] focus:border-[#10B981]"
                        }`}/>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={() => setStep(0)}
                    className="px-4 py-2.5 border border-[#E2E8F0] text-slate-500 rounded-xl text-sm font-semibold hover:bg-[#F1F5F9]">
                    ← Back
                  </button>
                  <button
                    disabled={!form.name || !form.phone}
                    onClick={() => setStep(2)}
                    className="flex-1 py-2.5 bg-[#1253A4] text-white rounded-xl text-sm font-semibold hover:bg-[#0d47a1] disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Education ── */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-[#F0FDF4] rounded-xl flex items-center justify-center">
                    <BookOpen size={16} className="text-[#10B981]"/>
                  </div>
                  <div>
                    <div className="font-bold text-[#1E293B]">Education & Experience</div>
                    <div className="text-xs text-slate-400">Highest qualification is mandatory</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Highest Qualification *</label>
                    <select value={form.education}
                      onChange={e => setForm(p => ({ ...p, education: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#1253A4]/30 rounded-xl text-sm outline-none bg-[#F8FAFC] focus:border-[#1253A4] focus:bg-white">
                      <option value="">Select your qualification</option>
                      {["SSLC / 10th","HSC / 12th","Diploma","B.E","B.Tech","B.Sc","B.Com","B.A","BCA","M.Tech","M.Sc","MBA","MCA","PhD","Other"].map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Experience (years)</label>
                    <select value={form.experience}
                      onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm outline-none bg-[#F8FAFC] focus:border-[#10B981] focus:bg-white">
                      <option value="0">Fresher (0 years)</option>
                      {["1","2","3","4","5","6","7","8","9","10+"].map(y => (
                        <option key={y} value={y}>{y} year{y !== "1" ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={() => setStep(1)}
                    className="px-4 py-2.5 border border-[#E2E8F0] text-slate-500 rounded-xl text-sm font-semibold hover:bg-[#F1F5F9]">
                    ← Back
                  </button>
                  <button
                    disabled={!form.education}
                    onClick={() => setStep(3)}
                    className="flex-1 py-2.5 bg-[#1253A4] text-white rounded-xl text-sm font-semibold hover:bg-[#0d47a1] disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Skills ── */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#FFF7ED] rounded-xl flex items-center justify-center">
                    <Briefcase size={16} className="text-[#F59E0B]"/>
                  </div>
                  <div>
                    <div className="font-bold text-[#1E293B]">Your Skills *</div>
                    <div className="text-xs text-slate-400">Add at least 3 skills — mandatory to proceed</div>
                  </div>
                </div>

                {/* Suggested skills */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                    {field} Suggested Skills — tap to add
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {suggestedSkills.filter(s => !skills.includes(s)).map(s => (
                      <button key={s} onClick={() => addSkill(s)}
                        className="text-xs px-3 py-1.5 bg-[#F1F5F9] text-slate-600 rounded-full hover:bg-[#1253A4] hover:text-white transition-all font-medium">
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom skill input */}
                <div className="flex gap-2 mb-4">
                  <input value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addSkill(skillInput)}
                    placeholder="Type any skill and press Enter"
                    className="flex-1 px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#1253A4] bg-[#F8FAFC]"/>
                  <button onClick={() => addSkill(skillInput)}
                    className="px-4 py-2.5 bg-[#1253A4] text-white rounded-xl text-sm font-semibold hover:bg-[#0d47a1]">
                    Add
                  </button>
                </div>

                {/* Added skills */}
                {skills.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                      Your Skills ({skills.length} added)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map(s => (
                        <div key={s} className="flex items-center gap-1 bg-[#F0FDF4] text-[#10B981] border border-[#A7F3D0] px-3 py-1.5 rounded-full text-xs font-medium">
                          {s}
                          <button onClick={() => removeSkill(s)} className="ml-1 text-[#10B981] hover:text-red-500 font-bold">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save and go to test */}
                {saved ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                    <div className="text-green-700 font-bold mb-1">✅ Profile Saved!</div>
                    <div className="text-sm text-green-600">Taking you to your Skill Test...</div>
                    <div className="mt-2 w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"/>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)}
                      className="px-4 py-2.5 border border-[#E2E8F0] text-slate-500 rounded-xl text-sm font-semibold hover:bg-[#F1F5F9]">
                      ← Back
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={skills.length < 3 || saving}
                      className="flex-1 py-3 bg-[#10B981] text-white rounded-xl text-sm font-bold hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {saving
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</>
                        : "✅ Save Profile & Start Skill Test →"}
                    </button>
                  </div>
                )}

                {skills.length < 3 && (
                  <div className="mt-2 text-xs text-center text-slate-400">
                    Add {3 - skills.length} more skill{3 - skills.length > 1 ? "s" : ""} to continue
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // NORMAL DASHBOARD (if profile complete)
  // ════════════════════════════════════════════
  const scoreBreakdown = [
    { label:"Skills Match", val: Math.round(score*0.4), max:40, color:"#0EA5C9" },
    { label:"Experience",   val: Math.round(score*0.3), max:30, color:"#1253A4" },
    { label:"Education",    val: Math.round(score*0.2), max:20, color:"#8B5CF6" },
    { label:"Extras",       val: Math.round(score*0.1), max:10, color:"#10B981" },
  ];

  const suggestions = candidate.ai_suggestions?.length > 0
    ? candidate.ai_suggestions.slice(0, 4)
    : ["Upload your resume to get personalized AI suggestions.", "Once uploaded, tips will be tailored to your actual skills."];

  return (
    <div className="min-h-screen flex bg-[#F0F4FA]">
      <CandidateSidebar user={user}/>
      <div className="ml-0 md:ml-56 flex-1 w-full min-w-0">

        <div className="bg-white border-b border-[#E2E8F0] px-4 md:px-8 py-3 md:py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 pl-12 md:pl-0">
              <div className="text-base md:text-lg font-bold text-[#1E293B]">My Dashboard</div>
              <div className="text-xs text-slate-400 truncate">Welcome back, {user.name}!</div>
            </div>
            <button className="relative p-2 bg-[#F1F5F9] rounded-xl">
              <Bell size={16} className="text-slate-500"/>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"/>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8">

          {/* Profile summary bar */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 mb-6 flex flex-wrap items-center gap-4">
            <div className="w-12 h-12 bg-[#10B981] rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {candidate.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[#1E293B]">{candidate.name}</div>
              <div className="text-xs text-slate-400">{candidate.email} · {candidate.field || "IT"} · {candidate.location || "—"}</div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <span className="text-xs bg-[#F0FDF4] text-[#10B981] border border-[#A7F3D0] px-3 py-1.5 rounded-full font-semibold">
                ✅ Profile Complete
              </span>
              <button onClick={() => router.push("/candidate/skill-test")}
                className="text-xs bg-[#F59E0B] text-white px-3 py-1.5 rounded-full font-semibold hover:bg-[#D97706]">
                🧪 Take Skill Test
              </button>
            </div>
          </div>

          {/* Desktop Score + Stats */}
          <div className="hidden md:grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <div className="text-sm font-bold text-slate-500 mb-4">Your AI Score</div>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="10"/>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#10B981" strokeWidth="10"
                      strokeDasharray={`${(score/100)*314} 314`} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-[#1E293B]">{score}</div>
                    <div className="text-xs text-slate-400">/ 100</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {scoreBreakdown.map((s,i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-500">{s.label}</span>
                      <span className="font-bold" style={{ color:s.color }}>{s.val}/{s.max}</span>
                    </div>
                    <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${(s.val/s.max)*100}%`, background:s.color }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-4">
              {[
                { label:"JD Match",    val:(candidate.jd_match||0)+"%",           color:"#0EA5C9", icon:"🎯" },
                { label:"Skills Found",val:(candidate.skills?.length||0)+" skills",color:"#10B981", icon:"🔧" },
                { label:"Education",   val:candidate.education||"—",               color:"#8B5CF6", icon:"🎓" },
                { label:"Active Jobs", val:JOBS.filter(j=>j.status==="Active").length,color:"#1253A4",icon:"💼" },
              ].map((s,i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-xl font-bold mb-1 truncate" style={{ color:s.color }}>{s.val}</div>
                  <div className="text-xs text-slate-400">{s.label}</div>
                </div>
              ))}
              <div className="col-span-2 bg-white rounded-2xl border border-[#E2E8F0] p-5">
                <div className="text-sm font-bold text-slate-600 mb-3">Quick Actions</div>
                <div className="flex gap-3">
                  {[
                    { label:"Skill Test",     href:"/candidate/skill-test",     color:"#F59E0B" },
                    { label:"Update Resume",  href:"/candidate/resume",         color:"#10B981" },
                    { label:"Resume Builder", href:"/candidate/resume-builder", color:"#1253A4" },
                  ].map((a,i) => (
                    <button key={i} onClick={() => router.push(a.href)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                      style={{ background:a.color }}>
                      {a.label} <ArrowRight size={14}/>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Suggestions + Jobs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-6">
              <div className="font-bold text-[#1E293B] mb-1 text-sm md:text-base">🤖 AI Resume Suggestions</div>
              <div className="text-xs text-slate-400 mb-4">
                {candidate.ai_suggestions?.length > 0 ? "Personalized tips based on your resume" : "Upload your resume to get personalized tips"}
              </div>
              <div className="space-y-3">
                {suggestions.map((s,i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#F8FAFF] rounded-xl border border-[#E2E8F0]">
                    <div className="w-5 h-5 bg-[#EFF6FF] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#1253A4] mt-0.5">{i+1}</div>
                    <div className="text-xs md:text-sm text-slate-600">{s}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push("/candidate/resume")}
                className="mt-4 w-full py-2.5 bg-[#10B981] text-white rounded-xl text-sm font-semibold hover:bg-[#059669] transition-all">
                {candidate.ai_suggestions?.length > 0 ? "Update Resume →" : "Upload Resume →"}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-6">
              <div className="font-bold text-[#1E293B] mb-4 text-sm md:text-base">💼 Latest Job Openings</div>
              <div className="space-y-3">
                {JOBS.slice(0,4).map((job,i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <div className="w-8 h-8 bg-[#EFF6FF] rounded-xl flex items-center justify-center flex-shrink-0 text-sm">💼</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#1E293B] truncate">{job.title}</div>
                      <div className="text-xs text-slate-400 truncate">{job.dept} · {job.posted}</div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold flex-shrink-0">{job.status}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push("/candidate/jobs")}
                className="mt-4 w-full py-2.5 bg-[#1253A4] text-white rounded-xl text-sm font-semibold hover:bg-[#0d47a1] transition-all">
                View All Jobs →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}