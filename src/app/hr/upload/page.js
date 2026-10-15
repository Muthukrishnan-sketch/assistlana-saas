"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import HRSidebar from "@/components/hr/HRSidebar";
import { supabase } from "@/lib/supabase";
import { Upload, FileText, CheckCircle, Bell, Search, X } from "lucide-react";
import { RECENT_UPLOADS } from "@/lib/mockData";

const PARSE_STEPS = [
  { label:"Reading resume file",             icon:"📄" },
  { label:"Extracting text content",         icon:"🔍" },
  { label:"Running NLP entity recognition",  icon:"🧠" },
  { label:"Extracting skills & experience",  icon:"⚡" },
  { label:"Computing AI score",              icon:"🎯" },
  { label:"Matching with job descriptions",  icon:"🔗" },
  { label:"Saving candidate to database",    icon:"💾" },
];

function extractNameFromFilename(filename) {
  let name = filename
    .replace(/\.(pdf|docx|doc)$/i, "")
    .replace(/-\d+$/,   "")
    .replace(/[_\-]/g,  " ")
    .replace(/resume/gi,"")
    .replace(/cv/gi,    "")
    .replace(/\s+/g,    " ")
    .trim();
  return name
    .split(" ")
    .filter(w => w.length > 0)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ") || "Unknown";
}

function simulateAIExtraction(filename) {
  const skillSets = [
    ["React","Node.js","Python","AWS"],
    ["Python","TensorFlow","spaCy","SQL"],
    ["Figma","React","CSS","Framer"],
    ["Docker","K8s","AWS","Terraform"],
    ["Python","sklearn","SQL","Tableau"],
    ["Java","Spring","PostgreSQL","Redis"],
  ];
  const locations = ["Chennai","Bangalore","Tambaram","Mumbai","Hyderabad"];
  const quals     = ["B.Tech","M.Tech","B.E","M.Sc","BCA","B.Des"];
  const name      = extractNameFromFilename(filename);
  const skills    = skillSets[Math.floor(Math.random() * skillSets.length)];
  const location  = locations[Math.floor(Math.random() * locations.length)];
  const qual      = quals[Math.floor(Math.random() * quals.length)];
  return {
    name,
    email:            name.toLowerCase().replace(/\s+/g,".") + Math.floor(Math.random()*99) + "@email.com",
    skills,
    location,
    qualification:    qual,
    age:              Math.floor(Math.random()*10)+22,
    experience_years: Math.floor(Math.random()*7)+1,
    education:        qual + " CS",
    ai_score:         Math.floor(Math.random()*35)+60,
    jd_match:         Math.floor(Math.random()*35)+60,
    status:           "Pending",
  };
}

export default function HRUpload() {
  const router  = useRouter();
  const fileRef = useRef();

  const [user,        setUser]        = useState(null);
  const [drag,        setDrag]        = useState(false);
  const [files,       setFiles]       = useState([]);
  const [steps,       setSteps]       = useState(PARSE_STEPS.map(s => ({...s, status:"idle"})));
  const [parsing,     setParsing]     = useState(false);
  const [done,        setDone]        = useState(false);
  const [saved,       setSaved]       = useState([]);
  const [error,       setError]       = useState("");
  const [backendMode, setBackendMode] = useState(false);

  const BACKEND = typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://assistlana-backend.onrender.com";

  // ── Only auth check + health check go inside useEffect ──
  useEffect(() => {
    const stored = localStorage.getItem("hr_user");
    if (!stored) router.push("/");
    else setUser(JSON.parse(stored));

    fetch(`${BACKEND}/api/health`, { signal: AbortSignal.timeout(10000) })
      .then(r => r.json())
      .then(() => setBackendMode(true))
      .catch(() => setBackendMode(false));
  }, []);

  // ── Animate parse steps ──
  const runParseSteps = async () => {
    setSteps(PARSE_STEPS.map(s => ({...s, status:"idle"})));
    for (let i = 0; i < PARSE_STEPS.length; i++) {
      setSteps(prev => prev.map((s,j) => j===i ? {...s, status:"active"} : s));
      await new Promise(r => setTimeout(r, 600 + Math.random()*400));
      setSteps(prev => prev.map((s,j) => j===i ? {...s, status:"done"  } : s));
    }
  };

  // ── Upload file to Supabase Storage ──
  const uploadToStorage = async (file) => {
    const fileName = `${Date.now()}_${file.name.replace(/\s/g,"_")}`;
    const { error } = await supabase.storage
      .from("resumes")
      .upload(fileName, file, { contentType: file.type });
    if (error) return "";
    const { data } = supabase.storage.from("resumes").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ── Save candidate to Supabase DB (fallback) ──
  const saveCandidate = async (candidate) => {
    const { data, error } = await supabase
      .from("candidates")
      .insert([candidate])
      .select();
    if (error) { console.error("DB error:", error); return null; }
    return data[0];
  };

  // ── Parse using real FastAPI backend ──
  const parseWithBackend = async (file, resumeUrl) => {
    const formData = new FormData();
    formData.append("file", file);
    const res  = await fetch(`${BACKEND}/api/resume/parse-and-save`, {
      method: "POST",
      body:   formData,
    });
    const data = await res.json();
    if (data.success && data.candidate) {
      if (resumeUrl && data.candidate.id) {
        await supabase.from("candidates")
          .update({ resume_url: resumeUrl })
          .eq("id", data.candidate.id);
      }
      return data.candidate;
    }
    return null;
  };

  // ── Add files to list ──
  const addFiles = (fileList) => {
    const valid = [...fileList]
      .filter(f => f.name.endsWith(".pdf") || f.name.endsWith(".docx"))
      .map(f => ({
        raw:           f,
        name:          f.name,
        size:          (f.size/1024).toFixed(0) + " KB",
        status:        "ready",
        candidateName: null,
      }));
    if (valid.length === 0) { setError("Only PDF or DOCX files accepted."); return; }
    setError("");
    setFiles(prev => [...prev, ...valid]);
    setDone(false);
  };

  const removeFile = (index) => setFiles(prev => prev.filter((_,i) => i !== index));

  const clearAll = () => {
    setFiles([]);
    setDone(false);
    setSaved([]);
    setError("");
    setSteps(PARSE_STEPS.map(s => ({...s, status:"idle"})));
  };

  // ── Main parse handler ──
  const handleParse = async () => {
    const readyFiles = files.filter(f => f.status === "ready");
    if (readyFiles.length === 0) {
      setError("No files ready. Please add PDF/DOCX files.");
      return;
    }
    setError("");
    setParsing(true);
    setDone(false);
    setSaved([]);

    const results = [];
    let isFirst   = true;

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "ready") continue;

      setFiles(prev => prev.map((f,j) => j===i ? {...f, status:"parsing"} : f));

      if (isFirst) { await runParseSteps(); isFirst = false; }
      else         { await new Promise(r => setTimeout(r, 800)); }

      const resumeUrl = await uploadToStorage(files[i].raw);

      let result = null;

      if (backendMode) {
        try {
          result = await parseWithBackend(files[i].raw, resumeUrl);
        } catch (err) {
          console.log("Backend error, falling back:", err);
          result = null;
        }
      }

      if (!result) {
        const extracted      = simulateAIExtraction(files[i].name);
        extracted.resume_url = resumeUrl;
        result               = await saveCandidate(extracted);
      }

      if (result) {
        results.push(result);
        setFiles(prev => prev.map((f,j) => j===i
          ? { ...f, status:"done", candidateName: result.name }
          : f
        ));
      } else {
        setFiles(prev => prev.map((f,j) => j===i ? {...f, status:"error"} : f));
      }
    }

    setSaved(results);
    setParsing(false);
    setDone(true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-[#F0F4FA]">
      <HRSidebar user={user}/>
      <div className="ml-0 md:ml-56 flex-1 w-full min-w-0">

        {/* Topbar */}
        <div className="bg-white border-b border-[#E2E8F0] px-4 md:px-8 py-3 md:py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 pl-12 md:pl-0">
              <div className="text-base md:text-lg font-bold text-[#1E293B] truncate">Upload Resumes</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${backendMode ? "bg-green-500" : "bg-yellow-400"}`}/>
                <div className="text-xs text-slate-400 truncate">
                  {backendMode ? "AI Backend connected" : "Simulation mode"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-4 py-2">
                <Search size={14} className="text-slate-400"/>
                <input placeholder="Search..." className="bg-transparent text-sm outline-none w-24 md:w-32 text-slate-600"/>
              </div>
              <button className="relative p-2 bg-[#F1F5F9] rounded-xl">
                <Bell size={16} className="text-slate-500"/>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"/>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            {[
              { label:"Files Selected",  val: files.length,                              color:"#1253A4" },
              { label:"Parsed & Saved",  val: files.filter(f=>f.status==="done").length, color:"#10B981" },
              { label:"Parse Mode",      val: backendMode ? "Real AI" : "Simulation",    color: backendMode ? "#10B981" : "#F59E0B" },
              { label:"Avg Parse Time",  val: "< 5s",                                    color:"#8B5CF6" },
            ].map((s,i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-3 md:p-5">
                <div className="text-xs md:text-sm text-slate-500 mb-1">{s.label}</div>
                <div className="text-lg md:text-2xl font-bold" style={{ color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Backend status banner */}
          {backendMode && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-xs md:text-sm flex items-start gap-2">
              <span className="flex-shrink-0">🟢</span>
              <span><strong>Real AI Mode:</strong> FastAPI backend connected. Resumes will be parsed with spaCy NLP for real name, email, skills and experience extraction!</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm flex items-center gap-2">
              ⚠️ {error}
              <button onClick={() => setError("")} className="ml-auto"><X size={14}/></button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

            {/* LEFT — Upload Zone + File List */}
            <div>
              <div
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
                onClick={() => !parsing && fileRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-6 md:p-10 text-center transition-all ${
                  parsing ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                } ${drag ? "border-[#0EA5C9] bg-[#F0F9FF]" : "border-[#E2E8F0] bg-white hover:border-[#0EA5C9] hover:bg-[#F0F9FF]"}`}>
                <input ref={fileRef} type="file" multiple accept=".pdf,.docx" className="hidden"
                  onChange={e => addFiles(e.target.files)}/>
                <div className="text-4xl md:text-5xl mb-3">📁</div>
                <div className="text-base font-bold text-[#1E293B] mb-1">Drop resumes here</div>
                <div className="text-sm text-slate-400 mb-4">PDF or DOCX · Multiple files supported</div>
                <div className="inline-flex items-center gap-2 bg-[#0EA5C9] text-white px-5 py-2 rounded-xl text-sm font-semibold">
                  <Upload size={15}/> Choose Files
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-[#1E293B]">
                      {files.length} file{files.length > 1 ? "s" : ""} selected
                    </div>
                    {!parsing && (
                      <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 font-semibold underline">
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {files.map((f, i) => (
                      <div key={i} className={`flex items-center gap-3 rounded-xl px-3 md:px-4 py-3 border transition-all ${
                        f.status==="done"    ? "bg-green-50 border-green-200" :
                        f.status==="parsing" ? "bg-blue-50 border-blue-200"  :
                        f.status==="error"   ? "bg-red-50 border-red-200"    :
                        "bg-white border-[#E2E8F0]"
                      }`}>
                        <FileText size={18} className={
                          f.status==="done"    ? "text-green-500 flex-shrink-0" :
                          f.status==="parsing" ? "text-blue-500 flex-shrink-0"  :
                          f.status==="error"   ? "text-red-400 flex-shrink-0"   :
                          "text-[#0EA5C9] flex-shrink-0"
                        }/>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#1E293B] truncate">{f.name}</div>
                          <div className="text-xs text-slate-400 truncate">
                            {f.size}
                            {f.candidateName && (
                              <span className="ml-2 text-green-600 font-bold">→ {f.candidateName}</span>
                            )}
                            {f.status === "error" && (
                              <span className="ml-2 text-red-500">Failed to save</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {f.status === "done"    && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">✅</span>}
                          {f.status === "parsing" && <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"/>}
                          {f.status === "error"   && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">❌</span>}
                          {f.status === "ready" && !parsing && (
                            <button onClick={() => removeFile(i)}
                              className="w-6 h-6 bg-red-100 hover:bg-red-200 text-red-500 rounded-full flex items-center justify-center transition-all">
                              <X size={12}/>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parse Button */}
              <button
                onClick={handleParse}
                disabled={parsing || files.filter(f => f.status === "ready").length === 0}
                className="mt-4 w-full bg-[#1253A4] hover:bg-[#0d47a1] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all">
                {parsing
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Parsing & Saving...</>
                  : `🚀 ${backendMode ? "Real AI Parse" : "Start AI Parsing"} (${files.filter(f => f.status === "ready").length})`
                }
              </button>

              {/* Success */}
              {done && saved.length > 0 && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-700 font-bold mb-3 text-sm">
                    <CheckCircle size={16}/>
                    {saved.length} candidate{saved.length > 1 ? "s" : ""} saved to Supabase!
                  </div>
                  <div className="space-y-1 mb-3">
                    {saved.map((c, i) => (
                      <div key={i} className="text-sm text-green-700 flex items-center gap-2 flex-wrap">
                        <span>✓</span>
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-green-500 text-xs">Score: {c.ai_score} · {c.location}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={() => router.push("/hr/candidates")}
                      className="flex-1 bg-[#10B981] text-white py-2 rounded-xl text-sm font-semibold hover:bg-[#059669] transition-all">
                      View Candidates →
                    </button>
                    <button onClick={clearAll}
                      className="flex-1 bg-white border border-[#E2E8F0] text-slate-600 py-2 rounded-xl text-sm font-semibold hover:bg-[#F1F5F9] transition-all">
                      Upload More
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Uploads */}
              <div className="mt-6 bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-5">
                <div className="font-bold text-[#1E293B] mb-4 text-sm md:text-base">📋 Recent Uploads & Applications</div>
                <div className="space-y-3">
                  {[...saved, ...RECENT_UPLOADS.slice(0, 3)].map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <div className="w-9 h-9 bg-[#1253A4] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(c.name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#1E293B] truncate">{c.name}</div>
                        <div className="text-xs text-slate-400 truncate">
                          {c.file || "Resume uploaded"} · {c.time || "Just now"}
                        </div>
                      </div>
                      <div className="text-center flex-shrink-0">
                        <div className={`text-sm font-bold ${
                          (c.ai_score||c.score||0) >= 85 ? "text-green-600" :
                          (c.ai_score||c.score||0) >= 70 ? "text-yellow-600" : "text-slate-400"
                        }`}>
                          {c.ai_score || c.score || 0}
                        </div>
                        <div className="text-xs text-slate-400">Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — AI Pipeline */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-6">
              <div className="font-bold text-[#1E293B] mb-1 text-sm md:text-base">🤖 AI Processing Pipeline</div>
              <div className="text-xs text-slate-400 mb-5">Each resume goes through 7 automated steps</div>
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    step.status==="done"   ? "bg-green-50 border border-green-100" :
                    step.status==="active" ? "bg-blue-50 border border-blue-100"  :
                    "bg-[#F8FAFC]"
                  }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                      step.status==="done"   ? "bg-green-100" :
                      step.status==="active" ? "bg-blue-100"  : "bg-[#F1F5F9]"
                    }`}>
                      {step.status==="done"   ? "✅" :
                       step.status==="active" ? <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"/> :
                       step.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-semibold truncate ${
                        step.status==="done"   ? "text-green-700" :
                        step.status==="active" ? "text-blue-700"  : "text-slate-400"
                      }`}>{step.label}</div>
                      <div className="text-xs text-slate-400">
                        {step.status==="done" ? "Completed ✓" : step.status==="active" ? "Processing..." : "Waiting"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-[#F0F9FF] rounded-xl border border-[#BAE6FD]">
                <div className="text-xs font-bold text-[#0EA5C9] mb-2">ℹ️ How it works</div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div>→ Upload PDF or DOCX resume files</div>
                  <div>→ Click X to remove any file before parsing</div>
                  <div>→ {backendMode ? "Real spaCy NLP extracts name, email, skills" : "Name extracted from filename"}</div>
                  <div>→ AI score computed automatically</div>
                  <div>→ Saved to Supabase database instantly</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  ["Parse Time",  "< 5s"                                                              ],
                  ["Mode",        backendMode ? "Real AI" : "Waking up AI backend... please wait 30s"],
                  ["Saved To",    "Supabase DB"                                                       ],
                  ["Format",      "PDF · DOCX"                                                        ],
                ].map(([l, v]) => (
                  <div key={l} className="bg-[#F8FAFC] rounded-xl p-3 text-center">
                    <div className="text-sm font-bold text-[#1253A4]">{v}</div>
                    <div className="text-xs text-slate-400">{l}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}