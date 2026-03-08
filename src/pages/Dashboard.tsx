import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
    catIcon: "📘",
    catTags: ["GB", "CL", "DE", "US"],
    accounts: [
      { desc: "High quality Facebook with 200–5,000 friends (sharp friends) · Active marketplace · 90% have profile · Few posts", tags: [{ label: "High Quality", type: "quality" }, { label: "Intl", type: "region" }, { label: "Active Marketplace", type: "note" }], stock: 81, price: "NGN 4,000" },
      { desc: "2–10 Years Old Europe Facebook · HIGH FRIENDS · Active marketplace · 60% have profile · Get started dating ❤ (NO 2FA)", tags: [{ label: "2–10 Yrs Old", type: "age" }, { label: "Europe", type: "region" }, { label: "High Friends", type: "quality" }, { label: "No 2FA", type: "note" }], stock: 49, price: "NGN 5,500" },
      { desc: "Facebook 2–15 High Quality · 30–1K friends · Many accounts have profile · Quality is very sharp 💯", tags: [{ label: "Premium", type: "quality" }, { label: "2–15 Yrs", type: "age" }, { label: "Profile Complete", type: "note" }], stock: 0, price: "NGN 5,500" },
    ],
  },
  instagram: {
    catTitle: "Premium Instagram Accounts",
    catIcon: "📸",
    catTags: ["VERIFIED", "10K+", "REAL"],
    accounts: [
      { desc: "Instagram Verified · 10K–50K Followers · High engagement · Business-ready · Email access included", tags: [{ label: "Verified ✓", type: "quality" }, { label: "Global", type: "region" }, { label: "Email Access", type: "note" }], stock: 34, price: "NGN 8,500" },
      { desc: "Instagram 100K+ Followers · USA/UK · Female niche · Lifestyle content · Original email available", tags: [{ label: "100K+", type: "quality" }, { label: "USA/UK", type: "region" }, { label: "Female Niche", type: "age" }], stock: 7, price: "NGN 22,000" },
    ],
  },
  tiktok: {
    catTitle: "TikTok Accounts",
    catIcon: "🎵",
    catTags: ["AGED", "MONETIZED"],
    accounts: [
      { desc: "TikTok Monetized · 100K+ Followers · Aged 2+ years · Original email · Already has TikTok Shop access", tags: [{ label: "Monetized", type: "quality" }, { label: "2+ Yrs Old", type: "age" }, { label: "TikTok Shop", type: "note" }], stock: 22, price: "NGN 15,000" },
      { desc: "TikTok 250K+ Followers · Mixed niches · High engagement rate · Email + phone access · Clean account history", tags: [{ label: "250K+", type: "quality" }, { label: "Mixed Niche", type: "region" }, { label: "Clean History", type: "note" }], stock: 4, price: "NGN 35,000" },
    ],
  },
  youtube: {
    catTitle: "YouTube Channels",
    catIcon: "▶️",
    catTags: ["MONETIZED", "AGED"],
    accounts: [
      { desc: "YouTube Monetized · 1K+ Subscribers · 4,000 watch hours · AdSense ready · Tech/Gaming niche", tags: [{ label: "Monetized", type: "quality" }, { label: "AdSense Ready", type: "age" }, { label: "Tech/Gaming", type: "note" }], stock: 18, price: "NGN 12,000" },
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
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("NGN 5,000");
  const [selectedPayment, setSelectedPayment] = useState(0);
  const [modal, setModal] = useState<ModalData | null>(null);

  // Toast
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
    home: "Goodluck Store",
    profile: "My Profile",
    orders: "My Orders",
    "add-funds": "Add Funds",
    support: "Support Center",
  };

  const navItems: { label: string; icon: string; panel: PanelName; badge?: string }[] = [
    { label: "Home", icon: "🏠", panel: "home" },
    { label: "Profile", icon: "👤", panel: "profile" },
    { label: "My Orders", icon: "📦", panel: "orders", badge: "3" },
  ];

  const financeItems: { label: string; icon: string; panel: PanelName }[] = [
    { label: "Add Funds", icon: "💳", panel: "add-funds" },
    { label: "Manual Payments", icon: "💵", panel: "add-funds" },
  ];

  const filterCategories = ["all", "facebook", "instagram", "tiktok", "youtube", "twitter"];

  const openModal = (title: string, desc: string, platform: string, stock: number, price: string) => {
    setModal({ title: title.toUpperCase(), desc, platform, stock, price });
  };

  const tagClass = (type: string) => {
    const map: Record<string, string> = { quality: "tag-quality", age: "tag-age", region: "tag-region", note: "tag-note" };
    return `acc-tag ${map[type] || "tag-note"}`;
  };

  const filteredCategories = Object.entries(accountsData).filter(
    ([key]) => activeFilter === "all" || key === activeFilter
  );

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
              <span className="mdr-val" style={{ color: "var(--yellow)" }}>NGN 0.00</span>
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
            <div className="logo-icon">G</div>
            Goodluck Store
          </div>
        </div>

        <div className="sidebar-balance">
          <div>
            <div className="balance-label">Wallet Balance</div>
            <div className="balance-val">0.00</div>
            <div className="balance-currency">NGN</div>
          </div>
          <button className="add-funds-mini" onClick={() => { switchPanel("add-funds"); showToast("💳 Add funds to your wallet"); }}>+</button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {navItems.map((item) => (
            <button key={item.panel} className={`nav-item${activePanel === item.panel ? " active" : ""}`} onClick={() => switchPanel(item.panel)}>
              <span className="nav-icon">{item.icon}</span> {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="nav-section-label">Finance</div>
          {financeItems.map((item, i) => (
            <button key={i} className={`nav-item${activePanel === item.panel && i === 0 ? " active" : ""}`} onClick={() => switchPanel(item.panel)}>
              <span className="nav-icon">{item.icon}</span> {item.label}
            </button>
          ))}

          <div className="nav-section-label">Info</div>
          <button className="nav-item" onClick={() => showToast("📄 Rules page coming soon")}>
            <span className="nav-icon">📄</span> Rules
          </button>
          <button className={`nav-item${activePanel === "support" ? " active" : ""}`} onClick={() => switchPanel("support")}>
            <span className="nav-icon">💬</span> Support
          </button>
          <button className="nav-item" onClick={() => showToast("📱 Buy Numbers feature coming soon")}>
            <span className="nav-icon">📱</span> Buy Numbers
            <span className="nav-ext">↗</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-row" onClick={() => switchPanel("profile")}>
            <div className="user-avatar">JD</div>
            <div className="user-info">
              <div className="uname">John Doe</div>
              <div className="uemail">john@example.com</div>
            </div>
          </div>
          <button className="signout-btn" onClick={() => { showToast("👋 Signing out..."); setTimeout(() => navigate("/auth"), 1500); }}>
            🚪 Sign Out
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
            <span className="s-icon">🔍</span>
            <input type="text" placeholder="Search accounts, platforms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="topbar-right">
            <div className="topbar-balance" onClick={() => switchPanel("add-funds")}>
              <span className="bal-icon">💰</span>
              <span className="bal-text">NGN 0.00</span>
            </div>
            <div className="notif-btn" onClick={() => showToast("🔔 No new notifications")}>
              🔔
              <div className="notif-dot" />
            </div>
            <div className="topbar-avatar" onClick={() => switchPanel("profile")}>JD</div>
          </div>
        </div>

        {/* Content */}
        <div className="dash-content">

          {/* HOME */}
          <div className={`dash-panel${activePanel === "home" ? " active" : ""}`}>
            <div className="welcome-banner">
              <div className="welcome-inner">
                <div className="welcome-left">
                  <div className="wtag">● Premium Marketplace</div>
                  <h2>FIND YOUR<br /><span>PERFECT</span><br />ACCOUNT</h2>
                  <p>Browse thousands of verified social media accounts. Instant delivery guaranteed.</p>
                </div>
                <div className="welcome-right">
                  <div className="wstat"><div className="wstat-num">10K+</div><div className="wstat-label">Accounts</div></div>
                  <div className="wstat"><div className="wstat-num">50K+</div><div className="wstat-label">Verified</div></div>
                  <div className="wstat"><div className="wstat-num">98%</div><div className="wstat-label">Satisfied</div></div>
                </div>
              </div>
            </div>

            <div className="filter-row">
              <span className="filter-label">Popular:</span>
              {filterCategories.map((cat) => (
                <button key={cat} className={`filter-pill${activeFilter === cat ? " active" : ""}`} onClick={() => setActiveFilter(cat)}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
              <div className="filter-search-mini">
                <span className="si">🔍</span>
                <input type="text" placeholder="Search accounts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>

            {filteredCategories.map(([key, cat]) => (
              <div key={key} className="category-block" style={key === "youtube" ? { marginBottom: 28 } : undefined}>
                <div className="category-header">
                  <div className="cat-head-left">
                    <div className="cat-platform-icon">{cat.catIcon}</div>
                    <div>
                      <div className="cat-title">{cat.catTitle}</div>
                      <div className="cat-tags">
                        {cat.catTags.map((t) => <span key={t} className="cat-tag">{t}</span>)}
                      </div>
                    </div>
                  </div>
                  <button className="cat-see-more" onClick={() => showToast(`Loading more ${key} accounts...`)}>See More →</button>
                </div>
                {cat.accounts
                  .filter((acc) => !searchQuery || acc.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((acc, i) => (
                    <div key={i} className="account-row">
                      <div className="acc-platform-icon">{cat.catIcon}</div>
                      <div className="acc-info">
                        <div className="acc-desc">{acc.desc}</div>
                        <div className="acc-meta">
                          {acc.tags.map((tag, j) => <span key={j} className={tagClass(tag.type)}>{tag.label}</span>)}
                        </div>
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
                      <button className="buy-btn" disabled={acc.stock === 0} onClick={() => acc.stock > 0 && openModal(`${key} Account`, acc.desc.split("·")[0], key.charAt(0).toUpperCase() + key.slice(1), acc.stock, acc.price)}>
                        <span>{acc.stock === 0 ? "Out of Stock" : "🛒 BUY"}</span>
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
                        <td style={{ fontFamily: "var(--font-d)", color: "var(--yellow)", fontSize: 15 }}>{o.id}</td>
                        <td><div className="order-name">{o.name}</div><div className="order-desc">{o.desc}</div></td>
                        <td><div className="order-platform"><span className="order-icon">{o.icon}</span>{o.platform}</div></td>
                        <td className="order-price">{o.price}</td>
                        <td style={{ color: "var(--muted)", fontSize: 12 }}>{o.date}</td>
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
                          {amt.replace(",000", "K").replace(",00", "")}
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
                  <button className="btn-submit-funds" onClick={() => showToast("✅ Support ticket submitted! We'll respond within 24hrs")}>Submit Ticket →</button>
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
                  <div style={{ marginTop: 20, padding: 16, background: "rgba(255,208,0,0.05)", border: "1px solid rgba(255,208,0,0.15)", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, color: "var(--yellow)", marginBottom: 8 }}>Response Times</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, fontWeight: 300 }}>
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
