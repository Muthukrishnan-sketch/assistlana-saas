"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HRSidebar from "@/components/hr/HRSidebar";
import { supabase } from "@/lib/supabase";
import { downloadCandidatesExcel, downloadSingleCandidate } from "@/lib/excelExport";
import { Search, Bell, Eye, X, Download, Filter, ChevronDown, Trash2 } from "lucide-react";

export default function HRCandidates() {
  const router = useRouter();

  const [user,           setUser]           = useState(null);
  const [candidates,     setCandidates]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [selected,       setSelected]       = useState(null);
  const [showFilter,     setShowFilter]     = useState(false);
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");
  const [filterQual,     setFilterQual]     = useState("All");
  const [filterAgeMin,   setFilterAgeMin]   = useState("");
  const [filterAgeMax,   setFilterAgeMax]   = useState("");
  const [deleteMsg,      setDeleteMsg]      = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("hr_user");
    if (!stored) { router.push("/"); return; }
    setUser(JSON.parse(stored));
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCandidates(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from("candidates")
      .delete()
      .eq("id", id);
    if (!error) {
      setCandidates(prev => prev.filter(c => c.id !== id));
      setSelected(null);
      setDeleteMsg("✅ Candidate deleted successfully!");
      setTimeout(() => setDeleteMsg(""), 3000);
    }
  };

  const handleShortlist = async (candidate) => {
    const { error } = await supabase
      .from("candidates")
      .update({ status: "Shortlisted" })
      .eq("id", candidate.id);
    if (!error) {
      setCandidates(prev => prev.map(c =>
        c.id === candidate.id ? { ...c, status:"Shortlisted" } : c
      ));
      setSelected(prev => prev ? { ...prev, status:"Shortlisted" } : null);
    }
  };

  // ── Unique filter values from real DB data ──
  const locations      = ["All", ...new Set(candidates.map(c => c.location).filter(Boolean))];
  const qualifications = ["All", ...new Set(candidates.map(c => c.qualification).filter(Boolean))];
  const statuses       = ["All","Shortlisted","Reviewing","Pending","Rejected"];

  // ── Apply all filters ──
  const filtered = candidates.filter(c => {
    const matchSearch   = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase()) ||
      (c.skills && c.skills.join(" ").toLowerCase().includes(search.toLowerCase()));
    const matchStatus   = filterStatus   === "All" || c.status        === filterStatus;
    const matchLocation = filterLocation === "All" || c.location      === filterLocation;
    const matchQual     = filterQual     === "All" || c.qualification === filterQual;
    const matchAge      = (!filterAgeMin || c.age >= parseInt(filterAgeMin)) &&
                          (!filterAgeMax || c.age <= parseInt(filterAgeMax));
    return matchSearch && matchStatus && matchLocation && matchQual && matchAge;
  });

  const activeFilters = [filterStatus, filterLocation, filterQual].filter(f => f !== "All").length +
    (filterAgeMin || filterAgeMax ? 1 : 0);

  const resetFilters = () => {
    setFilterStatus("All"); setFilterLocation("All");
    setFilterQual("All"); setFilterAgeMin(""); setFilterAgeMax("");
  };

  // ── Helper components ──
  const ScoreBadge = ({ score }) => {
    const s = score || 0;
    const bg = s >= 85 ? "bg-green-100 text-green-700"
             : s >= 70 ? "bg-yellow-100 text-yellow-700"
             : "bg-red-100 text-red-700";
    return (
      <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${bg}`}>
        {s}
      </span>
    );
  };

  const StatusBadge = ({ status }) => {
    const map = {
      Shortlisted: "bg-green-100 text-green-700",
      Reviewing:   "bg-yellow-100 text-yellow-700",
      Pending:     "bg-slate-100 text-slate-600",
      Rejected:    "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${map[status] || "bg-gray-100 text-gray-600"}`}>
        {status || "Pending"}
      </span>
    );
  };

  // ── Avatar initials + color ──
  const getInitials = (name) => name ? name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() : "?";
  const getColor    = (name) => {
    const colors = ["#1253A4","#0EA5C9","#10B981","#8B5CF6","#F59E0B","#EF4444","#6366F1","#EC4899"];
    let hash = 0;
    for (let i = 0; i < (name||"").length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  // ── Loading state ──
  if (!user) return null;

  if (loading) return (
    <div className="min-h-screen flex bg-[#F0F4FA]">
      <HRSidebar user={user}/>
      <div className="ml-0 md:ml-56 flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1253A4] border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
          <div className="text-slate-500 font-semibold">Loading candidates from Supabase...</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F0F4FA]">
      <HRSidebar user={user}/>
      <div className="ml-0 md:ml-56 flex-1 w-full min-w-0">

        {/* ── Topbar ── */}
        <div className="bg-white border-b border-[#E2E8F0] px-4 md:px-8 py-3 md:py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-2 mb-3 md:mb-0">
            <div className="min-w-0 pl-12 md:pl-0">
              <div className="text-base md:text-lg font-bold text-[#1E293B] truncate">Candidates</div>
              <div className="text-xs text-slate-400 truncate">
                {candidates.length} total candidates
              </div>
            </div>
            <button className="relative p-2 bg-[#F1F5F9] rounded-xl flex-shrink-0 md:hidden">
              <Bell size={16} className="text-slate-500"/>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"/>
            </button>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 md:justify-end">
            <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-3 py-2 flex-shrink-0">
              <Search size={14} className="text-slate-400"/>
              <input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-24 md:w-48 text-slate-600"/>
            </div>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold border transition-all flex-shrink-0 whitespace-nowrap ${
                showFilter || activeFilters > 0
                  ? "bg-[#1253A4] text-white border-[#1253A4]"
                  : "bg-white text-slate-600 border-[#E2E8F0] hover:border-[#1253A4]"
              }`}>
              <Filter size={14}/>
              Filters
              {activeFilters > 0 && (
                <span className="bg-white text-[#1253A4] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {activeFilters}
                </span>
              )}
            </button>
            <button
              onClick={() => downloadCandidatesExcel(filtered, "ASSISTLANA_Candidates")}
              className="flex items-center gap-1 bg-[#10B981] text-white px-3 py-2 rounded-xl text-xs md:text-sm font-semibold hover:bg-[#059669] transition-all flex-shrink-0 whitespace-nowrap">
              <Download size={14}/> <span className="hidden sm:inline">Download Excel</span>
            </button>
            <button
              onClick={fetchCandidates}
              className="p-2 bg-[#F1F5F9] rounded-xl text-slate-500 hover:bg-[#E2E8F0] transition-all flex-shrink-0"
              title="Refresh">
              🔄
            </button>
            <button className="relative p-2 bg-[#F1F5F9] rounded-xl flex-shrink-0 hidden md:flex">
              <Bell size={16} className="text-slate-500"/>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"/>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8">

          {/* Delete success */}
          {deleteMsg && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-4 text-sm font-medium">
              {deleteMsg}
            </div>
          )}

          {/* ── Filter Panel ── */}
          {showFilter && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-[#1E293B] flex items-center gap-2 text-sm md:text-base">
                  <Filter size={16} className="text-[#1253A4]"/>
                  Filter Candidates
                </div>
                <div className="flex items-center gap-3">
                  {activeFilters > 0 && (
                    <button onClick={resetFilters}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold underline">
                      Clear All
                    </button>
                  )}
                  <button onClick={() => setShowFilter(false)}
                    className="text-slate-400 hover:text-slate-600">
                    <X size={16}/>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                    Status
                  </label>
                  <div className="relative">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm outline-none bg-[#F8FAFC] appearance-none">
                      {statuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                    Location
                  </label>
                  <div className="relative">
                    <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm outline-none bg-[#F8FAFC] appearance-none">
                      {locations.map(l => <option key={l}>{l}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                  </div>
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                    Qualification
                  </label>
                  <div className="relative">
                    <select value={filterQual} onChange={e => setFilterQual(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm outline-none bg-[#F8FAFC] appearance-none">
                      {qualifications.map(q => <option key={q}>{q}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                  </div>
                </div>

                {/* Age Range */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                    Age Range
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" value={filterAgeMin}
                      onChange={e => setFilterAgeMin(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm outline-none bg-[#F8FAFC]"/>
                    <span className="text-slate-400">–</span>
                    <input type="number" placeholder="Max" value={filterAgeMax}
                      onChange={e => setFilterAgeMax(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm outline-none bg-[#F8FAFC]"/>
                  </div>
                </div>
              </div>

              {/* Active tags */}
              {activeFilters > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#F1F5F9]">
                  <span className="text-xs text-slate-400 font-semibold mt-1">Active:</span>
                  {filterStatus   !== "All" && <span className="text-xs bg-[#EFF6FF] text-[#1253A4] px-3 py-1 rounded-full font-semibold">Status: {filterStatus}</span>}
                  {filterLocation !== "All" && <span className="text-xs bg-[#EFF6FF] text-[#1253A4] px-3 py-1 rounded-full font-semibold">Location: {filterLocation}</span>}
                  {filterQual     !== "All" && <span className="text-xs bg-[#EFF6FF] text-[#1253A4] px-3 py-1 rounded-full font-semibold">Qual: {filterQual}</span>}
                  {(filterAgeMin || filterAgeMax) && <span className="text-xs bg-[#EFF6FF] text-[#1253A4] px-3 py-1 rounded-full font-semibold">Age: {filterAgeMin||"0"}–{filterAgeMax||"∞"}</span>}
                </div>
              )}
            </div>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs md:text-sm text-slate-500">
              Showing <span className="font-bold text-[#1E293B]">{filtered.length}</span> of <span className="font-bold text-[#1E293B]">{candidates.length}</span>
            </div>
            <button onClick={() => downloadCandidatesExcel(filtered, "Filtered_Candidates")}
              className="flex items-center gap-2 text-xs text-[#10B981] font-semibold hover:underline">
              <Download size={12}/> Download filtered ({filtered.length})
            </button>
          </div>

          {/* ── MOBILE: Card List ── */}
          <div className="md:hidden space-y-3">
            {filtered.map((c,i) => (
              <div key={c.id || i} className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: getColor(c.name) }}>
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1E293B] truncate">{c.name}</div>
                    <div className="text-xs text-slate-400 truncate">{c.email}</div>
                  </div>
                  <ScoreBadge score={c.ai_score}/>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs bg-[#F1F5F9] text-slate-600 px-2 py-1 rounded-lg font-medium">
                    📍 {c.location || "N/A"}
                  </span>
                  <span className="text-xs bg-[#F5F3FF] text-[#8B5CF6] px-2 py-1 rounded-lg font-medium">
                    {c.qualification || "—"}
                  </span>
                  <span className="text-xs text-slate-500">Age {c.age || "—"}</span>
                  <StatusBadge status={c.status}/>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0EA5C9] rounded-full"
                      style={{ width:`${c.jd_match || 0}%` }}/>
                  </div>
                  <span className="text-xs font-bold flex-shrink-0">JD: {c.jd_match || 0}%</span>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(c)}
                    className="flex-1 flex items-center justify-center gap-1 p-2 bg-[#EFF6FF] text-[#1253A4] rounded-lg text-xs font-semibold">
                    <Eye size={13}/> View
                  </button>
                  <button onClick={() => downloadSingleCandidate(c)}
                    className="flex-1 flex items-center justify-center gap-1 p-2 bg-[#F0FDF4] text-[#10B981] rounded-lg text-xs font-semibold">
                    <Download size={13}/> Excel
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    className="p-2 bg-red-50 text-red-500 rounded-lg">
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && !loading && (
              <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-[#E2E8F0]">
                <div className="text-4xl mb-3">👥</div>
                <div className="font-semibold mb-1">
                  {candidates.length === 0
                    ? "No candidates in database yet"
                    : "No candidates match your filters"}
                </div>
                <div className="text-sm">
                  {candidates.length === 0
                    ? "Upload resumes to get started"
                    : "Try adjusting your filters"}
                </div>
                {candidates.length === 0 && (
                  <button onClick={() => router.push("/hr/upload")}
                    className="mt-4 bg-[#1253A4] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#0d47a1]">
                    Upload Resumes →
                  </button>
                )}
                {candidates.length > 0 && (
                  <button onClick={resetFilters}
                    className="mt-3 text-sm text-[#1253A4] font-semibold hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── DESKTOP: Table ── */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    {["Candidate","Location","Age","Qualification","AI Score","JD Match","Status","Uploaded","Actions"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c,i) => (
                    <tr key={c.id || i} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-all">

                      {/* Candidate */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: getColor(c.name) }}>
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#1E293B]">{c.name}</div>
                            <div className="text-xs text-slate-400">{c.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3">
                        <span className="text-xs bg-[#F1F5F9] text-slate-600 px-2 py-1 rounded-lg font-medium whitespace-nowrap">
                          📍 {c.location || "N/A"}
                        </span>
                      </td>

                      {/* Age */}
                      <td className="py-3 px-3 text-sm text-slate-600 font-medium">
                        {c.age || "—"}
                      </td>

                      {/* Qualification */}
                      <td className="py-3 px-3">
                        <span className="text-xs bg-[#F5F3FF] text-[#8B5CF6] px-2 py-1 rounded-lg font-medium whitespace-nowrap">
                          {c.qualification || "—"}
                        </span>
                      </td>

                      {/* AI Score */}
                      <td className="py-3 px-3">
                        <ScoreBadge score={c.ai_score}/>
                      </td>

                      {/* JD Match */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                            <div className="h-full bg-[#0EA5C9] rounded-full"
                              style={{ width:`${c.jd_match || 0}%` }}/>
                          </div>
                          <span className="text-xs font-bold">{c.jd_match || 0}%</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <StatusBadge status={c.status}/>
                      </td>
                      {/* Uploaded */}
                      <td className="py-3 px-3 text-xs text-slate-400 whitespace-nowrap">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelected(c)}
                            className="p-1.5 bg-[#EFF6FF] text-[#1253A4] rounded-lg hover:bg-[#DBEAFE] transition-all"
                            title="View Profile">
                            <Eye size={13}/>
                          </button>
                          <button onClick={() => downloadSingleCandidate(c)}
                            className="p-1.5 bg-[#F0FDF4] text-[#10B981] rounded-lg hover:bg-[#DCFCE7] transition-all"
                            title="Download">
                            <Download size={13}/>
                          </button>
                          <button onClick={() => handleDelete(c.id)}
                            className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all"
                            title="Delete">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && !loading && (
              <div className="text-center py-16 text-slate-400">
                <div className="text-4xl mb-3">👥</div>
                <div className="font-semibold mb-1">
                  {candidates.length === 0
                    ? "No candidates in database yet"
                    : "No candidates match your filters"}
                </div>
                <div className="text-sm">
                  {candidates.length === 0
                    ? "Upload resumes to get started"
                    : "Try adjusting your filters"}
                </div>
                {candidates.length === 0 && (
                  <button onClick={() => router.push("/hr/upload")}
                    className="mt-4 bg-[#1253A4] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#0d47a1]">
                    Upload Resumes →
                  </button>
                )}
                {candidates.length > 0 && (
                  <button onClick={resetFilters}
                    className="mt-3 text-sm text-[#1253A4] font-semibold hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Candidate Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="bg-[#0B1D3A] px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <div className="text-white font-bold">Candidate Profile</div>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadSingleCandidate(selected)}
                  className="flex items-center gap-1 bg-[#10B981] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#059669]">
                  <Download size={12}/> <span className="hidden sm:inline">Excel</span>
                </button>
                <button onClick={() => setSelected(null)}
                  className="text-slate-400 hover:text-white">
                  <X size={18}/>
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              {/* Profile header */}
              <div className="flex flex-wrap items-center gap-4 mb-5 p-4 bg-[#F8FAFC] rounded-xl">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                  style={{ background: getColor(selected.name) }}>
                  {getInitials(selected.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-[#1E293B] truncate">{selected.name}</div>
                  <div className="text-sm text-slate-400 truncate">{selected.email}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    📍 {selected.location} · Age {selected.age}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#1253A4]">{selected.ai_score}</div>
                  <div className="text-xs text-slate-400">AI Score</div>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  ["🎓 Qualification", selected.qualification || "—"          ],
                  ["💼 Experience",    (selected.experience_years||"—")+" yrs"],
                  ["🎯 JD Match",      (selected.jd_match||0)+"%"             ],
                  ["📊 Status",        selected.status || "Pending"           ],
                ].map(([l,v],i) => (
                  <div key={i} className="bg-[#F8FAFC] rounded-xl p-3">
                    <div className="text-xs text-slate-400 mb-0.5">{l}</div>
                    <div className="text-sm font-bold text-[#1E293B]">{v}</div>
                  </div>
                ))}
              </div>

              {/* Score breakdown */}
              <div className="mb-4">
                <div className="text-xs font-bold text-slate-500 mb-2 uppercase">Score Breakdown</div>
                {[
                  { label:"Skills",     val:Math.round((selected.ai_score||0)*0.4), max:40, color:"#0EA5C9" },
                  { label:"Experience", val:Math.round((selected.ai_score||0)*0.3), max:30, color:"#1253A4" },
                  { label:"Education",  val:Math.round((selected.ai_score||0)*0.2), max:20, color:"#8B5CF6" },
                  { label:"Extras",     val:Math.round((selected.ai_score||0)*0.1), max:10, color:"#10B981" },
                ].map((s,i) => (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-500">{s.label}</span>
                      <span className="font-bold" style={{ color:s.color }}>{s.val}/{s.max}</span>
                    </div>
                    <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width:`${(s.val/s.max)*100}%`, background:s.color }}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Skills */}
              {selected.skills && selected.skills.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-500 mb-2 uppercase">Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.skills.map((s,i) => (
                      <span key={i} className="text-xs bg-[#EFF6FF] text-[#1253A4] px-2 py-1 rounded-md font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume link */}
              {selected.resume_url && (
                <div className="mb-4">
                  <a href={selected.resume_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-[#0EA5C9] font-semibold hover:underline">
                    📄 View Resume PDF
                  </a>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleShortlist(selected)}
                  disabled={selected.status === "Shortlisted"}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    selected.status === "Shortlisted"
                      ? "bg-green-100 text-green-700 cursor-not-allowed"
                      : "bg-[#1253A4] text-white hover:bg-[#0d47a1]"
                  }`}>
                  {selected.status === "Shortlisted" ? "✅ Shortlisted" : "⭐ Shortlist"}
                </button>
                <button onClick={() => downloadSingleCandidate(selected)}
                  className="flex-1 bg-[#10B981] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#059669] flex items-center justify-center gap-2">
                  <Download size={14}/> Download XL
                </button>
                <button onClick={() => handleDelete(selected.id)}
                  className="px-4 bg-red-50 text-red-500 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 flex items-center justify-center gap-1">
                  <Trash2 size={14}/> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}