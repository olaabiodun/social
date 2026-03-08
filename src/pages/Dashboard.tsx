import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import "../styles/dashboard.css";

type PanelName = "home" | "orders" | "profile" | "add-funds" | "support";

interface ModalData {
  title: string;
  desc: string;
  platform: string;
  stock: number;
  price: string;
}

const ACCOUNTS_DATA = [
  {
    category: "facebook",
    catTitle: "Random Country Facebook",
    catIcon: "fa-brands fa-facebook",
    catTags: ["GB", "CL", "DE", "US"],
    items: [
      { desc: "High quality Facebook with 200–5,000 friends (sharp friends) · Active marketplace · 90% have profile · Few posts", tags: [{ label: "High Quality", type: "quality" }, { label: "Intl", type: "region" }, { label: "Active Marketplace", type: "note" }], stock: 81, stockClass: "", price: "NGN 4,000", modalTitle: "Facebook Account", modalDesc: "High quality Facebook with 200–5,000 friends" },
      { desc: "2–10 Years Old Europe Facebook · HIGH FRIENDS · Active marketplace · 60% have profile · Get started dating ❤ (NO 2FA)", tags: [{ label: "2–10 Yrs Old", type: "age" }, { label: "Europe", type: "region" }, { label: "High Friends", type: "quality" }, { label: "No 2FA", type: "note" }], stock: 49, stockClass: "", price: "NGN 5,500", modalTitle: "Europe Facebook", modalDesc: "2–10 Years Old Europe Facebook with High Friends" },
      { desc: "Facebook 2–15 High Quality · 30–1K friends · Many accounts have profile · Quality is very sharp 💯", tags: [{ label: "Premium", type: "quality" }, { label: "2–15 Yrs", type: "age" }, { label: "Profile Complete", type: "note" }], stock: 0, stockClass: "zero", price: "NGN 5,500", modalTitle: "", modalDesc: "" },
    ],
  },
  {
    category: "instagram",
    catTitle: "Premium Instagram Accounts",
    catIcon: "fa-brands fa-instagram",
    catTags: ["VERIFIED", "10K+", "REAL"],
    items: [
      { desc: "Instagram Verified · 10K–50K Followers · High engagement · Business-ready · Email access included", tags: [{ label: "Verified ✓", type: "quality" }, { label: "Global", type: "region" }, { label: "Email Access", type: "note" }], stock: 34, stockClass: "", price: "NGN 8,500", modalTitle: "Instagram Account", modalDesc: "Verified Instagram with 10K–50K real followers" },
      { desc: "Instagram 100K+ Followers · USA/UK · Female niche · Lifestyle content · Original email available", tags: [{ label: "100K+", type: "quality" }, { label: "USA/UK", type: "region" }, { label: "Female Niche", type: "age" }], stock: 7, stockClass: "low", price: "NGN 22,000", modalTitle: "Instagram 100K+", modalDesc: "USA/UK Instagram with 100K+ real followers" },
    ],
  },
  {
    category: "tiktok",
    catTitle: "TikTok Accounts",
    catIcon: "",
    catEmoji: "🎵",
    catTags: ["AGED", "MONETIZED"],
    items: [
      { desc: "TikTok Monetized · 100K+ Followers · Aged 2+ years · Original email · Already has TikTok Shop access", tags: [{ label: "Monetized", type: "quality" }, { label: "2+ Yrs Old", type: "age" }, { label: "TikTok Shop", type: "note" }], stock: 22, stockClass: "", price: "NGN 15,000", modalTitle: "TikTok Monetized", modalDesc: "TikTok with 100K+ followers and monetization enabled" },
      { desc: "TikTok 250K+ Followers · Mixed niches · High engagement rate · Email + phone access · Clean account history", tags: [{ label: "250K+", type: "quality" }, { label: "Mixed Niche", type: "region" }, { label: "Clean History", type: "note" }], stock: 4, stockClass: "low", price: "NGN 35,000", modalTitle: "TikTok 250K+", modalDesc: "TikTok with 250K+ followers, mixed niches" },
    ],
  },
  {
    category: "youtube",
    catTitle: "YouTube Channels",
    catIcon: "",
    catEmoji: "▶️",
    catTags: ["MONETIZED", "AGED"],
    items: [
      { desc: "YouTube Monetized · 1K+ Subscribers · 4,000 watch hours · AdSense ready · Tech/Gaming niche", tags: [{ label: "Monetized", type: "quality" }, { label: "AdSense Ready", type: "age" }, { label: "Tech/Gaming", type: "note" }], stock: 18, stockClass: "", price: "NGN 12,000", modalTitle: "YouTube Channel", modalDesc: "Monetized YouTube channel with 1K+ subscribers" },
    ],
  },
];

const ORDERS = [
  { id: "#ORD001", name: "High Quality Facebook", desc: "200–5K Friends · Intl", icon: "fa-brands fa-facebook", platform: "Facebook", price: "NGN 4,000", date: "Mar 5, 2026", status: "completed" },
  { id: "#ORD002", name: "Instagram Verified", desc: "10K–50K Followers", icon: "fa-brands fa-instagram", platform: "Instagram", price: "NGN 8,500", date: "Mar 4, 2026", status: "completed" },
  { id: "#ORD003", name: "TikTok Monetized", desc: "100K+ · TikTok Shop", icon: "", emoji: "🎵", platform: "TikTok", price: "NGN 15,000", date: "Mar 6, 2026", status: "pending" },
  { id: "#ORD004", name: "YouTube Channel", desc: "1K Sub · Monetized", icon: "", emoji: "▶️", platform: "YouTube", price: "NGN 12,000", date: "Mar 6, 2026", status: "processing" },
  { id: "#ORD005", name: "Europe Facebook", desc: "2–10 Yrs · High Friends", icon: "fa-brands fa-facebook", platform: "Facebook", price: "NGN 5,500", date: "Feb 28, 2026", status: "completed" },
];

const TRANSACTIONS = [
  { name: "Wallet Top-Up", date: "Mar 5, 2026 · Bank Transfer", amount: "+NGN 20,000", type: "in", icon: "💰" },
  { name: "Purchase: Facebook Account", date: "Mar 5, 2026 · Order #ORD001", amount: "-NGN 4,000", type: "out", icon: "🛒" },
  { name: "Purchase: Instagram 10K+", date: "Mar 4, 2026 · Order #ORD002", amount: "-NGN 8,500", type: "out", icon: "🛒" },
  { name: "Wallet Top-Up", date: "Feb 28, 2026 · Crypto", amount: "+NGN 30,000", type: "in", icon: "💰" },
  { name: "Purchase: TikTok 100K", date: "Feb 28, 2026 · Order #ORD003", amount: "-NGN 15,000", type: "out", icon: "🛒" },
];

type NavSection = { label: string; type: "section" };
type NavLink = { label: string; icon: string; panel?: PanelName; action?: () => void; badge?: string; ext?: boolean };
type NavItem = NavSection | NavLink;

const NAV_ITEMS: NavItem[] = [
  { label: "Main", type: "section" },
  { label: "Home", icon: "fa-solid fa-house", panel: "home" },
  { label: "Profile", icon: "fa-solid fa-user", panel: "profile" },
  { label: "My Orders", icon: "fa-solid fa-box", panel: "orders", badge: "3" },
  { label: "Finance", type: "section" },
  { label: "Add Funds", icon: "fa-solid fa-credit-card", panel: "add-funds" },
  { label: "Manual Payments", icon: "fa-solid fa-money-bill", panel: "add-funds" },
  { label: "Info", type: "section" },
  { label: "Rules", icon: "fa-solid fa-file-lines", action: () => toast("Rules page coming soon") },
  { label: "Support", icon: "fa-solid fa-comments", panel: "support" },
  { label: "Buy Numbers", icon: "fa-solid fa-phone", action: () => toast("Buy Numbers feature coming soon"), ext: true },
];

const PANEL_TITLES: Record<PanelName, string> = {
  home: "Goodluck Store",
  profile: "My Profile",
  orders: "My Orders",
  "add-funds": "Add Funds",
  support: "Support Center",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<PanelName>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState<ModalData | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("NGN 5,000");
  const [selectedPayment, setSelectedPayment] = useState(0);

  const switchPanel = useCallback((panel: PanelName) => {
    setActivePanel(panel);
    setSidebarOpen(false);
  }, []);

  const filteredAccounts = ACCOUNTS_DATA.filter(
    (cat) => activeFilter === "all" || cat.category === activeFilter
  );

  const filterBySearch = (desc: string) => {
    if (!searchQuery) return true;
    return desc.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="dashboard-layout">
      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            <div style={{ marginBottom: 20 }}>
              <div className="modal-tag">Confirm Purchase</div>
              <h2 className="modal-title-text">{modal.title.toUpperCase()}</h2>
              <p className="modal-desc-text">{modal.desc}</p>
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
              <span className="mdr-val" style={{ color: "hsl(48 100% 50%)" }}>NGN 0.00</span>
            </div>
            <div className="modal-total">
              <span className="mt-label">Total Cost</span>
              <span className="mt-val">{modal.price}</span>
            </div>
            <button className="btn-confirm" onClick={() => { setModal(null); toast.success("Order placed! Check My Orders for status."); }}>
              Confirm Purchase →
            </button>
          </div>
        </div>
      )}

      {/* Sidebar overlay */}
      {sidebarOpen && <div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
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
          <button className="add-funds-mini" onClick={() => switchPanel("add-funds")}>+</button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => {
            if (item.type === "section") {
              return <div key={i} className="nav-section-label">{item.label}</div>;
            }
            return (
              <button
                key={i}
                className={`dash-nav-item ${item.panel && activePanel === item.panel ? "active" : ""}`}
                onClick={() => {
                  if (item.panel) switchPanel(item.panel);
                  else if (item.action) item.action();
                }}
              >
                <span className="nav-icon"><i className={item.icon} /></span>
                {item.label}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
                {item.ext && <span className="nav-ext"><i className="fa-solid fa-arrow-up-right-from-square" /></span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-row" onClick={() => switchPanel("profile")}>
            <div className="user-avatar">JD</div>
            <div className="user-info">
              <div className="uname">John Doe</div>
              <div className="uemail">john@example.com</div>
            </div>
          </div>
          <button className="signout-btn" onClick={() => { toast("Signing out..."); navigate("/auth"); }}>
            <i className="fa-solid fa-arrow-right-from-bracket" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="dash-main">
        {/* Topbar */}
        <div className="dash-topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span /><span /><span />
          </button>
          <div className="topbar-title">{PANEL_TITLES[activePanel]}</div>
          <div className="topbar-search">
            <span className="s-icon"><i className="fa-solid fa-magnifying-glass" /></span>
            <input type="text" placeholder="Search accounts, platforms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="topbar-right">
            <div className="topbar-balance" onClick={() => switchPanel("add-funds")}>
              <span className="bal-icon"><i className="fa-solid fa-wallet" /></span>
              <span className="bal-text">NGN 0.00</span>
            </div>
            <div className="notif-btn" onClick={() => toast("No new notifications")}>
              <i className="fa-solid fa-bell" />
              <div className="notif-dot" />
            </div>
            <div className="topbar-avatar" onClick={() => switchPanel("profile")}>JD</div>
          </div>
        </div>

        {/* Content */}
        <div className="dash-content">
          {/* HOME */}
          {activePanel === "home" && (
            <div className="dash-panel">
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
                {[{ label: "All", value: "all" }, { label: "Facebook", value: "facebook", icon: "fa-brands fa-facebook" }, { label: "Instagram", value: "instagram", icon: "fa-brands fa-instagram" }, { label: "TikTok", value: "tiktok", icon: "fa-brands fa-tiktok" }, { label: "YouTube", value: "youtube", icon: "fa-brands fa-youtube" }, { label: "Twitter", value: "twitter", icon: "fa-brands fa-twitter" }].map((f) => (
                  <button key={f.value} className={`filter-pill ${activeFilter === f.value ? "active" : ""}`} onClick={() => setActiveFilter(f.value)}>
                    {f.icon && <i className={f.icon} />} {f.label}
                  </button>
                ))}
                <div className="filter-search-mini">
                  <span className="si"><i className="fa-solid fa-magnifying-glass" /></span>
                  <input type="text" placeholder="Search accounts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>

              {filteredAccounts.map((cat) => {
                const visibleItems = cat.items.filter((item) => filterBySearch(item.desc));
                if (visibleItems.length === 0) return null;
                return (
                  <div key={cat.category} className="category-block">
                    <div className="category-header">
                      <div className="cat-head-left">
                        <div className="cat-platform-icon">
                          {cat.catIcon ? <i className={cat.catIcon} /> : (cat as any).catEmoji}
                        </div>
                        <div>
                          <div className="cat-title">{cat.catTitle}</div>
                          <div className="cat-tags">
                            {cat.catTags.map((t) => <span key={t} className="cat-tag">{t}</span>)}
                          </div>
                        </div>
                      </div>
                      <button className="cat-see-more" onClick={() => toast(`Loading more ${cat.catTitle}...`)}>See More →</button>
                    </div>
                    {visibleItems.map((item, j) => (
                      <div key={j} className="account-row">
                        <div className="acc-platform-icon">
                          {cat.catIcon ? <i className={cat.catIcon} /> : (cat as any).catEmoji}
                        </div>
                        <div className="acc-info">
                          <div className="acc-desc">{item.desc}</div>
                          <div className="acc-meta">
                            {item.tags.map((t, k) => (
                              <span key={k} className={`acc-tag tag-${t.type}`}>{t.label}</span>
                            ))}
                          </div>
                        </div>
                        <div className="acc-stock-price">
                          <div className="stock-block" style={{ textAlign: "center" }}>
                            <div className="stock-label">Stock</div>
                            <div className={`stock-num ${item.stockClass}`}>{item.stock}</div>
                          </div>
                          <div className="price-block" style={{ textAlign: "center" }}>
                            <div className="price-label">Price</div>
                            <div className="price-val">{item.price}</div>
                          </div>
                        </div>
                        {item.stock > 0 ? (
                          <button className="buy-btn" onClick={() => setModal({ title: item.modalTitle, desc: item.modalDesc, platform: cat.catTitle.split(" ").pop() || "", stock: item.stock, price: item.price })}>
                            <i className="fa-solid fa-cart-shopping" /> BUY
                          </button>
                        ) : (
                          <button className="buy-btn" disabled>Out of Stock</button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
              <div style={{ height: 28 }} />
            </div>
          )}

          {/* ORDERS */}
          {activePanel === "orders" && (
            <div className="dash-panel">
              <div className="stats-grid">
                {[
                  { icon: "📦", val: "12", label: "Total Orders", change: "+3 this month", up: true },
                  { icon: "✅", val: "9", label: "Completed", change: "75% rate", up: true },
                  { icon: "⏳", val: "2", label: "Pending", change: "Processing", up: false },
                  { icon: "💸", val: "47K", label: "Total Spent (NGN)", change: "This month", up: true },
                ].map((s, i) => (
                  <div key={i} className="stat-card">
                    <div className="stat-card-icon">{s.icon}</div>
                    <div className="stat-card-val">{s.val}</div>
                    <div className="stat-card-label">{s.label}</div>
                    <div className={`stat-card-change ${s.up ? "change-up" : "change-down"}`}>{s.change}</div>
                  </div>
                ))}
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
                      <tr>
                        <th>Order ID</th><th>Account</th><th>Platform</th><th>Price</th><th>Date</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ORDERS.map((o) => (
                        <tr key={o.id}>
                          <td className="order-id">{o.id}</td>
                          <td>
                            <div className="order-name">{o.name}</div>
                            <div className="order-desc">{o.desc}</div>
                          </td>
                          <td>
                            <div className="order-platform">
                              <span className="order-icon">{o.icon ? <i className={o.icon} /> : o.emoji}</span>
                              {o.platform}
                            </div>
                          </td>
                          <td className="order-price">{o.price}</td>
                          <td className="order-date">{o.date}</td>
                          <td><span className={`status-pill status-${o.status}`}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE */}
          {activePanel === "profile" && (
            <div className="dash-panel">
              <div className="profile-panel-inner">
                <div className="profile-card-top">
                  <div className="profile-avatar-big">JD</div>
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
                    <div className="form-group"><label className="form-label">First Name</label><input type="text" className="dash-form-input" defaultValue="John" /></div>
                    <div className="form-group"><label className="form-label">Last Name</label><input type="text" className="dash-form-input" defaultValue="Doe" /></div>
                    <div className="form-group full"><label className="form-label">Email Address</label><input type="email" className="dash-form-input" defaultValue="john.doe@example.com" /></div>
                    <div className="form-group"><label className="form-label">Phone Number</label><input type="tel" className="dash-form-input" placeholder="+234 000 000 0000" /></div>
                    <div className="form-group"><label className="form-label">Country</label><input type="text" className="dash-form-input" placeholder="Nigeria" /></div>
                  </div>
                  <div className="form-section-title" style={{ marginTop: 28 }}>Change Password</div>
                  <div className="form-grid">
                    <div className="form-group full"><label className="form-label">Current Password</label><input type="password" className="dash-form-input" placeholder="••••••••" /></div>
                    <div className="form-group"><label className="form-label">New Password</label><input type="password" className="dash-form-input" placeholder="••••••••" /></div>
                    <div className="form-group"><label className="form-label">Confirm Password</label><input type="password" className="dash-form-input" placeholder="••••••••" /></div>
                  </div>
                  <div className="form-actions">
                    <button className="btn-save" onClick={() => toast.success("Profile updated successfully!")}>Save Changes</button>
                    <button className="btn-cancel">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADD FUNDS */}
          {activePanel === "add-funds" && (
            <div className="dash-panel">
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
                          <button key={amt} className={`preset-btn ${selectedPreset === amt ? "selected" : ""}`} onClick={() => setSelectedPreset(amt)}>
                            {amt.replace(",000", "K").replace(",00", "K")}
                          </button>
                        ))}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Or Enter Custom Amount</label>
                        <input type="number" className="dash-form-input" placeholder="Enter amount in NGN" />
                      </div>
                      <div className="form-section-title" style={{ marginTop: 20 }}>Payment Method</div>
                      <div className="payment-methods">
                        {[
                          { icon: "🏦", name: "Bank Transfer", desc: "Direct bank deposit · Instant confirmation" },
                          { icon: "💳", name: "Card Payment", desc: "Visa / Mastercard · Secure checkout" },
                          { icon: "₿", name: "Cryptocurrency", desc: "BTC / ETH / USDT · Fast processing" },
                        ].map((pm, i) => (
                          <div key={i} className={`payment-method ${selectedPayment === i ? "selected" : ""}`} onClick={() => setSelectedPayment(i)}>
                            <span className="pm-icon">{pm.icon}</span>
                            <div><div className="pm-name">{pm.name}</div><div className="pm-desc">{pm.desc}</div></div>
                            <div className="pm-radio" />
                          </div>
                        ))}
                      </div>
                      <button className="btn-submit-funds" onClick={() => toast("Processing payment...")}>Proceed to Payment →</button>
                    </div>
                  </div>
                  <div>
                    <div className="funds-card">
                      <div className="funds-card-title">Transaction History</div>
                      <div className="trans-list">
                        {TRANSACTIONS.map((t, i) => (
                          <div key={i} className="trans-item">
                            <div className={`trans-icon ${t.type}`}>{t.icon}</div>
                            <div className="trans-desc">
                              <div className="trans-name">{t.name}</div>
                              <div className="trans-date">{t.date}</div>
                            </div>
                            <div className={`trans-amount ${t.type}`}>{t.amount}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUPPORT */}
          {activePanel === "support" && (
            <div className="dash-panel">
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
                  ].map((t, i) => (
                    <div key={i} className="topic-card" onClick={() => toast(`Loading ${t.name.toLowerCase()} support...`)}>
                      <div className="topic-icon">{t.icon}</div>
                      <div className="topic-name">{t.name}</div>
                      <div className="topic-sub">{t.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="support-grid">
                  <div className="funds-card">
                    <div className="funds-card-title">Send a Message</div>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="form-label">Subject</label>
                      <input type="text" className="dash-form-input" placeholder="Brief description of your issue" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="form-label">Order ID (optional)</label>
                      <input type="text" className="dash-form-input" placeholder="#ORD000" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 20 }}>
                      <label className="form-label">Message</label>
                      <textarea className="dash-form-input" placeholder="Describe your issue in detail..." />
                    </div>
                    <button className="btn-submit-funds" onClick={() => toast.success("Support ticket submitted! We'll respond within 24hrs")}>Submit Ticket →</button>
                  </div>
                  <div className="funds-card">
                    <div className="funds-card-title">Quick Contact</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        { icon: "💬", name: "Telegram Support", desc: "Usually replies in minutes" },
                        { icon: "📧", name: "Email Support", desc: "support@goodluckstore.com" },
                        { icon: "🌐", name: "Live Chat", desc: "Available 24/7 online" },
                      ].map((c, i) => (
                        <div key={i} className="payment-method" onClick={() => toast(`Opening ${c.name.toLowerCase()}...`)}>
                          <span className="pm-icon">{c.icon}</span>
                          <div><div className="pm-name">{c.name}</div><div className="pm-desc">{c.desc}</div></div>
                        </div>
                      ))}
                    </div>
                    <div className="response-times-box">
                      <div className="response-times-title">Response Times</div>
                      <div className="response-times-body">
                        🟢 Telegram: ~5 minutes<br />
                        🟡 Live Chat: ~15 minutes<br />
                        🔵 Email: ~24 hours
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
