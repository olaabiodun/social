import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Home, User, Package, CreditCard, FileText, MessageSquare, Phone, ExternalLink, LogOut, Search, Bell, Wallet, ShoppingCart } from "lucide-react";
import "../styles/dashboard.css";

type PanelName = "home" | "orders" | "profile" | "add-funds" | "support";

interface ModalData {
  title: string;
  desc: string;
  platform: string;
  stock: number;
  price: string;
}

const accountsData = {
  facebook: {
    catTitle: "Random Country Facebook",
    catIcon: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1024px-Facebook_Logo_%282019%29.png",
    catTags: ["GB", "CL", "DE"],
    accounts: [
      { desc: "High quality ES GA CA Facebook with 200-5,000 friends (sharp friends) Active marketplace, 90% has create profile Few has post", stock: 30, price: "NGN 4,000.00" },
      { desc: "2-10 YEARS OLD EUROPE CMCNCZ FACEBOOK WITH HIGH FRIENDS Active marketplace 60% have create profile Few has Get started dating ❤ (NO 2FA)", stock: 47, price: "NGN 5,500.00" },
      { desc: "facebook:2-15 High Quality USGBUATH MY FACEBOOK (30-1k friend) many accounts here have create profile this quality is very sharp 💯💯", stock: 33, price: "NGN 5,500.00" },
    ],
  },
  vpn: {
    catTitle: "VPN (For Laptop 💻) PC",
    catIcon: "",
    catTags: [],
    accounts: [
      { desc: "Express Vpn (Laptop)", stock: 22, price: "NGN 3,500.00", customIcon: "🛡️" },
      { desc: "Hma Vpn Key 🔑 PC", stock: 19, price: "NGN 3,500.00", customIcon: "🛡️" },
    ],
  },
  texting: {
    catTitle: "TEXTING APP 💬📞",
    catIcon: "",
    catTags: [],
    accounts: [
      { desc: "Next plus", stock: 32, price: "NGN 1,800.00", customIcon: "📱" },
      { desc: "Google Voice", stock: 15, price: "NGN 2,500.00", customIcon: "📱" },
    ],
  },
  instagram: {
    catTitle: "Premium Instagram Accounts",
    catIcon: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png",
    catTags: ["VERIFIED", "10K+", "REAL"],
    accounts: [
      { desc: "Instagram Verified · 10K–50K Followers · High engagement · Business-ready · Email access included", stock: 34, price: "NGN 8,500.00" },
      { desc: "Instagram 100K+ Followers · USA/UK · Female niche · Lifestyle content · Original email available", stock: 7, price: "NGN 22,000.00" },
    ],
  },
  tiktok: {
    catTitle: "TikTok Accounts",
    catIcon: "",
    catTags: ["AGED", "MONETIZED"],
    accounts: [
      { desc: "TikTok Monetized · 100K+ Followers · Aged 2+ years · Original email · TikTok Shop access", stock: 22, price: "NGN 15,000.00" },
      { desc: "TikTok 250K+ Followers · Mixed niches · High engagement rate · Email + phone access", stock: 4, price: "NGN 35,000.00" },
    ],
  },
  youtube: {
    catTitle: "YouTube Channels",
    catIcon: "",
    catTags: ["MONETIZED", "AGED"],
    accounts: [
      { desc: "YouTube Monetized · 1K+ Subscribers · 4,000 watch hours · AdSense ready · Tech/Gaming niche", stock: 18, price: "NGN 12,000.00" },
    ],
  },
};

const orders = [
  { id: "#ORD001", name: "High Quality Facebook", desc: "200–5K Friends · Intl", icon: "📘", platform: "Facebook", price: "NGN 4,000", date: "Mar 5, 2026", status: "completed" },
  { id: "#ORD002", name: "Instagram Verified", desc: "10K–50K Followers", icon: "📸", platform: "Instagram", price: "NGN 8,500", date: "Mar 4, 2026", status: "completed" },
  { id: "#ORD003", name: "TikTok Monetized", desc: "100K+ · TikTok Shop", icon: "🎵", platform: "TikTok", price: "NGN 15,000", date: "Mar 6, 2026", status: "pending" },
  { id: "#ORD004", name: "YouTube Channel", desc: "1K Sub · Monetized", icon: "▶️", platform: "YouTube", price: "NGN 12,000", date: "Mar 6, 2026", status: "processing" },
  { id: "#ORD005", name: "Europe Facebook", desc: "2–10 Yrs · High Friends", icon: "📘", platform: "Facebook", price: "NGN 5,500", date: "Feb 28, 2026", status: "completed" },
];

const transactions = [
  { name: "Wallet Top-Up", date: "Mar 5, 2026 · Bank Transfer", amount: "+NGN 20,000", type: "in" as const, icon: "💰" },
  { name: "Purchase: Facebook Account", date: "Mar 5, 2026 · Order #ORD001", amount: "-NGN 4,000", type: "out" as const, icon: "🛒" },
  { name: "Wallet Top-Up", date: "Mar 3, 2026 · Card Payment", amount: "+NGN 15,000", type: "in" as const, icon: "💰" },
  { name: "Purchase: Instagram Verified", date: "Mar 4, 2026 · Order #ORD002", amount: "-NGN 8,500", type: "out" as const, icon: "🛒" },
  { name: "Purchase: TikTok 100K", date: "Feb 28, 2026 · Order #ORD003", amount: "-NGN 15,000", type: "out" as const, icon: "🛒" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<PanelName>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("NGN 5,000");
  const [selectedPayment, setSelectedPayment] = useState(0);
  const [modal, setModal] = useState<ModalData | null>(null);

  const [toast, setToast] = useState({ show: false, msg: "" });
  const toastTimer = useRef<number>();

  const showToast = useCallback((msg: string) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast({ show: false, msg: "" }), 3000);
  }, []);

  const switchPanel = (name: PanelName) => {
    setActivePanel(name);
    setSidebarOpen(false);
  };

  const panelTitles: Record<PanelName, string> = {
    home: "Goodluckstore",
    profile: "My Profile",
    orders: "My Orders",
    "add-funds": "Add Funds",
    support: "Support Center",
  };

  const openModal = (title: string, desc: string, platform: string, stock: number, price: string) => {
    setModal({ title: title.toUpperCase(), desc, platform, stock, price });
  };

  return (
    <div className="dashboard-wrapper">
      {/* Toast */}
      <div className={`dash-toast${toast.show ? " show" : ""}`}>
        <span>{toast.msg}</span>
      </div>

      {/* Buy Modal */}
      {modal && (
        <div className="modal-overlay show" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            <div className="modal-head">
              <div className="modal-tag">Confirm Purchase</div>
              <h2 className="modal-title">{modal.title}</h2>
              <p className="modal-desc">{modal.desc}</p>
            </div>
            <div className="modal-detail-row">
              <span className="mdr-label">Platform</span>
              <span className="mdr-val">{modal.platform}</span>
            </div>
            <div className="modal-detail-row">
              <span className="mdr-label">Stock Available</span>
              <span className="mdr-val">{modal.stock}</span>
            </div>
            <div className="modal-detail-row">
              <span className="mdr-label">Your Balance</span>
              <span className="mdr-val" style={{ color: "var(--primary)" }}>NGN 0.00</span>
            </div>
            <div className="modal-total">
              <span className="mt-label">Total Cost</span>
              <span className="mt-val">{modal.price}</span>
            </div>
            <button className="btn-confirm" onClick={() => { setModal(null); showToast("✅ Order placed! Check My Orders for status."); }}>
              Confirm Purchase →
            </button>
          </div>
        </div>
      )}

      {/* Sidebar overlay */}
      <div className={`sidebar-overlay${sidebarOpen ? " show" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`dash-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <span className="logo-good">Good</span>
            <span className="logo-luck">luck</span>
            <span className="logo-store">store</span>
          </div>
          <div className="logo-underline" />
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item${activePanel === "home" ? " active" : ""}`} onClick={() => switchPanel("home")}>
            <span className="nav-icon"><Home size={18} /></span> Home
          </button>
          <button className={`nav-item${activePanel === "profile" ? " active" : ""}`} onClick={() => switchPanel("profile")}>
            <span className="nav-icon"><User size={18} /></span> Profile
          </button>
          <button className={`nav-item${activePanel === "orders" ? " active" : ""}`} onClick={() => switchPanel("orders")}>
            <span className="nav-icon"><Package size={18} /></span> My Orders
          </button>
          <button className={`nav-item${activePanel === "add-funds" ? " active" : ""}`} onClick={() => switchPanel("add-funds")}>
            <span className="nav-icon"><CreditCard size={18} /></span> Add Funds
          </button>
          <button className="nav-item" onClick={() => showToast("📄 Rules page coming soon")}>
            <span className="nav-icon"><FileText size={18} /></span> Rules
          </button>
          <button className="nav-item" onClick={() => switchPanel("add-funds")}>
            <span className="nav-icon"><Wallet size={18} /></span> Manual Payments
          </button>
          <button className={`nav-item${activePanel === "support" ? " active" : ""}`} onClick={() => switchPanel("support")}>
            <span className="nav-icon"><MessageSquare size={18} /></span> Support
          </button>
          <button className="nav-item" onClick={() => showToast("📱 Buy Numbers feature coming soon")}>
            <span className="nav-icon"><Phone size={18} /></span> Buy Numbers
            <span className="nav-ext"><ExternalLink size={12} /></span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button className="signout-btn" onClick={() => { showToast("👋 Signing out..."); setTimeout(() => navigate("/auth"), 1500); }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="dash-main">
        {/* Topbar */}
        <div className="topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span /><span /><span />
          </button>
          <div className="topbar-title">{panelTitles[activePanel]}</div>
          <div className="topbar-search">
            <span className="s-icon"><Search size={14} /></span>
            <input type="text" placeholder="Search accounts, platforms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="topbar-right">
            <div className="topbar-balance" onClick={() => switchPanel("add-funds")}>
              <span className="bal-icon">🏷️</span>
              <span className="bal-text">Balance: NGN 0.00</span>
            </div>
            <div className="topbar-avatar" onClick={() => switchPanel("profile")}>
              <User size={18} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="dash-content">

          {/* HOME */}
          <div className={`dash-panel${activePanel === "home" ? " active" : ""}`} style={{ paddingBottom: 24 }}>
            {Object.entries(accountsData)
              .filter(([, cat]) => {
                if (!searchQuery) return true;
                return cat.accounts.some(a => a.desc.toLowerCase().includes(searchQuery.toLowerCase()));
              })
              .map(([key, cat]) => (
              <div key={key} className="category-block">
                <div className="category-header">
                  <div className="cat-head-left">
                    <div className="cat-title">{cat.catTitle}</div>
                    {cat.catTags.length > 0 && (
                      <div className="cat-tags">
                        {cat.catTags.map((t) => <span key={t} className="cat-tag">{t}</span>)}
                      </div>
                    )}
                  </div>
                  <button className="cat-see-more" onClick={() => showToast(`Loading more ${key} accounts...`)}>See More →</button>
                </div>
                {cat.accounts
                  .filter((acc) => !searchQuery || acc.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((acc, i) => (
                    <div key={i} className="account-row">
                      <div className="acc-platform-icon">
                        {cat.catIcon ? (
                          <img src={cat.catIcon} alt={key} />
                        ) : (
                          <span style={{ fontSize: 24 }}>{(acc as any).customIcon || "📦"}</span>
                        )}
                      </div>
                      <div className="acc-info">
                        <div className="acc-desc">{acc.desc}</div>
                      </div>
                      <div className="acc-stock-price">
                        <div className="stock-block">
                          <div className="stock-label">Stock</div>
                          <div className={`stock-num${acc.stock === 0 ? " zero" : acc.stock < 10 ? " low" : ""}`}>{acc.stock}</div>
                        </div>
                        <div className="price-block">
                          <div className="price-label">Price</div>
                          <div className="price-val">{acc.price}</div>
                        </div>
                      </div>
                      <button className="buy-btn" disabled={acc.stock === 0} onClick={() => acc.stock > 0 && openModal(`${key} Account`, acc.desc, key.charAt(0).toUpperCase() + key.slice(1), acc.stock, acc.price)}>
                        <ShoppingCart size={14} /> <span>{acc.stock === 0 ? "OUT" : "BUY"}</span>
                      </button>
                    </div>
                  ))}
              </div>
            ))}
          </div>

          {/* ORDERS */}
          <div className={`dash-panel${activePanel === "orders" ? " active" : ""}`}>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-card-icon">📦</div><div className="stat-card-val">12</div><div className="stat-card-label">Total Orders</div><div className="stat-card-change change-up">+3 this month</div></div>
              <div className="stat-card"><div className="stat-card-icon">✅</div><div className="stat-card-val">9</div><div className="stat-card-label">Completed</div><div className="stat-card-change change-up">75% rate</div></div>
              <div className="stat-card"><div className="stat-card-icon">⏳</div><div className="stat-card-val">2</div><div className="stat-card-label">Pending</div><div className="stat-card-change change-down">Processing</div></div>
              <div className="stat-card"><div className="stat-card-icon">💸</div><div className="stat-card-val">47K</div><div className="stat-card-label">Total Spent (NGN)</div><div className="stat-card-change change-up">This month</div></div>
            </div>
            <div className="orders-table-wrap">
              <div className="section-header" style={{ padding: "20px 0 14px" }}>
                <div className="section-head-left">
                  <div className="section-hl" />
                  <span className="section-title">Order History</span>
                  <span className="section-badge">12 Orders</span>
                </div>
              </div>
              <div className="table-container">
                <table className="dash-table">
                  <thead>
                    <tr><th>Order ID</th><th>Account</th><th>Platform</th><th>Price</th><th>Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="order-id-cell">{o.id}</td>
                        <td><div className="order-name">{o.name}</div><div className="order-desc">{o.desc}</div></td>
                        <td><div className="order-platform"><span className="order-icon">{o.icon}</span>{o.platform}</div></td>
                        <td className="order-price">{o.price}</td>
                        <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{o.date}</td>
                        <td><span className={`status-pill status-${o.status}`}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PROFILE */}
          <div className={`dash-panel${activePanel === "profile" ? " active" : ""}`}>
            <div className="profile-panel-inner">
              <div className="profile-card-top">
                <div className="profile-avatar-big">JD<div className="avatar-edit">✏</div></div>
                <div className="profile-info">
                  <div className="pname">John Doe</div>
                  <div className="pemail">john.doe@example.com</div>
                  <div className="profile-badges">
                    <span className="profile-badge badge-verified">✓ Verified</span>
                    <span className="profile-badge badge-premium">⭐ Premium</span>
                  </div>
                </div>
              </div>
              <div className="profile-stats-row">
                <div className="profile-stat-card"><div className="profile-stat-val">12</div><div className="profile-stat-label">Orders Made</div></div>
                <div className="profile-stat-card"><div className="profile-stat-val">47K</div><div className="profile-stat-label">NGN Spent</div></div>
                <div className="profile-stat-card"><div className="profile-stat-val">0.00</div><div className="profile-stat-label">Balance (NGN)</div></div>
              </div>
              <div className="profile-form">
                <div className="form-section-title">Personal Information</div>
                <div className="form-grid">
                  <div className="form-group"><label className="form-label">First Name</label><input type="text" className="form-input" defaultValue="John" /></div>
                  <div className="form-group"><label className="form-label">Last Name</label><input type="text" className="form-input" defaultValue="Doe" /></div>
                  <div className="form-group full"><label className="form-label">Email Address</label><input type="email" className="form-input" defaultValue="john.doe@example.com" /></div>
                  <div className="form-group"><label className="form-label">Phone Number</label><input type="tel" className="form-input" placeholder="+234 000 000 0000" /></div>
                  <div className="form-group"><label className="form-label">Country</label><input type="text" className="form-input" placeholder="Nigeria" /></div>
                </div>
                <div className="form-section-title" style={{ marginTop: 28 }}>Change Password</div>
                <div className="form-grid">
                  <div className="form-group full"><label className="form-label">Current Password</label><input type="password" className="form-input" placeholder="••••••••" /></div>
                  <div className="form-group"><label className="form-label">New Password</label><input type="password" className="form-input" placeholder="••••••••" /></div>
                  <div className="form-group"><label className="form-label">Confirm Password</label><input type="password" className="form-input" placeholder="••••••••" /></div>
                </div>
                <div className="form-actions">
                  <button className="btn-save" onClick={() => showToast("✅ Profile updated successfully!")}>Save Changes</button>
                  <button className="btn-cancel">Cancel</button>
                </div>
              </div>
            </div>
          </div>

          {/* ADD FUNDS */}
          <div className={`dash-panel${activePanel === "add-funds" ? " active" : ""}`}>
            <div className="funds-panel">
              <div className="section-header" style={{ padding: "0 0 20px" }}>
                <div className="section-head-left">
                  <div className="section-hl" />
                  <span className="section-title">Add Funds to Wallet</span>
                </div>
              </div>
              <div className="funds-grid">
                <div>
                  <div className="funds-card">
                    <div className="funds-card-title">Select Amount</div>
                    <div className="amount-presets">
                      {["NGN 1,000", "NGN 5,000", "NGN 10,000", "NGN 20,000", "NGN 50,000", "NGN 100,000"].map((amt) => (
                        <button key={amt} className={`preset-btn${selectedPreset === amt ? " selected" : ""}`} onClick={() => setSelectedPreset(amt)}>
                          {amt.replace(",000", "K")}
                        </button>
                      ))}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Or Enter Custom Amount</label>
                      <input type="number" className="form-input" placeholder="Enter amount in NGN" />
                    </div>
                    <div className="form-section-title" style={{ marginTop: 20 }}>Payment Method</div>
                    <div className="payment-methods">
                      {[
                        { icon: "🏦", name: "Bank Transfer", desc: "Direct bank deposit · Instant confirmation" },
                        { icon: "💳", name: "Card Payment", desc: "Visa / Mastercard · Secure checkout" },
                        { icon: "₿", name: "Cryptocurrency", desc: "BTC / ETH / USDT · Fast processing" },
                      ].map((pm, i) => (
                        <div key={i} className={`payment-method${selectedPayment === i ? " selected" : ""}`} onClick={() => setSelectedPayment(i)}>
                          <span className="pm-icon">{pm.icon}</span>
                          <div><div className="pm-name">{pm.name}</div><div className="pm-desc">{pm.desc}</div></div>
                          <div className="pm-radio" />
                        </div>
                      ))}
                    </div>
                    <button className="btn-submit-funds" onClick={() => showToast("💳 Processing payment...")}>Proceed to Payment →</button>
                  </div>
                </div>
                <div>
                  <div className="funds-card">
                    <div className="funds-card-title">Transaction History</div>
                    <div className="trans-list">
                      {transactions.map((t, i) => (
                        <div key={i} className="trans-item">
                          <div className={`trans-icon ${t.type}`}>{t.icon}</div>
                          <div className="trans-desc"><div className="trans-name">{t.name}</div><div className="trans-date">{t.date}</div></div>
                          <div className={`trans-amount ${t.type}`}>{t.amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SUPPORT */}
          <div className={`dash-panel${activePanel === "support" ? " active" : ""}`}>
            <div className="support-panel">
              <div className="section-header" style={{ padding: "0 0 20px" }}>
                <div className="section-head-left">
                  <div className="section-hl" />
                  <span className="section-title">Support Center</span>
                </div>
              </div>
              <div className="support-topics">
                {[
                  { icon: "📦", name: "Order Issues", sub: "Problems with your purchase" },
                  { icon: "💰", name: "Payment & Billing", sub: "Deposit, refund inquiries" },
                  { icon: "🔒", name: "Account Security", sub: "Login, password issues" },
                  { icon: "📱", name: "Product Quality", sub: "Account quality issues" },
                ].map((topic, i) => (
                  <div key={i} className="topic-card" onClick={() => showToast(`${topic.icon} Loading ${topic.name.toLowerCase()} support...`)}>
                    <div className="topic-icon">{topic.icon}</div>
                    <div className="topic-name">{topic.name}</div>
                    <div className="topic-sub">{topic.sub}</div>
                  </div>
                ))}
              </div>
              <div className="support-grid">
                <div className="funds-card">
                  <div className="funds-card-title">Send a Message</div>
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label">Subject</label>
                    <input type="text" className="form-input" placeholder="Brief description of your issue" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label">Order ID (optional)</label>
                    <input type="text" className="form-input" placeholder="#ORD000" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label">Message</label>
                    <textarea className="form-input" placeholder="Describe your issue in detail..." />
                  </div>
                  <button className="btn-submit-funds" onClick={() => showToast("✅ Support ticket submitted!")}>Submit Ticket →</button>
                </div>
                <div className="funds-card">
                  <div className="funds-card-title">Quick Contact</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { icon: "💬", name: "Telegram Support", desc: "Usually replies in minutes" },
                      { icon: "📧", name: "Email Support", desc: "support@goodluckstore.com" },
                      { icon: "🌐", name: "Live Chat", desc: "Available 24/7 online" },
                    ].map((c, i) => (
                      <div key={i} className="payment-method" onClick={() => showToast(`${c.icon} Opening ${c.name.toLowerCase()}...`)}>
                        <span className="pm-icon">{c.icon}</span>
                        <div><div className="pm-name">{c.name}</div><div className="pm-desc">{c.desc}</div></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 20, padding: 16, background: "rgba(26,46,90,0.04)", border: "1px solid rgba(26,46,90,0.1)", borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" as const, color: "var(--primary)", marginBottom: 8 }}>Response Times</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      🟢 Telegram: ~5 minutes<br />
                      🟡 Live Chat: ~15 minutes<br />
                      🔵 Email: ~24 hours
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
