import { useState, useCallback, useEffect, useRef } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import "../styles/dashboard.css";

type PanelName = "home" | "orders" | "profile" | "add-funds" | "manual-payments" | "support" | "categories" | "messages";

interface ModalData {
  title: string;
  desc: string;
  platform: string;
  stock: number;
  price: string;
  product_id?: string;
  priceNum?: number;
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
  currency: string;
  image_url: string | null;
}

interface Order {
  id: string;
  product_title: string;
  product_platform: string;
  total_price: number;
  status: string;
  created_at: string;
  account_details: string | null;
}

interface Message {
  id: string;
  order_id: string | null;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

type NavSection = { label: string; type: "section" };
type NavLink = { label: string; icon: string; panel?: PanelName; action?: () => void; badge?: string; ext?: boolean };
type NavItem = NavSection | NavLink;

const NAV_ITEMS: NavItem[] = [
  { label: "Main", type: "section" },
  { label: "Home", icon: "fa-solid fa-house", panel: "home" },
  { label: "Categories", icon: "fa-solid fa-layer-group", panel: "categories" },
  { label: "Profile", icon: "fa-solid fa-user", panel: "profile" },
  { label: "My Orders", icon: "fa-solid fa-box", panel: "orders" },
  { label: "Messages", icon: "fa-solid fa-envelope", panel: "messages" },
  { label: "Finance", type: "section" },
  { label: "Add Funds", icon: "fa-solid fa-credit-card", panel: "add-funds" },
  { label: "Manual Payments", icon: "fa-solid fa-money-bill", panel: "manual-payments" },
  { label: "Info", type: "section" },
  { label: "Rules", icon: "fa-solid fa-file-lines", panel: undefined as unknown as PanelName },
  { label: "Support", icon: "fa-solid fa-comments", panel: "support" },
];

const PANEL_TITLES: Record<PanelName, string> = {
  home: "VerifiedStore",
  categories: "Categories",
  profile: "My Profile",
  orders: "My Orders",
  "add-funds": "Add Funds",
  "manual-payments": "Manual Payments",
  support: "Support Center",
  messages: "Messages",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<PanelName>("home");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState<ModalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("NGN 5,000");
  const [selectedPayment, setSelectedPayment] = useState(0);

  // User data
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [userId, setUserId] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAdmin } = useAdminCheck();

  // Scroll animation
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("slide-visible");
      }),
      { threshold: 0.1 }
    );
    const elements = document.querySelectorAll(".slide-from-left, .slide-from-right");
    elements.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [activePanel, selectedCategory, dbProducts]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setEmail(user.email || "");
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", user.id)
      .single();
    if (profile?.username) setUsername(profile.username);

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();
    if (wallet) setBalance(Number(wallet.balance));

    const { data: userOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (userOrders) setOrders(userOrders as Order[]);

    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (cats) setDbCategories(cats as Category[]);

    const { data: prods } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true);
    if (prods) setDbProducts(prods as Product[]);

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });
    if (msgs) {
      setMessages(msgs as Message[]);
      setUnreadCount((msgs as Message[]).filter(m => m.receiver_id === user.id && !m.is_read).length);
    }
  };

  // Realtime messages
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('user-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === userId || msg.receiver_id === userId) {
          setMessages(prev => [...prev, msg]);
          if (msg.receiver_id === userId) setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const sendMessage = async (orderId?: string) => {
    if (!msgInput.trim() || !userId) return;
    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: "00000000-0000-0000-0000-000000000000",
      content: msgInput.trim(),
      order_id: orderId || null,
    });
    if (error) {
      toast.error("Failed to send message");
    } else {
      setMsgInput("");
      toast.success("Message sent!");
    }
  };

  const switchPanel = useCallback((panel: PanelName) => {
    setActivePanel(panel);
    setSidebarOpen(false);
    setSelectedCategory(null);
  }, []);

  const getProductsForCategory = (catId: string) => dbProducts.filter(p => p.category_id === catId);

  const platformIconMap: Record<string, string> = {
    Facebook: "fa-brands fa-facebook", Instagram: "fa-brands fa-instagram",
    TikTok: "fa-brands fa-tiktok", "Twitter/X": "fa-brands fa-x-twitter",
    YouTube: "fa-brands fa-youtube", Snapchat: "fa-brands fa-snapchat",
    LinkedIn: "fa-brands fa-linkedin", Discord: "fa-brands fa-discord",
    Gmail: "fa-brands fa-google", Telegram: "fa-brands fa-telegram",
  };
  const getCatIcon = (cat: Category) => {
    const prods = getProductsForCategory(cat.id);
    if (prods.length > 0 && platformIconMap[prods[0].platform]) return platformIconMap[prods[0].platform];
    return "";
  };

  const getProductImage = (product: Product, cat?: Category | null) => {
    if (product.image_url) {
      return <img src={product.image_url} alt={product.title} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />;
    }
    if (platformIconMap[product.platform]) {
      return <i className={platformIconMap[product.platform]} />;
    }
    return <span>{cat?.emoji || "📦"}</span>;
  };

  const filteredDbCategories = dbCategories.filter(cat => {
    if (activeFilter === "all") return true;
    const prods = getProductsForCategory(cat.id);
    return prods.some(p => p.platform.toLowerCase().includes(activeFilter));
  });

  const filterBySearch = (text: string) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
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
              <span className="mdr-val" style={{ color: (modal.priceNum && balance < modal.priceNum) ? "hsl(0 70% 50%)" : "hsl(220 70% 35%)" }}>{formattedBalance}</span>
            </div>
            {modal.priceNum && balance < modal.priceNum && (
              <div style={{ color: "hsl(0 70% 50%)", fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
                ⚠️ Insufficient balance. Please add funds first.
              </div>
            )}
            <div className="modal-total">
              <span className="mt-label">Total Cost</span>
              <span className="mt-val">{modal.price}</span>
            </div>
            <button
              className={`btn-confirm${loading ? " loading" : ""}`}
              disabled={loading}
              onClick={async () => {
                if (!modal.product_id) {
                  toast.error("This product is not available for purchase yet.");
                  return;
                }
                const priceNum = modal.priceNum || 0;
                if (balance < priceNum) {
                  toast.error("Insufficient balance. Please add funds first.");
                  return;
                }
                setLoading(true);
                try {
                  const { data, error } = await supabase.functions.invoke("purchase", {
                    body: { product_id: modal.product_id, quantity: 1 },
                  });
                  if (error) {
                    toast.error("Purchase failed. Please try again.");
                  } else if (!data?.success) {
                    toast.error(data?.error || "Purchase failed");
                  } else {
                    toast.success("✅ Purchase successful! Check My Orders.");
                    setBalance(data.new_balance);
                    await loadUserData();
                  }
                } catch (e: any) {
                  toast.error("Purchase failed. Please try again.");
                }
                setLoading(false);
                setModal(null);
              }}
            >
              {loading ? "Processing..." : "Confirm Purchase →"}
            </button>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {rulesOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setRulesOpen(false); }}>
          <div className="modal rules-modal">
            <button className="modal-close" onClick={() => setRulesOpen(false)}>✕</button>
            <div className="rules-header">
              <div className="rules-icon">📋</div>
              <h2 className="modal-title-text">RULES & GUIDELINES</h2>
              <p className="modal-desc-text">Please read carefully before using purchased accounts</p>
            </div>

            <div className="rules-section">
              <div className="rules-section-icon">🌐</div>
              <div>
                <h3 className="rules-section-title">Change of UserAgent</h3>
                <p className="rules-section-text">Change of UserAgent in the browser and other actions with the browser. Use special browsers that change device fingerprints automatically.</p>
              </div>
            </div>

            <div className="rules-section">
              <div className="rules-section-icon">⏱️</div>
              <div>
                <h3 className="rules-section-title">Observe Limits</h3>
                <p className="rules-section-text">Observe limits and conduct human-like activities. Avoid mass actions immediately after purchase.</p>
              </div>
            </div>

            <div className="rules-section warning">
              <div className="rules-section-icon">⚠️</div>
              <div>
                <h3 className="rules-section-title">Problem</h3>
                <p className="rules-section-text">If you immediately start actively working with accounts (mass likes, mass messaging, etc.), your accounts can be quickly blocked.</p>
              </div>
            </div>

            <div className="rules-section success">
              <div className="rules-section-icon">✅</div>
              <div>
                <h3 className="rules-section-title">Solution</h3>
                <p className="rules-section-text">For safe work with accounts, it is recommended to first perform some of the usual actions that a real user usually does when registering.</p>
              </div>
            </div>

            <div className="rules-section">
              <div className="rules-section-icon">💡</div>
              <div>
                <h3 className="rules-section-title">Example</h3>
                <p className="rules-section-text">Fill out a profile, subscribe to several users, leave a few likes, add a few photos, make reposts, comments, etc.</p>
              </div>
            </div>

            <div className="rules-disclaimer">
              <strong>Important:</strong> We are not responsible for developers of programs, services and proxy providers. All accounts registered by us or our partners are created using private software and proxy servers not available to the public.
            </div>
            <div className="rules-disclaimer" style={{ marginTop: 8 }}>
              By using our services, you agree to comply with all rules and regulations. Violation may result in account suspension or permanent ban without refund.
            </div>

            <button className="btn-confirm" onClick={() => setRulesOpen(false)}>
              I Understand & Close
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
            <div className="logo-icon">V</div>
            VerifiedStore
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
                className={`dash-nav-item ${nav.panel && activePanel === nav.panel && !selectedCategory ? "active" : ""}`}
                onClick={() => {
                  if (nav.label === "Rules") { setRulesOpen(true); setSidebarOpen(false); }
                  else if (nav.panel) switchPanel(nav.panel);
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

          {isAdmin && (
            <>
              <div className="nav-section-label">Admin</div>
              <button className="dash-nav-item" onClick={() => navigate("/admin")}>
                <span className="nav-icon"><i className="fa-solid fa-shield-halved" /></span>
                Admin Panel
              </button>
            </>
          )}
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
          {/* CATEGORY DETAIL */}
          {activePanel === "home" && selectedCategory && (
            <div className="dash-panel">
              <div className="category-breadcrumb">
                <span className="breadcrumb-link" onClick={() => { setSelectedCategory(null); setActivePanel("home"); }}>Dashboard</span>
                <span className="breadcrumb-sep">›</span>
                <span className="breadcrumb-link" onClick={() => { setSelectedCategory(null); setActivePanel("categories"); }}>Categories</span>
                <span className="breadcrumb-sep">›</span>
                <span className="breadcrumb-current">{selectedCategory.name.toUpperCase()}</span>
              </div>

              <div className="category-banner">
                <div className="category-banner-icon">
                  {getCatIcon(selectedCategory) ? <i className={getCatIcon(selectedCategory)} /> : (selectedCategory.emoji || "📦")}
                </div>
                <div>
                  <h2 className="category-banner-title">{selectedCategory.name.toUpperCase()}</h2>
                  <p className="category-banner-count">{getProductsForCategory(selectedCategory.id).length} products available</p>
                </div>
              </div>

              <div className="category-detail-list">
                {getProductsForCategory(selectedCategory.id).filter(p => filterBySearch(p.title + p.description)).map((product, idx) => (
                  <div key={product.id} className={`account-row ${idx % 2 === 0 ? "slide-from-left" : "slide-from-right"}`}>
                    <div className="acc-platform-icon">
                      {getProductImage(product, selectedCategory)}
                    </div>
                    <div className="acc-info">
                      <div className="acc-desc-title">{product.title}</div>
                      <div className="acc-desc" style={{ WebkitLineClamp: 'unset', display: 'block' }}>{product.description}</div>
                    </div>
                    <div className="acc-stock-price">
                      <div style={{ textAlign: "center" }}>
                        <div className="stock-label">Stock</div>
                        <div className={`stock-num ${product.stock === 0 ? "zero" : product.stock < 10 ? "low" : ""}`}>{product.stock}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div className="price-label">Price</div>
                        <div className="price-val">{product.currency} {product.price.toLocaleString("en-NG")}</div>
                      </div>
                    </div>
                    {product.stock > 0 ? (
                      <button className="buy-btn" onClick={() => setModal({ title: product.title, desc: product.description, platform: product.platform, stock: product.stock, price: `${product.currency} ${product.price.toLocaleString("en-NG")}`, product_id: product.id, priceNum: product.price })}>
                        <i className="fa-solid fa-cart-shopping" /> BUY
                      </button>
                    ) : (
                      <button className="buy-btn" disabled>Out of Stock</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORIES */}
          {activePanel === "categories" && (
            <div className="dash-panel">
              <div className="category-breadcrumb">
                <span className="breadcrumb-link" onClick={() => setActivePanel("home")}>Dashboard</span>
                <span className="breadcrumb-sep">›</span>
                <span className="breadcrumb-current">Categories</span>
              </div>

              <div className="categories-search-wrap">
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
              </div>

              <div className="categories-grid">
                {dbCategories
                  .filter((cat) => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                  .map((cat) => (
                    <div
                      key={cat.id}
                      className="category-card"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setActivePanel("home");
                        setCategorySearch("");
                      }}
                    >
                      <div className="category-card-icon">
                        {getCatIcon(cat) ? <i className={getCatIcon(cat)} /> : (cat.emoji || "📦")}
                      </div>
                      <div className="category-card-title">{cat.name}</div>
                      <div className="category-card-count">{getProductsForCategory(cat.id).length} products</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* HOME */}
          {activePanel === "home" && !selectedCategory && (
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

              {filteredDbCategories.map((cat) => {
                const prods = getProductsForCategory(cat.id).filter(p => filterBySearch(p.title + p.description));
                if (prods.length === 0) return null;
                const icon = getCatIcon(cat);
                return (
                  <div key={cat.id} className="category-block">
                    <div className="category-header">
                      <div className="cat-head-left">
                        <div className="cat-platform-icon">
                          {icon ? <i className={icon} /> : (cat.emoji || "📦")}
                        </div>
                        <div>
                          <div className="cat-title">{cat.name}</div>
                        </div>
                      </div>
                      <button className="cat-see-more" onClick={() => setSelectedCategory(cat)}>See More →</button>
                    </div>
                    {prods.map((product, idx) => (
                      <div key={product.id} className={`account-row ${idx % 2 === 0 ? "slide-from-left" : "slide-from-right"}`}>
                        <div className="acc-platform-icon">
                          {getProductImage(product, cat)}
                        </div>
                        <div className="acc-info">
                          <div className="acc-desc-title">{product.title}</div>
                          <div className="acc-desc">{product.description}</div>
                        </div>
                        <div className="acc-stock-price">
                          <div style={{ textAlign: "center" }}>
                            <div className="stock-label">Stock</div>
                            <div className={`stock-num ${product.stock === 0 ? "zero" : product.stock < 10 ? "low" : ""}`}>{product.stock}</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div className="price-label">Price</div>
                            <div className="price-val">{product.currency} {product.price.toLocaleString("en-NG")}</div>
                          </div>
                        </div>
                        {product.stock > 0 ? (
                          <button className="buy-btn" onClick={() => setModal({ title: product.title, desc: product.description, platform: product.platform, stock: product.stock, price: `${product.currency} ${product.price.toLocaleString("en-NG")}`, product_id: product.id, priceNum: product.price })}>
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

          {/* MANUAL PAYMENTS */}
          {activePanel === "manual-payments" && (
            <div className="dash-panel">
              <div className="funds-panel">
                <div className="section-header" style={{ padding: "0 0 20px" }}>
                  <div className="section-head-left">
                    <div className="section-hl" />
                    <span className="section-title">Manual Payments</span>
                  </div>
                </div>
                <div className="funds-grid">
                  <div>
                    <div className="funds-card">
                      <div className="funds-card-title">Bank Transfer Details</div>
                      <p style={{ fontSize: 13, color: "hsl(220 10% 50%)", marginBottom: 16 }}>Send payment to any of the accounts below and submit proof of payment</p>

                      <div className="manual-bank-card">
                        <div className="manual-bank-name">🏦 First Bank of Nigeria</div>
                        <div className="manual-bank-detail"><span>Account Name:</span> <strong>VerifiedStore Ltd</strong></div>
                        <div className="manual-bank-detail"><span>Account Number:</span> <strong>0123456789</strong></div>
                      </div>

                      <div className="manual-bank-card">
                        <div className="manual-bank-name">🏦 GTBank</div>
                        <div className="manual-bank-detail"><span>Account Name:</span> <strong>VerifiedStore Ltd</strong></div>
                        <div className="manual-bank-detail"><span>Account Number:</span> <strong>9876543210</strong></div>
                      </div>

                      <div className="manual-bank-card">
                        <div className="manual-bank-name">₿ Cryptocurrency</div>
                        <div className="manual-bank-detail"><span>BTC:</span> <strong style={{ fontSize: 11, wordBreak: "break-all" }}>bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</strong></div>
                        <div className="manual-bank-detail"><span>USDT (TRC20):</span> <strong style={{ fontSize: 11, wordBreak: "break-all" }}>TN7x3fKr8oPcEqS5...</strong></div>
                      </div>

                      <div className="form-section-title" style={{ marginTop: 20 }}>Submit Proof of Payment</div>
                      <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label">Amount Sent (NGN)</label>
                        <input type="number" className="dash-form-input" placeholder="e.g. 5000" />
                      </div>
                      <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label">Transaction Reference</label>
                        <input type="text" className="dash-form-input" placeholder="Bank reference or TX hash" />
                      </div>
                      <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label">Payment Method Used</label>
                        <select className="dash-form-input">
                          <option>Bank Transfer - First Bank</option>
                          <option>Bank Transfer - GTBank</option>
                          <option>Cryptocurrency - BTC</option>
                          <option>Cryptocurrency - USDT</option>
                        </select>
                      </div>
                      <button className="btn-submit-funds" onClick={() => toast.success("Payment proof submitted! We'll verify within 30 minutes.")}>Submit Payment Proof →</button>
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
                    <div className="funds-card" style={{ marginTop: 16 }}>
                      <div className="funds-card-title">⏳ Processing Times</div>
                      <div className="manual-bank-detail"><span>Bank Transfer:</span> <strong>15-30 minutes</strong></div>
                      <div className="manual-bank-detail"><span>Cryptocurrency:</span> <strong>5-15 minutes</strong></div>
                      <div style={{ fontSize: 12, color: "hsl(220 10% 50%)", marginTop: 12 }}>Payments are verified manually. Contact support if not credited within 1 hour.</div>
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
                        { icon: "📧", name: "Email Support", desc: "support@verifiedstore.com" },
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

          {/* MESSAGES */}
          {activePanel === "messages" && (
            <div className="dash-panel">
              <div style={{ padding: "24px 24px 0" }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Messages</h2>
                <p style={{ fontSize: 14, color: "hsl(220 10% 50%)", marginBottom: 16 }}>Chat with support about your orders</p>
              </div>

              <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "hsl(220 20% 97%)", borderRadius: 12, padding: 16, minHeight: 300, maxHeight: 500, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: "center", color: "hsl(220 10% 60%)", padding: 40 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                      <p>No messages yet. Send a message to get started!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: msg.sender_id === userId ? "flex-end" : "flex-start",
                          background: msg.sender_id === userId ? "hsl(220 70% 50%)" : "hsl(0 0% 100%)",
                          color: msg.sender_id === userId ? "white" : "hsl(220 20% 20%)",
                          padding: "10px 16px",
                          borderRadius: 12,
                          maxWidth: "75%",
                          fontSize: 14,
                          boxShadow: "0 1px 3px hsl(0 0% 0% / 0.08)",
                        }}
                      >
                        <div>{msg.content}</div>
                        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                          {new Date(msg.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          {msg.sender_id !== userId && " · Admin"}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    className="dash-form-input"
                    placeholder="Type your message..."
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                    style={{ flex: 1 }}
                  />
                  <button className="btn-save" onClick={() => sendMessage()} style={{ whiteSpace: "nowrap" }}>
                    Send <i className="fa-solid fa-paper-plane" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
