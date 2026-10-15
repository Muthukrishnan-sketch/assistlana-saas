'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminCandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(new Set());
  const [sending, setSending]       = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [customMsg, setCustomMsg]   = useState('');
  const [showMsgBox, setShowMsgBox] = useState(false);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search, setSearch]       = useState('');
  const [minScore, setMinScore]   = useState('');
  const [maxScore, setMaxScore]   = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ── Auth ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const admin = localStorage.getItem('admin_user');
    if (!admin) { router.push('/admin/login'); return; }
    fetchCandidates();
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/candidates`);
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived filtered list ────────────────────────────────────────────────────
  const filtered = candidates.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q);
    const matchMin    = !minScore || (c.skill_test_score ?? c.ai_score ?? 0) >= Number(minScore);
    const matchMax    = !maxScore || (c.skill_test_score ?? c.ai_score ?? 0) <= Number(maxScore);
    const matchField  = !fieldFilter || c.field === fieldFilter;
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchMin && matchMax && matchField && matchStatus;
  });

  // ── Select helpers ───────────────────────────────────────────────────────────
  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(c => c.id)));
    }
  };

  // ── Bulk WhatsApp ────────────────────────────────────────────────────────────
  const sendBulkWhatsApp = async () => {
    if (selected.size === 0) { alert('Select at least one candidate.'); return; }
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`${API}/api/whatsapp/bulk-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_ids: [...selected],
          message_override: customMsg || null,
        }),
      });
      const data = await res.json();
      setSendResult(data);
      setShowMsgBox(false);
      fetchCandidates(); // refresh triggered flags
    } catch (e) {
      setSendResult({ error: String(e) });
    } finally {
      setSending(false);
    }
  };

  // ── Score badge color ────────────────────────────────────────────────────────
  const scoreBadge = (score) => {
    if (score == null) return 'bg-gray-100 text-gray-500';
    if (score >= 75)   return 'bg-green-100 text-green-700';
    if (score >= 50)   return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-600';
  };

  const statusBadge = (status) => {
    const map = {
      'Reviewing': 'bg-blue-100 text-blue-700',
      'Shortlisted': 'bg-green-100 text-green-700',
      'Rejected': 'bg-red-100 text-red-600',
      'Hired': 'bg-purple-100 text-purple-700',
    };
    return map[status] || 'bg-gray-100 text-gray-500';
  };

  // ── Update candidate status ──────────────────────────────────────────────────
  const updateStatus = async (id, status) => {
    await fetch(`${API}/api/admin/candidates/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Candidates</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} of {candidates.length} candidates</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/admin/dashboard')} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">← Dashboard</button>
          <button onClick={fetchCandidates} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">↻ Refresh</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Name, email, phone..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Min Score</label>
            <input
              value={minScore}
              onChange={e => setMinScore(e.target.value)}
              type="number" min="0" max="100"
              placeholder="0"
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Max Score</label>
            <input
              value={maxScore}
              onChange={e => setMaxScore(e.target.value)}
              type="number" min="0" max="100"
              placeholder="100"
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Field</label>
            <select value={fieldFilter} onChange={e => setFieldFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">All</option>
              <option value="IT">IT</option>
              <option value="Non-IT">Non-IT</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">All</option>
              <option value="Reviewing">Reviewing</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Rejected">Rejected</option>
              <option value="Hired">Hired</option>
            </select>
          </div>
          <button
            onClick={() => { setSearch(''); setMinScore(''); setMaxScore(''); setFieldFilter(''); setStatusFilter(''); }}
            className="border border-gray-200 text-gray-500 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
          >Clear</button>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-blue-800">{selected.size} selected</span>
            <button
              onClick={() => setShowMsgBox(!showMsgBox)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
            >
              💬 Send WhatsApp
            </button>
            <button onClick={() => setSelected(new Set())} className="text-sm text-blue-600 hover:underline">Clear selection</button>

            {showMsgBox && (
              <div className="w-full mt-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Custom message <span className="text-gray-400">(optional — use {'{name}'} for candidate name)</span>
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={customMsg}
                    onChange={e => setCustomMsg(e.target.value)}
                    rows={3}
                    placeholder="Leave blank to use the default congratulations message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={sendBulkWhatsApp}
                      disabled={sending}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : 'Send Now'}
                    </button>
                    <button onClick={() => setShowMsgBox(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Send result */}
        {sendResult && (
          <div className={`rounded-xl p-4 mb-4 border text-sm ${sendResult.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-800'}`}>
            {sendResult.error ? (
              <p>❌ Error: {sendResult.error}</p>
            ) : (
              <div>
                <p className="font-medium">✅ Messages sent: {sendResult.sent} | Failed: {sendResult.failed}</p>
                {sendResult.failed > 0 && (
                  <ul className="mt-2 space-y-1">
                    {sendResult.results?.filter(r => !r.success).map((r, i) => (
                      <li key={i} className="text-xs">
                        {r.name || r.id}: {r.error === 'sandbox_not_joined'
                          ? '⚠️ Must send "join twilio-trial" to +14155238886 first'
                          : r.error || r.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <button onClick={() => setSendResult(null)} className="mt-2 text-xs underline opacity-70">Dismiss</button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No candidates match the filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left w-10">
                      <input type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={toggleAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Candidate</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Field</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Skill Score</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">AI Score</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Job Choice</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Career</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">WA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(c => (
                    <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${selected.has(c.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleOne(c.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{c.name || '—'}</div>
                        <div className="text-xs text-gray-400">{c.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.field === 'IT' ? 'bg-blue-100 text-blue-700' : c.field === 'Non-IT' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.field || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${scoreBadge(c.skill_test_score)}`}>
                          {c.skill_test_score != null ? `${c.skill_test_score}%` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${scoreBadge(c.ai_score)}`}>
                          {c.ai_score != null ? `${c.ai_score}%` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{c.job_choice || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{c.career_choice || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={c.status || 'Reviewing'}
                          onChange={e => updateStatus(c.id, e.target.value)}
                          className={`text-xs border-0 rounded-full px-2 py-1 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${statusBadge(c.status)}`}
                        >
                          <option value="Reviewing">Reviewing</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Hired">Hired</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.whatsapp_triggered
                          ? <span title="WhatsApp sent" className="text-green-500 text-lg">✅</span>
                          : <span title="Not sent" className="text-gray-300 text-lg">○</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sandbox reminder */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">⚠️ Twilio Sandbox Note</p>
          <p>Each candidate must send <strong>"join twilio-trial"</strong> to <strong>+1 415 523 8886</strong> on WhatsApp before they can receive messages. This is a Twilio sandbox limitation — production numbers don't need this.</p>
        </div>
      </div>
    </div>
  );
}