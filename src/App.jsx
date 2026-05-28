import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://egpxdtigafitfxodaqqg.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncHhkdGlnYWZpdGZ4b2RhcXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4Nzk2MDksImV4cCI6MjA5NTQ1NTYwOX0.yxipdtYAoQpwNtbZ3pu52mwDW6Bjt8gHEHdCcr4ipDA";

const sb = {
  headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },

  async signUp(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password })
    });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password })
    });
    return r.json();
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST", headers: { ...this.headers, Authorization: `Bearer ${token}` }
    });
  },
  async getProfile(userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
      headers: { ...this.headers, Authorization: `Bearer ${token}` }
    });
    const d = await r.json();
    return d[0];
  },
  async upsertProfile(profile, token) {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: { ...this.headers, Authorization: `Bearer ${token}`, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(profile)
    });
  },
  async saveReceipt(receipt, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/receipts`, {
      method: "POST",
      headers: { ...this.headers, Authorization: `Bearer ${token}`, Prefer: "return=representation" },
      body: JSON.stringify(receipt)
    });
    return r.json();
  },
  async getReceipts(userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/receipts?user_id=eq.${userId}&order=created_at.desc&limit=50`, {
      headers: { ...this.headers, Authorization: `Bearer ${token}` }
    });
    return r.json();
  }
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const peso = n => "₱" + (n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

// ─── STYLES ────────────────────────────────────────────────────────────────────
const S = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#080810;color:#f0ede8;-webkit-font-smoothing:antialiased;}

/* AUTH */
.auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;
  background:radial-gradient(ellipse at 20% 50%,rgba(232,200,74,0.08) 0%,transparent 60%),
  radial-gradient(ellipse at 80% 20%,rgba(100,80,200,0.06) 0%,transparent 50%), #080810;}
.auth-card{width:100%;max-width:400px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);
  border-radius:20px;padding:36px 32px;}
.auth-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.8rem;text-align:center;margin-bottom:4px;}
.auth-logo span{color:#e8c84a;}
.auth-tagline{text-align:center;font-size:0.8rem;color:rgba(240,237,232,0.35);margin-bottom:28px;letter-spacing:0.3px;}
.auth-tabs{display:flex;background:rgba(255,255,255,0.05);border-radius:10px;padding:4px;margin-bottom:24px;}
.auth-tab{flex:1;padding:9px;border:none;background:transparent;color:rgba(240,237,232,0.4);
  font-family:'DM Sans',sans-serif;font-size:0.85rem;border-radius:7px;cursor:pointer;transition:all 0.2s;}
.auth-tab.active{background:#e8c84a;color:#080810;font-weight:600;}
.field{margin-bottom:14px;}
.field label{display:block;font-size:0.72rem;color:rgba(240,237,232,0.4);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;}
.field input{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
  border-radius:10px;padding:12px 14px;color:#f0ede8;font-family:'DM Sans',sans-serif;font-size:0.9rem;outline:none;transition:border 0.2s;}
.field input:focus{border-color:rgba(232,200,74,0.5);}
.auth-btn{width:100%;background:#e8c84a;color:#080810;border:none;border-radius:10px;padding:14px;
  font-family:'Syne',sans-serif;font-weight:700;font-size:0.95rem;cursor:pointer;margin-top:6px;transition:all 0.2s;}
.auth-btn:hover{background:#f5d862;}
.auth-btn:disabled{opacity:0.5;cursor:not-allowed;}
.auth-err{background:rgba(255,80,80,0.1);border:1px solid rgba(255,80,80,0.2);border-radius:8px;
  padding:10px 14px;color:#ff8080;font-size:0.8rem;margin-bottom:12px;}
.auth-ok{background:rgba(110,232,122,0.1);border:1px solid rgba(110,232,122,0.2);border-radius:8px;
  padding:10px 14px;color:#6ee87a;font-size:0.8rem;margin-bottom:12px;}

/* APP SHELL */
.app{min-height:100vh;display:flex;flex-direction:column;}
.nav{display:flex;align-items:center;justify-content:space-between;padding:15px 20px;
  background:rgba(8,8,16,0.95);border-bottom:1px solid rgba(255,255,255,0.06);
  position:sticky;top:0;z-index:100;backdrop-filter:blur(12px);}
.nav-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.15rem;}
.nav-logo span{color:#e8c84a;}
.nav-center{display:flex;gap:3px;background:rgba(255,255,255,0.05);border-radius:9px;padding:3px;}
.nav-tab{padding:6px 14px;border-radius:7px;border:none;background:transparent;
  color:rgba(240,237,232,0.45);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;transition:all 0.2s;}
.nav-tab.active{background:#e8c84a;color:#080810;font-weight:600;}
.nav-right{display:flex;align-items:center;gap:10px;}
.plan-badge{font-size:0.68rem;font-weight:700;padding:3px 9px;border-radius:20px;letter-spacing:0.5px;}
.plan-free{background:rgba(255,255,255,0.08);color:rgba(240,237,232,0.4);}
.plan-premium{background:linear-gradient(135deg,#e8c84a,#f5a623);color:#080810;}
.logout-btn{background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(240,237,232,0.4);
  border-radius:7px;padding:5px 10px;font-size:0.75rem;cursor:pointer;transition:all 0.2s;}
.logout-btn:hover{color:#f0ede8;border-color:rgba(255,255,255,0.2);}

/* GENERATOR */
.gen-wrap{display:flex;gap:24px;padding:24px;max-width:1080px;margin:0 auto;width:100%;}
.input-col{flex:1;display:flex;flex-direction:column;gap:14px;}
.col-label{font-size:0.68rem;font-weight:700;letter-spacing:2px;color:rgba(240,237,232,0.3);text-transform:uppercase;}
.chat-box{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);
  border-radius:13px;padding:16px;color:#f0ede8;font-family:'DM Sans',sans-serif;
  font-size:0.88rem;line-height:1.65;resize:none;min-height:200px;outline:none;transition:border 0.2s;}
.chat-box:focus{border-color:rgba(232,200,74,0.4);}
.chat-box::placeholder{color:rgba(240,237,232,0.18);}
.gen-btn{background:#e8c84a;color:#080810;border:none;border-radius:11px;padding:14px 20px;
  font-family:'Syne',sans-serif;font-weight:700;font-size:0.9rem;cursor:pointer;
  transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;}
.gen-btn:hover:not(:disabled){background:#f5d862;transform:translateY(-1px);}
.gen-btn:disabled{opacity:0.45;cursor:not-allowed;}
.limit-note{font-size:0.75rem;color:rgba(240,237,232,0.35);text-align:center;padding:4px 0;}
.spin{width:15px;height:15px;border:2px solid rgba(8,8,16,0.3);border-top-color:#080810;
  border-radius:50%;animation:spin 0.7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.err-box{background:rgba(255,80,80,0.08);border:1px solid rgba(255,80,80,0.2);
  border-radius:9px;padding:12px 15px;color:#ff8080;font-size:0.82rem;}

/* RECEIPT COL */
.receipt-col{width:340px;flex-shrink:0;}
.receipt-empty{background:rgba(255,255,255,0.03);border:1px dashed rgba(255,255,255,0.09);
  border-radius:13px;min-height:380px;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:8px;color:rgba(240,237,232,0.18);font-size:0.82rem;text-align:center;padding:20px;}
.receipt-empty-icon{font-size:2.2rem;margin-bottom:4px;}

/* RECEIPT CARD */
.r-card{background:#fff;border-radius:13px;padding:22px;color:#1a1a2e;
  box-shadow:0 20px 60px rgba(0,0,0,0.6);animation:up 0.3s ease;}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.r-head{text-align:center;margin-bottom:18px;padding-bottom:14px;border-bottom:1.5px dashed #e8e8e8;}
.r-brand{font-family:'Syne',sans-serif;font-weight:800;font-size:1.15rem;}
.r-brand span{color:#b8960a;}
.r-sub{font-size:0.68rem;color:#aaa;margin-top:2px;}
.r-date{font-size:0.7rem;color:#bbb;margin-top:6px;}
.r-meta{background:#f8f8f8;border-radius:7px;padding:9px 11px;margin-bottom:12px;font-size:0.76rem;}
.r-row{display:flex;justify-content:space-between;padding:2px 0;color:#666;}
.r-row strong{color:#222;}
.r-cust{font-size:0.78rem;margin-bottom:12px;color:#555;}
.r-cust strong{display:block;font-size:0.82rem;color:#1a1a2e;margin-bottom:1px;}
.r-items{border-top:1px solid #eee;padding-top:11px;margin-bottom:11px;}
.r-item{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:7px;font-size:0.78rem;}
.r-item-name{flex:1;color:#333;}
.r-item-qty{color:#bbb;margin:0 7px;font-size:0.7rem;}
.r-item-amt{font-weight:600;color:#1a1a2e;}
.r-breakdown{border-top:1.5px dashed #e8e8e8;padding-top:11px;font-size:0.78rem;}
.r-total{display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;
  border-top:2px solid #1a1a2e;font-family:'Syne',sans-serif;font-weight:700;font-size:0.95rem;color:#1a1a2e;}
.r-foot{text-align:center;margin-top:14px;padding-top:12px;border-top:1.5px dashed #e8e8e8;font-size:0.66rem;color:#ccc;}
.r-wm{font-size:0.6rem;color:#ddd;margin-top:4px;}
.r-actions{display:flex;gap:9px;margin-top:14px;}
.r-act{flex:1;padding:11px;border-radius:9px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;
  font-weight:500;font-size:0.8rem;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:5px;}
.r-act-dark{background:#1a1a2e;color:#fff;}
.r-act-dark:hover{background:#2d2d50;}
.r-act-ghost{background:rgba(255,255,255,0.06);color:#f0ede8;border:1px solid rgba(255,255,255,0.1);}
.r-act-ghost:hover{background:rgba(255,255,255,0.1);}
.r-act:disabled{opacity:0.5;cursor:not-allowed;}

/* DASHBOARD */
.dash{padding:24px;max-width:1080px;margin:0 auto;width:100%;}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px;}
.m-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
  border-radius:13px;padding:20px;position:relative;overflow:hidden;}
.m-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,#e8c84a,transparent);}
.m-label{font-size:0.68rem;color:rgba(240,237,232,0.35);letter-spacing:1px;text-transform:uppercase;margin-bottom:7px;}
.m-val{font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;color:#f0ede8;line-height:1.1;}
.m-val small{font-size:0.85rem;font-weight:400;color:rgba(240,237,232,0.35);}
.m-note{margin-top:5px;font-size:0.7rem;color:#6ee87a;}
.charts{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px;}
.c-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:13px;padding:20px;}
.c-title{font-family:'Syne',sans-serif;font-size:0.82rem;font-weight:700;margin-bottom:3px;}
.c-sub{font-size:0.7rem;color:rgba(240,237,232,0.3);margin-bottom:16px;}
.orders-box{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:13px;overflow:hidden;}
.orders-head{padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);}
.orders-head h3{font-family:'Syne',sans-serif;font-size:0.85rem;font-weight:700;}
.orders-box table{width:100%;border-collapse:collapse;}
.orders-box th{padding:9px 20px;text-align:left;font-size:0.67rem;color:rgba(240,237,232,0.3);
  letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,0.06);}
.orders-box td{padding:12px 20px;font-size:0.8rem;border-bottom:1px solid rgba(255,255,255,0.04);}
.pill{background:rgba(110,232,122,0.12);color:#6ee87a;font-size:0.68rem;padding:3px 9px;border-radius:20px;font-weight:500;}
.lock-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:400px;gap:12px;text-align:center;padding:24px;}
.lock-icon{font-size:2.8rem;}
.lock-title{font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:800;}
.lock-sub{color:rgba(240,237,232,0.35);font-size:0.85rem;max-width:300px;line-height:1.6;}
.up-btn{background:linear-gradient(135deg,#e8c84a,#f5a623);color:#080810;border:none;
  border-radius:9px;padding:12px 26px;font-family:'Syne',sans-serif;font-weight:700;
  font-size:0.9rem;cursor:pointer;margin-top:6px;transition:all 0.2s;}
.up-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(232,200,74,0.3);}
.empty-dash{text-align:center;padding:40px 20px;color:rgba(240,237,232,0.25);font-size:0.85rem;}

@media(max-width:700px){
  .gen-wrap{flex-direction:column;padding:16px;}
  .receipt-col{width:100%;}
  .metrics{grid-template-columns:1fr;}
  .charts{grid-template-columns:1fr;}
  .nav-center .nav-tab{font-size:0.72rem;padding:5px 10px;}
}
`;

// ─── RECEIPT CARD COMPONENT ────────────────────────────────────────────────────
function ReceiptCard({ data, isPremium }) {
  const dt = data.transaction_details;
  const br = data.breakdown;
  return (
    <div className="r-card" id="receipt-render">
      <div className="r-head">
        <div className="r-brand">Resibo<span>Qk</span></div>
        <div className="r-sub">Official Receipt</div>
        <div className="r-date">{new Date(dt.date_time).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</div>
      </div>
      <div className="r-meta">
        <div className="r-row"><span>Payment</span><strong>{dt.payment_method}</strong></div>
        {dt.reference_number && <div className="r-row"><span>Ref #</span><strong>{dt.reference_number}</strong></div>}
        <div className="r-row"><span>Status</span><strong style={{ color: "#2a9d4a" }}>{dt.status}</strong></div>
      </div>
      {data.customer?.name && (
        <div className="r-cust">
          <strong>📍 {data.customer.name}</strong>
          {data.customer.notes && <span>{data.customer.notes}</span>}
        </div>
      )}
      <div className="r-items">
        {data.items.map((it, i) => (
          <div className="r-item" key={i}>
            <span className="r-item-name">{it.item_name}</span>
            <span className="r-item-qty">×{it.quantity}</span>
            <span className="r-item-amt">{peso(it.total_item_price)}</span>
          </div>
        ))}
      </div>
      <div className="r-breakdown">
        <div className="r-row"><span>Subtotal</span><span>{peso(br.subtotal)}</span></div>
        {br.delivery_fee > 0 && <div className="r-row"><span>Delivery</span><span>{peso(br.delivery_fee)}</span></div>}
        {br.discount > 0 && <div className="r-row"><span>Discount</span><span>-{peso(br.discount)}</span></div>}
        <div className="r-total"><span>TOTAL</span><span>{peso(br.grand_total)}</span></div>
      </div>
      <div className="r-foot">
        Salamat sa inyong order! 🙏
        {!isPremium && <div className="r-wm">Made with ResiboQk • resiboqk.app</div>}
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ───────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function handle() {
    setLoading(true); setErr(""); setOk("");
    if (mode === "signup") {
      const d = await sb.signUp(email, pass);
      if (d.error) { setErr(d.error.message); }
      else { setOk("✅ Account created! Check your email to confirm, then log in."); setMode("login"); }
    } else {
      const d = await sb.signIn(email, pass);
      if (d.error) { setErr(d.error.message); }
      else { onAuth(d); }
    }
    setLoading(false);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">Resibo<span>Qk</span></div>
        <div className="auth-tagline">Instant receipts for Filipino merchants</div>
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setErr(""); setOk(""); }}>Log In</button>
          <button className={`auth-tab ${mode === "signup" ? "active" : ""}`} onClick={() => { setMode("signup"); setErr(""); setOk(""); }}>Sign Up</button>
        </div>
        {err && <div className="auth-err">⚠️ {err}</div>}
        {ok && <div className="auth-ok">{ok}</div>}
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        <button className="auth-btn" onClick={handle} disabled={loading || !email || !pass}>
          {loading ? "Please wait..." : mode === "login" ? "Log In →" : "Create Account →"}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function ResiboQk() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("generator");
  const [chatText, setChatText] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Load profile after login
  async function loadProfile(sess) {
    let prof = await sb.getProfile(sess.user.id, sess.access_token);
    if (!prof) {
      await sb.upsertProfile({ id: sess.user.id, email: sess.user.email, is_premium: false, receipts_today: 0, last_receipt_date: today() }, sess.access_token);
      prof = await sb.getProfile(sess.user.id, sess.access_token);
    }
    // Reset daily counter if new day
    if (prof.last_receipt_date !== today()) {
      await sb.upsertProfile({ ...prof, receipts_today: 0, last_receipt_date: today() }, sess.access_token);
      prof.receipts_today = 0;
      prof.last_receipt_date = today();
    }
    setProfile(prof);
    const recs = await sb.getReceipts(sess.user.id, sess.access_token);
    setReceipts(Array.isArray(recs) ? recs : []);
  }

  function onAuth(sess) {
    setSession(sess);
    loadProfile(sess);
  }

  async function handleLogout() {
    if (session) await sb.signOut(session.access_token);
    setSession(null); setProfile(null); setReceipts([]); setReceipt(null);
  }

  const isPremium = profile?.is_premium || false;
  const dailyUsed = profile?.receipts_today || 0;
  const canGenerate = isPremium || dailyUsed < 5;

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true); setErr(""); setReceipt(null);
    const sys = `You are ResiboQk's receipt parser. Parse raw Tagalog/English/Taglish order text into JSON only.
Return ONLY valid JSON, no markdown, no explanation:
{"transaction_details":{"date_time":"<ISO8601 now if unknown>","payment_method":"<method>","reference_number":"<ref or null>","status":"<Paid|Pending>"},"customer":{"name":"<name or address>","notes":"<notes or null>"},"items":[{"item_name":"<name>","quantity":<n>,"unit_price":<n>,"total_item_price":<n>}],"breakdown":{"subtotal":<n>,"delivery_fee":<n>,"discount":<n>,"grand_total":<n>}}
Compute all totals accurately.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: sys, messages: [{ role: "user", content: chatText }] })
      });
      const d = await res.json();
      const raw = d.content?.map(b => b.text || "").join("").trim().replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      setReceipt(parsed);
      // Update daily count
      const newCount = dailyUsed + 1;
      await sb.upsertProfile({ ...profile, receipts_today: newCount, last_receipt_date: today() }, session.access_token);
      setProfile(p => ({ ...p, receipts_today: newCount }));
    } catch {
      setErr("Hindi ma-parse ang order. Subukan ulit na may detalye ng items, quantity, at bayad.");
    }
    setLoading(false);
  }

  async function handleDownload() {
    const el = document.getElementById("receipt-render");
    if (!el) return;
    if (!window.html2canvas) {
      await new Promise(r => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        s.onload = r; document.head.appendChild(s);
      });
    }
    const canvas = await window.html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
    const a = document.createElement("a");
    a.download = `receipt-${Date.now()}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  async function handleMarkDone() {
    if (!receipt || !session) return;
    setSaving(true);
    await sb.saveReceipt({
      user_id: session.user.id,
      customer_name: receipt.customer?.name || "Customer",
      payment_method: receipt.transaction_details?.payment_method,
      subtotal: receipt.breakdown?.subtotal,
      delivery_fee: receipt.breakdown?.delivery_fee,
      discount: receipt.breakdown?.discount,
      grand_total: receipt.breakdown?.grand_total,
      status: receipt.transaction_details?.status || "Paid",
      raw_json: receipt
    }, session.access_token);
    const updated = await sb.getReceipts(session.user.id, session.access_token);
    setReceipts(Array.isArray(updated) ? updated : []);
    setSaving(false);
    alert("✅ Na-save sa iyong Dashboard!");
  }

  // Chart data from real receipts
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyData = weekDays.map(d => ({ day: d, revenue: 0 }));
  receipts.forEach(r => {
    const dow = new Date(r.created_at).getDay();
    weeklyData[dow].revenue += r.grand_total || 0;
  });

  const monthlyData = ["Wk 1", "Wk 2", "Wk 3", "Wk 4"].map((wk, i) => ({ week: wk, revenue: 0 }));
  receipts.forEach(r => {
    const dom = new Date(r.created_at).getDate();
    const wi = Math.min(Math.floor((dom - 1) / 7), 3);
    monthlyData[wi].revenue += r.grand_total || 0;
  });

  const totalRevenue = receipts.reduce((s, r) => s + (r.grand_total || 0), 0);
  const netProfit = totalRevenue * 0.82;
  const totalOrders = receipts.length;

  if (!session) return (
    <>
      <style>{S}</style>
      <AuthScreen onAuth={onAuth} />
    </>
  );

  return (
    <>
      <style>{S}</style>
      <div className="app">
        <nav className="nav">
          <div className="nav-logo">Resibo<span>Qk</span></div>
          <div className="nav-center">
            <button className={`nav-tab ${tab === "generator" ? "active" : ""}`} onClick={() => setTab("generator")}>🧾 Generator</button>
            <button className={`nav-tab ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>📊 Dashboard</button>
          </div>
          <div className="nav-right">
            <span className={`plan-badge ${isPremium ? "plan-premium" : "plan-free"}`}>{isPremium ? "✦ Premium" : "Free"}</span>
            <button className="logout-btn" onClick={handleLogout}>Sign out</button>
          </div>
        </nav>

        {tab === "generator" && (
          <div className="gen-wrap">
            <div className="input-col">
              <div className="col-label">Paste Order Chat</div>
              <textarea className="chat-box" value={chatText} onChange={e => setChatText(e.target.value)} rows={9}
                placeholder={"I-paste ang chat order dito, hal:\n\nHi po! Order ko:\n2x Beef Sinigang ₱180 each\n1x Rice ₱25\nDelivery ₱50\nBayad GCash ref 123456\nDeliver to Kris, Brgy. San Miguel"} />
              {err && <div className="err-box">⚠️ {err}</div>}
              {!canGenerate && <div className="err-box">⚠️ Naabot na ang 5 receipts ngayon. Mag-upgrade sa Premium para unlimited!</div>}
              <button className="gen-btn" onClick={handleGenerate} disabled={loading || !chatText.trim() || !canGenerate}>
                {loading ? <><div className="spin" /> Nag-pa-parse...</> : "⚡ Gumawa ng Resibo"}
              </button>
              <div className="limit-note">
                {isPremium ? "✦ Premium: Walang limit • Walang watermark" : `Free: ${dailyUsed}/5 receipts ngayon • ₱150/buwan para unlimited`}
              </div>
            </div>

            <div className="receipt-col">
              <div className="col-label" style={{ marginBottom: 12 }}>Preview ng Resibo</div>
              {receipt ? (
                <>
                  <ReceiptCard data={receipt} isPremium={isPremium} />
                  <div className="r-actions">
                    <button className="r-act r-act-dark" onClick={handleDownload}>⬇️ Download PNG</button>
                    <button className="r-act r-act-ghost" onClick={handleMarkDone} disabled={saving}>{saving ? "Sine-save..." : "✓ Mark Done"}</button>
                  </div>
                </>
              ) : (
                <div className="receipt-empty">
                  <div className="receipt-empty-icon">🧾</div>
                  <strong>Lalabas dito ang resibo</strong>
                  <span>I-paste ang order at pindutin ang Generate</span>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "dashboard" && (
          <div className="dash">
            {!isPremium ? (
              <div className="lock-screen">
                <div className="lock-icon">🔒</div>
                <div className="lock-title">Premium Dashboard</div>
                <div className="lock-sub">I-unlock ang automated sales tracking, revenue analytics, at visual performance graphs sa halagang ₱150/buwan lang.</div>
                <button className="up-btn">✦ Mag-upgrade sa Premium</button>
                <span style={{ fontSize: "0.73rem", color: "rgba(240,237,232,0.2)", marginTop: 6 }}>Contact support to activate your premium plan</span>
              </div>
            ) : (
              <>
                <div className="metrics">
                  <div className="m-card">
                    <div className="m-label">Gross Revenue</div>
                    <div className="m-val">{peso(totalRevenue)}</div>
                    <div className="m-note">Lahat ng orders</div>
                  </div>
                  <div className="m-card">
                    <div className="m-label">Est. Net Profit</div>
                    <div className="m-val">{peso(netProfit)}</div>
                    <div className="m-note">~82% ng revenue</div>
                  </div>
                  <div className="m-card">
                    <div className="m-label">Orders Done</div>
                    <div className="m-val">{totalOrders} <small>orders</small></div>
                    <div className="m-note">Mula nang mag-sign up</div>
                  </div>
                </div>

                <div className="charts">
                  <div className="c-card">
                    <div className="c-title">Weekly Revenue</div>
                    <div className="c-sub">Araw-araw ngayong linggo</div>
                    <ResponsiveContainer width="100%" height={170}>
                      <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" tick={{ fill: "rgba(240,237,232,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(240,237,232,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? "₱" + (v / 1000).toFixed(1) + "k" : "₱" + v} />
                        <Tooltip formatter={v => peso(v)} contentStyle={{ background: "#1a1a2e", border: "none", borderRadius: 8, fontSize: 11 }} />
                        <Line type="monotone" dataKey="revenue" stroke="#e8c84a" strokeWidth={2.5} dot={{ fill: "#e8c84a", r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="c-card">
                    <div className="c-title">Monthly Breakdown</div>
                    <div className="c-sub">Bawat linggo ngayong buwan</div>
                    <ResponsiveContainer width="100%" height={170}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="week" tick={{ fill: "rgba(240,237,232,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(240,237,232,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? "₱" + (v / 1000).toFixed(0) + "k" : "₱" + v} />
                        <Tooltip formatter={v => peso(v)} contentStyle={{ background: "#1a1a2e", border: "none", borderRadius: 8, fontSize: 11 }} />
                        <Bar dataKey="revenue" fill="#e8c84a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="orders-box">
                  <div className="orders-head"><h3>Recent Orders</h3></div>
                  {receipts.length === 0 ? (
                    <div className="empty-dash">Wala pang orders. Gumawa ng resibo at i-mark as Done! 🧾</div>
                  ) : (
                    <table>
                      <thead><tr><th>Customer</th><th>Payment</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                      <tbody>
                        {receipts.map((r, i) => (
                          <tr key={i}>
                            <td>{r.customer_name}</td>
                            <td style={{ color: "rgba(240,237,232,0.45)", fontSize: "0.76rem" }}>{r.payment_method}</td>
                            <td style={{ color: "rgba(240,237,232,0.35)", fontSize: "0.75rem" }}>{new Date(r.created_at).toLocaleDateString("en-PH")}</td>
                            <td style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{peso(r.grand_total)}</td>
                            <td><span className="pill">{r.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
