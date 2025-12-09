import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000/api";

function App() {
  // ---------- RFP State ----------
  const [rfpText, setRfpText] = useState("");
  const [rfps, setRfps] = useState([]);
  const [selectedRfpId, setSelectedRfpId] = useState(null);

  // ---------- Vendor State ----------
  const [vendors, setVendors] = useState([]);
  const [vendorName, setVendorName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorCategory, setVendorCategory] = useState("");

  // ---------- Proposal State ----------
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [proposalPrice, setProposalPrice] = useState("");
  const [proposalDeliveryDays, setProposalDeliveryDays] = useState("");
  const [proposalPaymentTerms, setProposalPaymentTerms] = useState("");
  const [proposalWarrantyYears, setProposalWarrantyYears] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");
  const [proposals, setProposals] = useState([]);

  // ---------- Inbox ----------
  const [inboxEmails, setInboxEmails] = useState([]);

  // ---------- UI States ----------
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------- Sidebar active tab ----------
  const [activeTab, setActiveTab] = useState("rfp"); // "rfp" | "vendors" | "inbox"

  // ========== Helpers ==========
  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleError = (err) => {
    console.error(err);
    showMessage("Something went wrong.");
  };

  // ========== API Calls ==========

  const loadRfps = async () => {
    try {
      const res = await fetch(`${API_BASE}/rfps`);
      const data = await res.json();

      // Normalize keyPoints (stored as JSON string) → array for UI
      const normalized = data.map((rfp) => {
        let keyPointsArray = [];
        if (rfp.keyPoints) {
          try {
            const parsed = JSON.parse(rfp.keyPoints);
            if (Array.isArray(parsed)) keyPointsArray = parsed;
          } catch {
            keyPointsArray = [];
          }
        }
        return { ...rfp, keyPointsArray };
      });

      setRfps(normalized);
      if (!selectedRfpId && normalized.length > 0) {
        setSelectedRfpId(normalized[0].id);
      }
    } catch (err) {
      handleError(err);
    }
  };

  const loadVendors = async () => {
    try {
      const res = await fetch(`${API_BASE}/vendors`);
      const data = await res.json();
      setVendors(data);
      if (!selectedVendorId && data.length > 0) {
        setSelectedVendorId(data[0].id);
      }
    } catch (err) {
      handleError(err);
    }
  };

  const createRfpFromText = async () => {
    if (!rfpText.trim()) return;

    const text = rfpText.trim();

    // Use first non-empty line as title
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const title =
      (lines[0] && lines[0].slice(0, 80)) || "Auto-created RFP from text";

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/rfps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: text,
          budget: null,
        }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        // ignore JSON errors
      }

      if (!res.ok) {
        console.error("Create RFP error:", res.status, data);
        showMessage(data?.error || "Could not create RFP");
        return;
      }

      showMessage("RFP created from text");
      setRfpText("");

      // reload list and select newly created RFP
      await loadRfps();
      if (data?.id) setSelectedRfpId(data.id);
    } catch (err) {
      console.error("Network error creating RFP:", err);
      showMessage("Network error while creating RFP");
    } finally {
      setLoading(false);
    }
  };

  const createVendor = async () => {
    if (!vendorName || !vendorEmail) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: vendorName,
          email: vendorEmail,
          category: vendorCategory,
        }),
      });
      if (!res.ok) throw new Error("Failed to create vendor");
      showMessage("Vendor created");
      setVendorName("");
      setVendorEmail("");
      setVendorCategory("");
      await loadVendors();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProposals = async () => {
    if (!selectedRfpId) return;
    try {
      const res = await fetch(`${API_BASE}/proposals?rfpId=${selectedRfpId}`);
      const data = await res.json();
      setProposals(data);
    } catch (err) {
      handleError(err);
    }
  };

  const createProposal = async () => {
    if (!selectedRfpId || !selectedVendorId) {
      showMessage("Select an RFP and a Vendor first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfpId: selectedRfpId,
          vendorId: selectedVendorId,
          totalPrice: proposalPrice ? Number(proposalPrice) : null,
          deliveryDays: proposalDeliveryDays
            ? Number(proposalDeliveryDays)
            : null,
          paymentTerms: proposalPaymentTerms || null,
          warrantyYears: proposalWarrantyYears
            ? Number(proposalWarrantyYears)
            : null,
          rawEmailBody: proposalNotes,
          items: [],
        }),
      });
      if (!res.ok) throw new Error("Failed to create proposal");
      showMessage("Proposal created & AI scored");
      setProposalPrice("");
      setProposalDeliveryDays("");
      setProposalPaymentTerms("");
      setProposalWarrantyYears("");
      setProposalNotes("");
      await loadProposals();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshInbox = async () => {
    try {
      const res = await fetch(`${API_BASE}/email/inbox?limit=5`);
      const data = await res.json();
      setInboxEmails(data);
      showMessage("Inbox refreshed");
    } catch (err) {
      handleError(err);
    }
  };

  // ========== Initial Load ==========
  useEffect(() => {
    loadRfps();
    loadVendors();
  }, []);

  useEffect(() => {
    loadProposals();
  }, [selectedRfpId]);

  const selectedRfp = rfps.find((r) => r.id === selectedRfpId) || null;

  // ==========================================================
  // ================== UI STARTS HERE =========================
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#06070d] text-gray-100 flex">
      {/* =================== SIDEBAR =================== */}
      <aside className="w-60 bg-[#0b0d15] border-r border-[#1a1c27] flex flex-col p-5 shadow-xl">
        <h1 className="text-2xl font-extrabold tracking-tight mb-8 bg-gradient-to-r from-[#14ffe1] via-[#00e887] to-[#00c853] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(0,255,180,0.35)]">
          Aerchain RFP Dashboard
        </h1>

        <nav className="space-y-3 text-sm">
          <button
            onClick={() => setActiveTab("rfp")}
            className={`w-full text-left px-3 py-2 rounded-lg border transition ${
              activeTab === "rfp"
                ? "bg-[#11131c] border-emerald-500 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.3)]"
                : "bg-[#11131c] border-[#1f2230] text-gray-300 hover:bg-[#151823]"
            }`}
          >
            📄 RFP Manager
          </button>

          <button
            onClick={() => setActiveTab("vendors")}
            className={`w-full text-left px-3 py-2 rounded-lg border transition ${
              activeTab === "vendors"
                ? "bg-[#11131c] border-cyan-500 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.3)]"
                : "bg-[#11131c] border-[#1f2230] text-gray-300 hover:bg-[#151823]"
            }`}
          >
            🧑‍💼 Vendors
          </button>

          <button
            onClick={() => setActiveTab("inbox")}
            className={`w-full text-left px-3 py-2 rounded-lg border transition ${
              activeTab === "inbox"
                ? "bg-[#11131c] border-fuchsia-500 text-fuchsia-300 shadow-[0_0_18px_rgba(217,70,239,0.3)]"
                : "bg-[#11131c] border-[#1f2230] text-gray-300 hover:bg-[#151823]"
            }`}
          >
            📨 Inbox
          </button>
        </nav>

        <div className="mt-auto pt-6 text-xs text-gray-500">
          © 2025 Aerchain RFP
        </div>
      </aside>

      {/* =================== MAIN AREA =================== */}
      <main className="flex-1 p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">
            {activeTab === "rfp" && "RFP & Proposal Management"}
            {activeTab === "vendors" && "Vendor Management"}
            {activeTab === "inbox" && "Email Inbox"}
          </h2>

          <button
            onClick={refreshInbox}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-semibold shadow-lg hover:opacity-90"
          >
            Refresh Inbox
          </button>
        </div>

        {/* Toast */}
        {message && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-900/40 border border-emerald-600 text-emerald-200 text-sm">
            {message}
          </div>
        )}

        {/* =================== GRID LAYOUT =================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* -------- LEFT COLUMN -------- */}
          <div className="space-y-6">
            {/* CREATE RFP (RFP tab) */}
            {activeTab === "rfp" && (
              <div className="p-5 rounded-2xl bg-[#0d0f18] border border-[#1a1d2c] shadow-lg shadow-black/40">
                <h3 className="text-lg font-semibold mb-2">
                  Create RFP from Text (AI)
                </h3>
                <p className="text-xs text-gray-400 mb-2">
                  Paste an email or requirement. AI will extract details and
                  generate summary & key points.
                </p>
                <textarea
                  value={rfpText}
                  onChange={(e) => setRfpText(e.target.value)}
                  className="w-full h-28 bg-[#11131c] border border-[#1f2230] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Example: We need 20 laptops with 16GB RAM..."
                />
                <button
                  onClick={createRfpFromText}
                  disabled={loading}
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold shadow-md hover:bg-emerald-400 disabled:opacity-50"
                >
                  {loading ? "Working..." : "Create AI RFP"}
                </button>
              </div>
            )}

            {/* CREATE VENDOR (Vendors tab) */}
            {activeTab === "vendors" && (
              <div className="p-5 rounded-2xl bg-[#0d0f18] border border-[#1a1d2c] shadow-lg shadow-black/40">
                <h3 className="text-lg font-semibold mb-2">Create Vendor</h3>
                <input
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full mb-2 p-2 rounded-lg bg-[#11131c] border border-[#1f2230]"
                  placeholder="Vendor Name"
                />
                <input
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                  className="w-full mb-2 p-2 rounded-lg bg-[#11131c] border border-[#1f2230]"
                  placeholder="Email"
                />
                <input
                  value={vendorCategory}
                  onChange={(e) => setVendorCategory(e.target.value)}
                  className="w-full mb-2 p-2 rounded-lg bg-[#11131c] border border-[#1f2230]"
                  placeholder="Category"
                />
                <button
                  onClick={createVendor}
                  disabled={loading}
                  className="mt-2 px-4 py-2 rounded-xl bg-cyan-500 text-black font-semibold shadow-md hover:bg-cyan-400 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Add Vendor"}
                </button>
              </div>
            )}

            {/* CREATE PROPOSAL (RFP tab) */}
            {activeTab === "rfp" && (
              <div className="p-5 rounded-2xl bg-[#0d0f18] border border-[#1a1d2c] shadow-lg shadow-black/40">
                <h3 className="text-lg font-semibold mb-2">Create Proposal</h3>

                <select
                  value={selectedRfpId || ""}
                  onChange={(e) =>
                    setSelectedRfpId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full mb-2 p-2 rounded-lg bg-[#11131c] border border-[#1f2230]"
                >
                  <option value="">Select RFP</option>
                  {rfps.map((r) => (
                    <option key={r.id} value={r.id}>
                      #{r.id} {r.title}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedVendorId || ""}
                  onChange={(e) =>
                    setSelectedVendorId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full mb-2 p-2 rounded-lg bg-[#11131c] border border-[#1f2230]"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.email})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    value={proposalPrice}
                    onChange={(e) => setProposalPrice(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#11131c] border border-[#1f2230]"
                    placeholder="Total Price"
                  />
                  <input
                    value={proposalDeliveryDays}
                    onChange={(e) => setProposalDeliveryDays(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#11131c] border border-[#1f2230]"
                    placeholder="Delivery Days"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    value={proposalPaymentTerms}
                    onChange={(e) => setProposalPaymentTerms(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#11131c] border border-[#1f2230]"
                    placeholder="Payment Terms"
                  />
                  <input
                    value={proposalWarrantyYears}
                    onChange={(e) => setProposalWarrantyYears(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#11131c] border border-[#1f2230]"
                    placeholder="Warranty Years"
                  />
                </div>

                <textarea
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  className="w-full mb-2 p-2 rounded-lg bg-[#11131c] border border-[#1f2230]"
                  placeholder="Proposal Notes / Email body"
                />

                <button
                  onClick={createProposal}
                  disabled={loading}
                  className="mt-2 px-4 py-2 rounded-xl bg-fuchsia-500 text-black font-semibold shadow-md hover:bg-fuchsia-400 disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Proposal (AI scored)"}
                </button>
              </div>
            )}
          </div>

          {/* -------- RIGHT COLUMN -------- */}
          <div className="space-y-6">
            {/* AI Insights panel (top) on RFP tab */}
            {activeTab === "rfp" && selectedRfp && (
              <div className="p-5 rounded-2xl bg-[#020617] border border-[#1f2937] shadow-lg shadow-black/40">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">
                    AI Insights for RFP #{selectedRfp.id}
                  </h3>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/60 text-emerald-300">
                    AI Generated
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  {selectedRfp.title}
                </div>
                {selectedRfp.summary ? (
                  <p className="text-sm text-slate-100 mb-2">
                    <span className="font-semibold text-emerald-300">
                      Summary:&nbsp;
                    </span>
                    {selectedRfp.summary}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    No AI summary available for this RFP yet.
                  </p>
                )}
                {selectedRfp.keyPointsArray &&
                  selectedRfp.keyPointsArray.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-semibold text-emerald-300 mb-1">
                        Key Points
                      </div>
                      <ul className="text-xs text-slate-200 list-disc list-inside space-y-0.5">
                        {selectedRfp.keyPointsArray.map((pt, idx) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {/* RFP LIST (RFP tab) */}
            {activeTab === "rfp" && (
              <div className="p-5 rounded-2xl bg-[#0d0f18] border border-[#1a1d2c] shadow-lg shadow-black/40 max-h-64 overflow-auto">
                <h3 className="text-lg font-semibold mb-2">RFPs</h3>
                {rfps.length === 0 && (
                  <div className="text-xs text-gray-500">
                    No RFPs yet. Create one on the left.
                  </div>
                )}
                {rfps.map((rfp) => (
                  <div
                    key={rfp.id}
                    onClick={() => setSelectedRfpId(rfp.id)}
                    className={`p-3 rounded-xl border mb-2 cursor-pointer transition ${
                      rfp.id === selectedRfpId
                        ? "border-emerald-500 bg-emerald-900/20"
                        : "border-[#1f2230] bg-[#11131c] hover:bg-[#151823]"
                    }`}
                  >
                    <div className="font-semibold text-sm">
                      #{rfp.id} {rfp.title}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Budget: {rfp.budget ?? "N/A"}
                      {rfp.deliveryTimelineDays
                        ? ` • Delivery: ${rfp.deliveryTimelineDays} days`
                        : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PROPOSALS (RFP tab) */}
            {activeTab === "rfp" && (
              <div className="p-5 rounded-2xl bg-[#0d0f18] border border-[#1a1d2c] shadow-lg shadow-black/40 max-h-60 overflow-auto">
                <h3 className="text-lg font-semibold mb-2">
                  Proposals{" "}
                  {selectedRfp && (
                    <span className="text-xs text-gray-400">
                      (for RFP #{selectedRfp.id})
                    </span>
                  )}
                </h3>
                {proposals.length === 0 && (
                  <div className="text-xs text-gray-500">
                    No proposals for this RFP yet.
                  </div>
                )}
                {proposals.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-[#1f2230] bg-[#11131c] mb-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm">
                        Proposal #{p.id} – ₹{p.totalPrice ?? "N/A"}
                      </div>
                      {p.aiScore != null && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-sky-900/60 border border-sky-500/60 text-sky-200">
                          AI Score: {p.aiScore}/100
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 mb-1">
                      Vendor: {p.vendor?.name} ({p.vendor?.email}){" "}
                      {p.deliveryDays && `• ${p.deliveryDays} days`}{" "}
                      {p.warrantyYears && `• ${p.warrantyYears} yrs warranty`}
                    </div>
                    {p.paymentTerms && (
                      <div className="text-[11px] text-gray-300 mb-1">
                        Payment terms: {p.paymentTerms}
                      </div>
                    )}
                    {p.aiAnalysis && (
                      <div className="text-[11px] text-gray-300 mt-1">
                        <span className="font-semibold text-fuchsia-300">
                          AI Analysis:&nbsp;
                        </span>
                        {p.aiAnalysis.length > 220
                          ? p.aiAnalysis.slice(0, 220) + "..."
                          : p.aiAnalysis}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* VENDORS (Vendors tab) */}
            {activeTab === "vendors" && (
              <div className="p-5 rounded-2xl bg-[#0d0f18] border border-[#1a1d2c] shadow-lg shadow-black/40 max-h-[28rem] overflow-auto">
                <h3 className="text-lg font-semibold mb-2">Vendors</h3>
                {vendors.length === 0 && (
                  <div className="text-xs text-gray-500">
                    No vendors yet. Create one on the left.
                  </div>
                )}
                {vendors.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVendorId(v.id)}
                    className={`p-3 rounded-xl border mb-2 cursor-pointer transition ${
                      v.id === selectedVendorId
                        ? "border-cyan-500 bg-cyan-900/20"
                        : "border-[#1f2230] bg-[#11131c] hover:bg-[#151823]"
                    }`}
                  >
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-xs text-gray-300">{v.email}</div>
                    {v.category && (
                      <div className="mt-1 inline-flex text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-100">
                        {v.category}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* INBOX (Inbox tab) */}
            {activeTab === "inbox" && (
              <div className="p-5 rounded-2xl bg-[#0d0f18] border border-[#1a1d2c] shadow-lg shadow-black/40 max-h-[28rem] overflow-auto">
                <h3 className="text-lg font-semibold mb-2">Latest Emails</h3>
                {inboxEmails.length === 0 && (
                  <div className="text-xs text-gray-500">
                    No emails loaded yet. Click “Refresh Inbox” above.
                  </div>
                )}
                {inboxEmails.map((m) => (
                  <div
                    key={m.seq}
                    className="p-3 rounded-xl border border-[#1f2230] bg-[#11131c] mb-2"
                  >
                    <div className="font-semibold text-sm">{m.subject}</div>
                    <div className="text-xs text-gray-400">
                      {m.from} — {m.date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
