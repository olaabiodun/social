import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import "../styles/dashboard.css";

type PanelName = "home" | "orders" | "profile" | "add-funds" | "support";

interface ModalData {
  title: string;
  desc: string;
  platform: string;
  stock: number;
  price: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  icon_url: string | null;
}

interface Product {
  id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  platform: string;
}

interface Order {
  id: string;
  product_title: string;
  product_platform: string;
  total_price: number;
  status: string;
  created_at: string;
}

// Static fallback data
const ACCOUNTS_DATA = [
  {
    category: "facebook",
    catTitle: "Random Country Facebook 🇬🇧 🇨🇱 🇩🇪",
    catEmoji: "",
    catIcon: "fa-brands fa-facebook",
    catTags: ["GB", "CL", "DE", "US"],
    items: [
      { desc: "High quality 🇩🇪 🇬🇧 🇨🇦 Facebook with 200-5,000 friends (sharp friends) Active marketplace, 90% has create profile Few has post", tags: [{ label: "High Quality", type: "quality" }], stock: 29, stockClass: "", price: "NGN 4,000.00", modalTitle: "Facebook Account", modalDesc: "High quality Facebook with 200–5,000 friends" },
      { desc: "2-10 YEARS OLD EUROPE 🇮🇹🇩🇪🇫🇷 FACEBOOK WITH HIGH FRIENDS Active marketplace 60% have create profile Few has Get started dating ❤️(NO 2FA)", tags: [{ label: "Europe", type: "region" }, { label: "No 2FA", type: "note" }], stock: 47, stockClass: "", price: "NGN 5,500.00", modalTitle: "Europe Facebook", modalDesc: "2–10 Years Old Europe Facebook with High Friends" },
      { desc: "facebook:2–15 High Quality 🇺🇸🇬🇧🇩🇪🇫🇷 🇨🇦 FACEBOOK ( 30-1k friend) many accounts here have create profile this quality is very sharp 💯💯", tags: [{ label: "Premium", type: "quality" }], stock: 33, stockClass: "", price: "NGN 5,500.00", modalTitle: "Facebook Premium", modalDesc: "High Quality Facebook 30-1K friends" },
    ],
  },
  {
    category: "tiktok",
    catTitle: "Country TIK tok",
    catEmoji: "",
    catIcon: "",
    catTags: ["VERIFIED", "AGED"],
    items: [
      { desc: "GERMANY 🇩🇪 TIKTOK 100+ FOLLOWERS (5+ Old posts) | Verified by (2fa | Mail ) (4yrs)", tags: [{ label: "Germany", type: "region" }, { label: "Verified", type: "quality" }], stock: 33, stockClass: "", price: "NGN 2,800.00", modalTitle: "Germany TikTok", modalDesc: "Germany TikTok 100+ Followers" },
      { desc: "Uk 🇬🇧 TIKTOK 100+ FOLLOWERS (5+ Old posts) | Verified by (2fa | Mail ) (4yrs)", tags: [{ label: "UK", type: "region" }, { label: "Verified", type: "quality" }], stock: 0, stockClass: "zero", price: "NGN 2,800.00", modalTitle: "UK TikTok", modalDesc: "UK TikTok 100+ Followers" },
      { desc: "CANADA 🇨🇦 TIKTOK 100+ FOLLOWERS (5+ Old posts) | Verified by (2fa | Mail ) (4yrs)", tags: [{ label: "Canada", type: "region" }, { label: "Verified", type: "quality" }], stock: 176, stockClass: "", price: "NGN 2,800.00", modalTitle: "Canada TikTok", modalDesc: "Canada TikTok 100+ Followers" },
      { desc: "FRANCE 🇫🇷 TIKTOK 100+ FOLLOWERS (5+ Old posts) | Verified by (2fa | Mail ) (4yrs)", tags: [{ label: "France", type: "region" }, { label: "Verified", type: "quality" }], stock: 251, stockClass: "", price: "NGN 2,800.00", modalTitle: "France TikTok", modalDesc: "France TikTok 100+ Followers" },
    ],
  },
  {
    category: "facebook-usa",
    catTitle: "USA 🇺🇸 FACEBOOK",
    catEmoji: "",
    catIcon: "fa-brands fa-facebook",
    catTags: ["USA", "PREMIUM"],
    items: [
      { desc: "4-6 YEARS USA 🇺🇸 faceb00k (100+ FRIENDS)(real+fake friendss mix) (sharp friends) (ALMOST ALL HAVE SWITCH PROFILE)", tags: [{ label: "USA", type: "region" }, { label: "4-6 Yrs", type: "age" }], stock: 10, stockClass: "low", price: "NGN 13,000.00", modalTitle: "USA Facebook", modalDesc: "4-6 Years USA Facebook 100+ Friends" },
    ],
  },
];

type NavSection = { label: string; type: "section" };
type NavLink = { label: string; icon: string; panel?: PanelName; action?: () => void; badge?: string; ext?: boolean };
type NavItem = NavSection | NavLink;

const NAV_ITEMS: NavItem[] = [
  { label: "Main", type: "section" },
  { label: "Home", icon: "fa-solid fa-house", panel: "home" },
  { label: "Profile", icon: "fa-solid fa-user", panel: "profile" },
  { label: "My Orders", icon: "fa-solid fa-box", panel: "orders" },
  { label: "Finance", type: "section" },
  { label: "Add Funds", icon: "fa-solid fa-credit-card", panel: "add-funds" },
  { label: "Manual Payments", icon: "fa-solid fa-money-bill", panel: "add-funds" },
  { label: "Info", type: "section" },
  { label: "Rules", icon: "fa-solid fa-file-lines", action: () => toast("Rules page coming soon") },
  { label: "Support", icon: "fa-solid fa-comments", panel: "support" },
];

const PANEL_TITLES: Record<PanelName, string> = {
  home: "Goodluckstore",
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

  // User data
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setEmail(user.email || "");

    // Load profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", user.id)
      .single();
    if (profile?.username) setUsername(profile.username);

    // Load wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();
    if (wallet) setBalance(Number(wallet.balance));

    // Load orders
    const { data: userOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (userOrders) setOrders(userOrders as Order[]);
  };

  const switchPanel = useCallback((panel: PanelName) => {
    setActivePanel(panel);
    setSidebarOpen(false);
  }, []);

  const filteredAccounts = ACCOUNTS_DATA.filter(
    (cat) => activeFilter === "all" || cat.category === activeFilter || cat.category.startsWith(activeFilter)
  );

  const filterBySearch = (desc: string) => {
    if (!searchQuery) return true;
    return desc.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const initials = username ? username.slice(0, 2).toUpperCase() : email ? email.slice(0, 2).toUpperCase() : "U";
  const formattedBalance = `NGN ${balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

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
              <span className="mdr-val" style={{ color: "hsl(220 70% 35%)" }}>{formattedBalance}</span>
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
            Goodluckstore
          </div>
        </div>

        <div className="sidebar-balance">
          <div>
            <div className="balance-label">Wallet Balance</div>
            <div className="balance-val">{balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</div>
            <div className="balance-currency">NGN</div>
          </div>
          <button className="add-funds-mini" onClick={() => switchPanel("add-funds")}>+</button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => {
            if ("type" in item && item.type === "section") {
              return <div key={i} className="nav-section-label">{item.label}</div>;
            }
            const nav = item as NavLink;
            return (
              <button
                key={i}
                className={`dash-nav-item ${nav.panel && activePanel === nav.panel ? "active" : ""}`}
                onClick={() => {
                  if (nav.panel) switchPanel(nav.panel);
                  else if (nav.action) nav.action();
                }}
              >
                <span className="nav-icon"><i className={nav.icon} /></span>
                {nav.label}
                {nav.badge && <span className="nav-badge">{nav.badge}</span>}
                {nav.ext && <span className="nav-ext"><i className="fa-solid fa-arrow-up-right-from-square" /></span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-row" onClick={() => switchPanel("profile")}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="uname">{username || "User"}</div>
              <div className="uemail">{email}</div>
            </div>
          </div>
          <button className="signout-btn" onClick={handleSignOut}>
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
            <input type="text" placeholder="Search for products or categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="topbar-right">
            <div className="topbar-balance" onClick={() => switchPanel("add-funds")}>
              <span className="bal-icon"><i className="fa-solid fa-wallet" /></span>
              <span className="bal-text">{formattedBalance}</span>
            </div>
            <div className="topbar-avatar" onClick={() => switchPanel("profile")}>{initials}</div>
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
                    <h2>Do Not Miss<br />Any <span>Update</span></h2>
                    <p>Join Our Telegram Group Today! Access premium accounts across all major platforms.</p>
                  </div>
                  <div className="welcome-right">
                    <div className="wstat"><div className="wstat-num">10K+</div><div className="wstat-label">Accounts</div></div>
                    <div className="wstat"><div className="wstat-num">98%</div><div className="wstat-label">Satisfied</div></div>
                  </div>
                </div>
              </div>

              {/* Mobile search bar */}
              <div className="mobile-search-section">
                <div className="mobile-search-wrap">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input type="text" placeholder="Search for products or categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="filter-row" style={{ padding: 0, marginTop: 12 }}>
                  <span className="filter-label">Popular:</span>
                  {[{ label: "Instagram", value: "instagram" }, { label: "TikTok", value: "tiktok" }, { label: "YouTube", value: "youtube" }, { label: "Twitter", value: "twitter" }].map((f) => (
                    <button key={f.value} className={`filter-pill ${activeFilter === f.value ? "active" : ""}`} onClick={() => setActiveFilter(f.value)}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-row desktop-filter-row">
                <span className="filter-label">Popular:</span>
                {[{ label: "All", value: "all" }, { label: "Instagram", value: "instagram" }, { label: "TikTok", value: "tiktok" }, { label: "YouTube", value: "youtube" }, { label: "Twitter", value: "twitter" }, { label: "Facebook", value: "facebook" }].map((f) => (
                  <button key={f.value} className={`filter-pill ${activeFilter === f.value ? "active" : ""}`} onClick={() => setActiveFilter(f.value)}>
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredAccounts.map((cat) => {
                const visibleItems = cat.items.filter((item) => filterBySearch(item.desc));
                if (visibleItems.length === 0) return null;
                return (
                  <div key={cat.category} className="category-block">
                    <div className="category-header">
                      <div className="cat-head-left">
                        <div className="cat-platform-icon">
                          {cat.catIcon ? <i className={cat.catIcon} /> : "🎵"}
                        </div>
                        <div>
                          <div className="cat-title">{cat.catTitle}</div>
                        </div>
                      </div>
                      <button className="cat-see-more" onClick={() => toast(`Loading more ${cat.catTitle}...`)}>See More →</button>
                    </div>
                    {visibleItems.map((item, j) => (
                      <div key={j} className="account-row">
                        <div className="acc-platform-icon">
                          {cat.catIcon ? <i className={cat.catIcon} /> : "🎵"}
                        </div>
                        <div className="acc-info">
                          <div className="acc-desc">{item.desc}</div>
                        </div>
                        <div className="acc-stock-price">
                          <div style={{ textAlign: "center" }}>
                            <div className="stock-label">Stock</div>
                            <div className={`stock-num ${item.stockClass}`}>{item.stock}</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div className="price-label">Price</div>
                            <div className="price-val">{item.price}</div>
                          </div>
                        </div>
                        {item.stock > 0 ? (
                          <button className="buy-btn" onClick={() => setModal({ title: item.modalTitle, desc: item.modalDesc, platform: cat.catTitle, stock: item.stock, price: item.price })}>
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
              {/* Recent Orders Section */}
              <div className="recent-orders-section">
                <div className="recent-orders-header">
                  <span className="recent-dot" /> RECENT ORDERS
                </div>
                <div className="recent-orders-table">
                  <div className="recent-orders-th">
                    <span>ITEM</span><span>TIME</span>
                  </div>
                  {[
                    { user: "Phoenix.", product: "PRIVATE PROXIES", price: "₦4,000", time: "10 minutes ago" },
                    { user: "Sage.", product: "MALE POF(NOT PAI...", price: "₦6,000", time: "Just now" },
                    { user: "Cameron.", product: "POF AGED ACCOUNT", price: "₦4,500", time: "25 minutes ago" },
                    { user: "Avery.", product: "DATACENTER PROXY", price: "₦3,500", time: "5 minutes ago" },
                  ].map((r, i) => (
                    <div key={i} className="recent-order-row">
                      <div className="recent-order-info">
                        <div><span className="recent-user">{r.user}</span> <span className="recent-bought">just bought</span></div>
                        <div className="recent-product">{r.product}</div>
                        <div className="recent-price">{r.price}</div>
                      </div>
                      <div className="recent-time">{r.time}</div>
                    </div>
                  ))}
                  <div className="recent-orders-footer">
                    <span className="recent-dot" /> Live updates · 5 recent orders
                  </div>
                </div>
              </div>

              <div style={{ height: 28 }} />
            </div>
          )}

          {/* ORDERS */}
          {activePanel === "orders" && (
            <div className="dash-panel">
              <div style={{ padding: "24px 24px 0" }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>My Orders</h2>
                <p style={{ fontSize: 14, color: "hsl(220 10% 50%)", marginBottom: 16 }}>View and manage your purchased accounts</p>
                <button className="btn-refresh" onClick={loadUserData}>
                  <i className="fa-solid fa-rotate" /> Refresh
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="orders-empty">
                  <div className="orders-empty-icon">🔒</div>
                  <h3>No Orders Yet</h3>
                  <p>You haven't made any purchases yet. Browse our collection of premium social media accounts to get started.</p>
                  <button className="btn-browse" onClick={() => switchPanel("home")}>
                    <i className="fa-solid fa-cart-shopping" /> Browse Products
                  </button>
                </div>
              ) : (
                <div className="orders-table-wrap">
                  <div className="table-container">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Order ID</th><th>Account</th><th>Platform</th><th>Price</th><th>Date</th><th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id}>
                            <td className="order-id">#{o.id.slice(0, 6)}</td>
                            <td><div className="order-name">{o.product_title}</div></td>
                            <td>{o.product_platform}</td>
                            <td className="order-price">NGN {Number(o.total_price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</td>
                            <td className="order-date">{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                            <td><span className={`status-pill status-${o.status}`}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROFILE */}
          {activePanel === "profile" && (
            <div className="dash-panel">
              <div className="profile-panel-inner">
                <div className="profile-form">
                  <div className="form-section-title">Profile Information</div>
                  <div className="form-grid">
                    <div className="form-group full">
                      <label className="form-label">Username</label>
                      <div className="dash-form-input" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <i className="fa-solid fa-user" style={{ color: "hsl(220 10% 50%)" }} />
                        {username || "—"}
                      </div>
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Email Address</label>
                      <div className="dash-form-input" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <i className="fa-solid fa-envelope" style={{ color: "hsl(220 10% 50%)" }} />
                        {email}
                      </div>
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Account Balance</label>
                      <div className="dash-form-input" style={{ display: "flex", alignItems: "center", gap: 10, background: "hsl(0 80% 55% / 0.06)", borderColor: "hsl(0 80% 55% / 0.15)" }}>
                        <i className="fa-solid fa-wallet" style={{ color: "hsl(0 80% 55%)" }} />
                        <span style={{ fontWeight: 700 }}>{formattedBalance}</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-section-title" style={{ marginTop: 28 }}>Change Password</div>
                  <p style={{ fontSize: 13, color: "hsl(220 10% 50%)", marginBottom: 20, marginTop: -10 }}>Update your password to keep your account secure</p>
                  <div className="form-grid">
                    <div className="form-group full">
                      <label className="form-label">Current Password</label>
                      <input type="password" className="dash-form-input" placeholder="Enter current password" />
                    </div>
                    <div className="form-group full">
                      <label className="form-label">New Password</label>
                      <input type="password" className="dash-form-input" placeholder="Enter new password" />
                      <span style={{ fontSize: 11, color: "hsl(220 10% 50%)", marginTop: 4, display: "block" }}>Password must be at least 8 characters long</span>
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Confirm New Password</label>
                      <input type="password" className="dash-form-input" placeholder="Confirm new password" />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn-save" onClick={() => toast.success("Password updated successfully!")}>Update Password</button>
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
                            {amt}
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
                      <div className="funds-card-title">Current Balance</div>
                      <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: "hsl(220 70% 25%)" }}>{formattedBalance}</div>
                        <div style={{ fontSize: 13, color: "hsl(220 10% 50%)", marginTop: 4 }}>Available Balance</div>
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
                    <button className="btn-submit-funds" onClick={() => toast.success("Support ticket submitted!")}>Submit Ticket →</button>
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
