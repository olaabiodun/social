import { useState, useCallback, useEffect, useRef } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductSkeleton, CategorySkeleton, ProductGridSkeleton, CategoryGridSkeleton } from "@/components/Skeleton";
import "../styles/dashboard.css";

type PanelName = "smm" | "home" | "orders" | "profile" | "add-funds" | "manual-payments" | "support" | "categories";

interface SMMService {
  id: string;
  name: string;
  platform: string;
  type: "likes" | "followers" | "comments" | "views" | "shares";
  icon: string;
  price: number;
  quantity: number;
  delivery_time: string;
  description: string;
  popular?: boolean;
}

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
  image_url: string | null;
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
  { label: "Home", icon: "fa-solid fa-house", panel: "home" },
  { label: "Categories", icon: "fa-solid fa-layer-group", panel: "categories" },
  { label: "Profile", icon: "fa-solid fa-user", panel: "profile" },
  { label: "My Orders", icon: "fa-solid fa-box", panel: "orders" },
  { label: "Add Funds", icon: "fa-solid fa-credit-card", panel: "add-funds" },
  { label: "Manual Payments", icon: "fa-solid fa-money-bill", panel: "manual-payments" },
  { label: "Rules", icon: "fa-solid fa-file-lines", panel: undefined as unknown as PanelName },
  { label: "Support", icon: "fa-solid fa-headset", panel: "support" },
];

const PANEL_TITLES: Record<PanelName, string> = {
  smm: "SMM Services",
  home: "Social store",
  categories: "Categories",
  profile: "My Profile",
  orders: "My Orders",
  "add-funds": "Add Funds",
  "manual-payments": "Manual Payments",
  support: "Support Center",
};

// SMM Services Database
const SMM_SERVICES: SMMService[] = [
  {
    id: "ig-likes-1k",
    name: "Instagram Likes Package",
    platform: "Instagram",
    type: "likes",
    icon: "fa-brands fa-instagram",
    price: 2500,
    quantity: 1000,
    delivery_time: "1-24 hours",
    description: "Get 1000 real-looking Instagram likes to boost your engagement",
    popular: true,
  },
  {
    id: "tiktok-views-10k",
    name: "TikTok Views Boost",
    platform: "TikTok",
    type: "views",
    icon: "fa-brands fa-tiktok",
    price: 3000,
    quantity: 10000,
    delivery_time: "2-12 hours",
    description: "Increase video visibility with 10,000 high-quality views",
    popular: true,
  },
  {
    id: "yt-subs-500",
    name: "YouTube Subscribers",
    platform: "YouTube",
    type: "followers",
    icon: "fa-brands fa-youtube",
    price: 8000,
    quantity: 500,
    delivery_time: "24-48 hours",
    description: "Grow your YouTube channel with 500 real subscribers",
  },
  {
    id: "fb-likes-5k",
    name: "Facebook Likes Bundle",
    platform: "Facebook",
    type: "likes",
    icon: "fa-brands fa-facebook",
    price: 4500,
    quantity: 5000,
    delivery_time: "1-12 hours",
    description: "Get 5000 likes on your Facebook posts",
  },
  {
    id: "ig-followers-1k",
    name: "Instagram Followers",
    platform: "Instagram",
    type: "followers",
    icon: "fa-brands fa-instagram",
    price: 7500,
    quantity: 1000,
    delivery_time: "12-48 hours",
    description: "Gain 1000 followers to increase your profile authority",
    popular: true,
  },
  {
    id: "tiktok-likes-50k",
    name: "TikTok Likes Mega Pack",
    platform: "TikTok",
    type: "likes",
    icon: "fa-brands fa-tiktok",
    price: 15000,
    quantity: 50000,
    delivery_time: "2-24 hours",
    description: "Skyrocket engagement with 50,000 TikTok likes",
  },
  {
    id: "twitter-followers-500",
    name: "Twitter/X Followers",
    platform: "Twitter/X",
    type: "followers",
    icon: "fa-brands fa-x-twitter",
    price: 5000,
    quantity: 500,
    delivery_time: "24-72 hours",
    description: "Build authority with 500 quality Twitter followers",
  },
  {
    id: "ig-comments-500",
    name: "Instagram Comments",
    platform: "Instagram",
    type: "comments",
    icon: "fa-brands fa-instagram",
    price: 3500,
    quantity: 500,
    delivery_time: "2-12 hours",
    description: "Get 500 meaningful comments on your Instagram posts",
  },
  {
    id: "youtube-views-100k",
    name: "YouTube Views Pro",
    platform: "YouTube",
    type: "views",
    icon: "fa-brands fa-youtube",
    price: 12000,
    quantity: 100000,
    delivery_time: "12-48 hours",
    description: "Boost video credibility with 100,000 views",
  },
  {
    id: "fb-shares-2k",
    name: "Facebook Shares Pack",
    platform: "Facebook",
    type: "shares",
    icon: "fa-brands fa-facebook",
    price: 6000,
    quantity: 2000,
    delivery_time: "4-24 hours",
    description: "Increase reach with 2000 shares on your content",
  },
  {
    id: "ig-likes-5k",
    name: "Instagram Likes Pro",
    platform: "Instagram",
    type: "likes",
    icon: "fa-brands fa-instagram",
    price: 11000,
    quantity: 5000,
    delivery_time: "1-12 hours",
    description: "Premium package with 5000 high-quality likes",
  },
  {
    id: "tiktok-followers-2k",
    name: "TikTok Followers Bundle",
    platform: "TikTok",
    type: "followers",
    icon: "fa-brands fa-tiktok",
    price: 18000,
    quantity: 2000,
    delivery_time: "24-72 hours",
    description: "Reach TikTok fame with 2000 quality followers",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<PanelName>("smm"); // SMM as default
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState<ModalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [renderKey, setRenderKey] = useState(0);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [boughtAccounts, setBoughtAccounts] = useState<{ login: string, password: string, description?: string }[] | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("NGN 5,000");
  const [selectedPayment, setSelectedPayment] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [fundSuccess, setFundSuccess] = useState(false);
  const [fundAmount, setFundAmount] = useState(0);
  const [payLoading, setPayLoading] = useState(false);
  const [manualPayAmount, setManualPayAmount] = useState("");
  const [manualPayRef, setManualPayRef] = useState("");
  const [manualPayMethod, setManualPayMethod] = useState("");
  const [userManualPayments, setUserManualPayments] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [viewingOrderLogs, setViewingOrderLogs] = useState<any[] | null>(null);
  const [viewingOrderTitle, setViewingOrderTitle] = useState("");
  const [supportChatOpen, setSupportChatOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({
    telegram_group: "https://t.me/social_store_group",
    telegram_support: "https://t.me/social_store_support",
    whatsapp_channel: "https://wa.me/social_store_channel"
  });

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // SMM Cart state
  const [smmCart, setSmmCart] = useState<{ service: SMMService, quantity: number }[]>([]);
  const [smmSearchQuery, setSmmSearchQuery] = useState("");
  const [smmPlatformFilter, setSmmPlatformFilter] = useState("all");

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
  const [recentFeed, setRecentFeed] = useState<any[]>([]);
  const { isAdmin } = useAdminCheck();

  // Scroll animation
  useEffect(() => {
    let obs: IntersectionObserver | null = null;
    const timer = setTimeout(() => {
      obs = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("slide-visible");
        }),
        { threshold: 0.05, rootMargin: "0px 0px 100px 0px" }
      );
      const elements = document.querySelectorAll(".slide-from-left, .slide-from-right");
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (inView) {
          el.classList.add("slide-visible");
        } else {
          obs!.observe(el);
        }
      });
    }, 200);
    return () => {
      clearTimeout(timer);
      if (obs) obs.disconnect();
    };
  }, [activePanel, selectedCategory, dbProducts, dataLoading, renderKey, activeFilter, searchQuery]);

  useEffect(() => {
    loadUserData().then(async () => {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      const payment = params.get("payment");
      if (ref && payment === "success") {
        window.history.replaceState({}, '', '/dashboard');
        try {
          const SPRINT_API_KEY = import.meta.env.VITE_SPRINTPAY_API_KEY || "";
          const verifyRes = await fetch(
            `https://web.sprintpay.online/api/verify-transaction?ref=${ref}&apikey=${SPRINT_API_KEY}`
          );
          const verifyData = await verifyRes.json();
          if (verifyData?.status === "success" || verifyData?.data?.status === "success") {
            const amt = Number(params.get("amount") || verifyData?.data?.amount || 0);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
              const newBal = Number(wallet?.balance || 0) + amt;
              await supabase.from("wallets").update({ balance: newBal }).eq("user_id", user.id);
              await supabase.from("transactions").insert({
                user_id: user.id, amount: amt, type: "credit",
                description: "Wallet top-up via SprintPay",
                reference: ref,
              });
              setBalance(newBal);
              setFundAmount(amt);
              setFundSuccess(true);
              setActivePanel("add-funds");
            }
          } else {
            toast.error("Payment could not be verified. Contact support with ref: " + ref);
          }
        } catch (e) {
          toast.error("Verification failed. Contact support with ref: " + ref);
        }
      }
    });
    fetchRecentFeed();
  }, [navigate]);

  useEffect(() => {
    console.log("STATE UPDATED - categories:", dbCategories.length, "products:", dbProducts.length);
  }, [dbCategories, dbProducts]);

  const fetchRecentFeed = async () => {
    const { data: realOrders } = await supabase
      .from("orders")
      .select("product_title, total_price, created_at")
      .order("created_at", { ascending: false })
      .limit(3);

    const fakes = [
      { user: "Sage.", product: "MALE POF(NOT PAI...", price: "₦6,000", time: "Just now" },
      { user: "Phoenix.", product: "PRIVATE PROXIES", price: "₦4,000", time: "10 mins ago" },
      { user: "Cameron.", product: "POF AGED ACCOUNT", price: "₦4,500", time: "25 mins ago" },
      { user: "Avery.", product: "DATACENTER PROXY", price: "₦3,500", time: "5 mins ago" },
      { user: "Jordan.", product: "TRUSTED EMAIL", price: "₦2,000", time: "42 mins ago" },
      { user: "Skyler.", product: "DASHBOARD VIP", price: "₦12,000", time: "1 hour ago" }
    ];

    const mappedReal = (realOrders || []).map(o => ({
      user: "User**",
      product: o.product_title,
      price: `₦${Number(o.total_price).toLocaleString()}`,
      time: "Recent"
    }));

    setRecentFeed([...mappedReal, ...fakes].slice(0, 10));
  };

  const loadUserData = async () => {
    setDataLoading(true);
    try {
      console.log("Starting to load user data...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found");
        return;
      }
      setEmail(user.email || "");
      setUserId(user.id);
      console.log("User authenticated:", user.id);

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

      const { data: cats, error: catError } = await supabase
        .from("categories")
        .select("*")
        .is("deleted_at" as any, null)
        .order("display_order", { ascending: true });
      console.log("cats error:", catError, "cats:", cats);
      if (cats) setDbCategories(cats as any as Category[]);

      const { data: prods, error: prodError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .is("deleted_at" as any, null);
      console.log("prods error:", prodError, "prods:", prods);
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

      const { data: mps } = await supabase
        .from("manual_payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (mps) setUserManualPayments(mps);

      const { data: bds } = await supabase
        .from("bank_details")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (bds) setBankDetails(bds);

      const { data: ss } = await supabase.from("site_settings").select("*");
      if (ss) {
        const settingsMap: Record<string, string> = {};
        (ss as any[]).forEach(s => settingsMap[s.key] = s.value);
        setSiteSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setDataLoading(false);
      setRenderKey(prev => prev + 1);
      console.log("Data loading completed");
    }
  };

  const submitManualPayment = async () => {
    if (!manualPayAmount || !manualPayMethod) {
      toast.error("Please enter the amount and payment method");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("manual_payments").insert({
      user_id: userId,
      amount: Number(manualPayAmount),
      reference: manualPayRef,
      method: manualPayMethod,
      status: "pending",
    });
    setLoading(false);
    if (error) {
      toast.error("Failed to submit proof. Please try again.");
    } else {
      toast.success("Payment proof submitted! We'll verify within 30 minutes.");
      setManualPayAmount("");
      setManualPayRef("");
      await loadUserData();
      setActivePanel("home");
    }
  };

  const fetchOrderDetails = async (orderId: string, productTitle: string) => {
    setDataLoading(true);
    try {
      const { data: logs, error } = await supabase
        .from("account_logs")
        .select("login, password, description")
        .eq("order_id", orderId);

      if (error) {
        toast.error("Failed to fetch order details");
      } else {
        setViewingOrderLogs(logs || []);
        setViewingOrderTitle(productTitle);
      }
    } catch (e) {
      toast.error("Failed to fetch details");
    } finally {
      setDataLoading(false);
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

  // Scroll chat to bottom
  useEffect(() => {
    const container = document.getElementById('chat-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, activePanel]);

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
    if (cat.image_url) {
      return <img src={cat.image_url} alt={cat.name} style={{ width: 24, height: 24, borderRadius: 6, objectFit: "cover" }} />;
    }
    const prods = getProductsForCategory(cat.id);
    if (prods.length > 0 && platformIconMap[prods[0].platform]) return <i className={platformIconMap[prods[0].platform]} />;
    return cat.emoji || "📦";
  };

  const getProductImage = (product: Product, cat?: Category | null) => {
    if (product.image_url) {
      return <img src={product.image_url} alt={product.title} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />;
    }
    if (cat?.image_url) {
      return <img src={cat.image_url} alt={product.title} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />;
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

  useEffect(() => {
    if (!dataLoading) {
      console.log("Debug - dbCategories length:", dbCategories.length);
      console.log("Debug - dbProducts length:", dbProducts.length);
      console.log("Debug - filteredDbCategories length:", filteredDbCategories.length);
      console.log("Debug - activeFilter:", activeFilter);
      console.log("Debug - searchQuery:", searchQuery);
    }
  }, [dataLoading, dbCategories, dbProducts, filteredDbCategories, activeFilter, searchQuery]);

  const filterBySearch = (text: string) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const initials = username ? username.slice(0, 2).toUpperCase() : email ? email.slice(0, 2).toUpperCase() : "U";

  const handleUpdatePassword = async () => {
    if (newPass.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Passwords do not match");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      setNewPass("");
      setConfirmPass("");
      setCurrentPass("");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const formattedBalance = `NGN ${balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
  const shortBalance = `NGN ${balance.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

  // SMM Filters
  const filteredSmmServices = SMM_SERVICES.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(smmSearchQuery.toLowerCase()) ||
                          service.platform.toLowerCase().includes(smmSearchQuery.toLowerCase());
    const matchesPlatform = smmPlatformFilter === "all" || service.platform.toLowerCase() === smmPlatformFilter.toLowerCase();
    return matchesSearch && matchesPlatform;
  });

  const smmPlatforms = Array.from(new Set(SMM_SERVICES.map(s => s.platform)));

  const smmCartTotal = smmCart.reduce((sum, item) => sum + (item.service.price * item.quantity), 0);

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
            <div className="modal-detail-row">
              <span className="mdr-label">Quantity</span>
              <div className="qty-selector">
                <button onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}>-</button>
                <span className="qty-val">{purchaseQuantity}</span>
                <button onClick={() => setPurchaseQuantity(Math.min(modal.stock, purchaseQuantity + 1))}>+</button>
              </div>
            </div>
            <div className="modal-total">
              <span className="mt-label">Total Cost</span>
              <span className="mt-val">NGN {((modal.priceNum || 0) * purchaseQuantity).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
            </div>
            <button
              className={`btn-confirm${loading ? " loading" : ""}`}
              disabled={loading}
              onClick={async () => {
                if (!modal.product_id) {
                  toast.error("This product is not available for purchase yet.");
                  return;
                }
                const totalPrice = (modal.priceNum || 0) * purchaseQuantity;
                if (balance < totalPrice) {
                  toast.error("Insufficient balance. Please add funds first.");
                  return;
                }
                setLoading(true);
                try {
                  const { data, error } = await supabase.rpc("process_purchase", {
                    p_product_id: modal.product_id,
                    p_quantity: purchaseQuantity,
                  });

                  if (error) {
                    console.error("RPC error:", error);
                    toast.error(`Purchase failed: ${error.message || "Please try again."}`);
                  } else {
                    const result = Array.isArray(data) ? data[0] : (data as any);
                    if (!result?.success) {
                      toast.error(result?.error_msg || "Purchase failed");
                    } else {
                      toast.success(`✅ Purchase successful!`);
                      setBalance(Number(result.new_balance));
                      if (result.purchased_accounts) {
                        setBoughtAccounts(result.purchased_accounts);
                      } else {
                        toast.info("Account details will be available in My Orders");
                        setBoughtAccounts([]);
                        await loadUserData();
                      }
                    }
                  }
                } catch (e: any) {
                  console.error("Purchase error:", e);
                  toast.error("Purchase failed. Please check your connection.");
                }
                setLoading(false);
              }}
            >
              {loading ? "Processing..." : `Confirm Purchase (₦${((modal.priceNum || 0) * purchaseQuantity).toLocaleString()}) →`}
            </button>

            {boughtAccounts && (
              <div className="purchase-success-overlay">
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: 'hsl(220 20% 12%)', marginBottom: 6 }}>
                    Purchase Successful!
                  </h3>
                  <p style={{ fontSize: 13, color: 'hsl(220 10% 50%)' }}>
                    Your accounts are ready. Also available in <strong>My Orders</strong>.
                  </p>
                </div>

                <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                  {boughtAccounts.length > 0 ? (
                    boughtAccounts.map((acc, i) => (
                      <div key={i} style={{
                        background: 'hsl(220 20% 97%)',
                        border: '1px solid hsl(220 20% 90%)',
                        borderRadius: 14,
                        padding: '16px',
                        marginBottom: 12,
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute', top: 12, left: 16,
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.08em', color: 'hsl(220 10% 55%)'
                        }}>
                          Account {i + 1}
                        </div>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${acc.login}:${acc.password}`);
                            toast.success("Copied!");
                          }}
                          style={{
                            position: 'absolute', top: 10, right: 12,
                            background: 'hsl(220 70% 55%)', color: 'white',
                            border: 'none', borderRadius: 8, padding: '5px 12px',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5
                          }}
                        >
                          <i className="fa-solid fa-copy" style={{ fontSize: 10 }} /> Copy
                        </button>

                        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontFamily: '', fontSize: 14, background: 'white', borderRadius: 8, padding: '12px 14px', border: '1px solid hsl(220 20% 86%)', wordBreak: 'break-all', lineHeight: 1.7 }}>
                            <strong style={{ color: 'hsl(220 20% 15%)' }}>{acc.login.split(':').join(' ||  ')}</strong>
                          </div>
                        </div>

                        {acc.description && (
                          <div style={{
                            marginTop: 10,
                            padding: '12px 14px',
                            background: 'linear-gradient(135deg, hsl(45 100% 97%), hsl(38 100% 93%))',
                            border: '1px solid hsl(45 80% 78%)',
                            borderRadius: 10,
                            display: 'flex', gap: 10, alignItems: 'flex-start'
                          }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>📋</span>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(38 80% 35%)', marginBottom: 4 }}>
                                Instructions
                              </div>
                              <div style={{ fontSize: 13, color: 'hsl(38 60% 25%)', lineHeight: 1.6, fontWeight: 500 }}>
                                {acc.description}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <button className="btn-secondary" onClick={() => { setModal(null); setBoughtAccounts(null); switchPanel("orders"); }}>
                        View Accounts in My Orders
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => {
                      const textContent = boughtAccounts.map((acc, i) =>
                        `Account ${i + 1}:\n${acc.login}\n` +
                        (acc.description ? `Instructions: ${acc.description}\n` : '') +
                        `---\n`
                      ).join('\n');
                      const blob = new Blob([textContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `accounts_${Date.now()}.txt`;
                      document.body.appendChild(a); a.click();
                      document.body.removeChild(a); URL.revokeObjectURL(url);
                      toast.success("Downloaded!");
                    }}
                    style={{
                      background: 'hsl(220 70% 55%)', color: 'white', border: 'none',
                      borderRadius: 12, padding: '13px 20px', fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    <i className="fa-solid fa-download" /> Download Details
                  </button>
                  <button className="btn-confirm" onClick={() => { setModal(null); setBoughtAccounts(null); }}>
                    Done ✓
                  </button>
                </div>
              </div>
            )}
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
            Social-store
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
          <button className="signout-btn" onClick={handleSignOut} style={{ marginTop: 12 }}>
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
            <input 
              type="text" 
              placeholder={activePanel === "smm" ? "Search services..." : "Search for products or categories..."} 
              value={activePanel === "smm" ? smmSearchQuery : searchQuery} 
              onChange={(e) => activePanel === "smm" ? setSmmSearchQuery(e.target.value) : setSearchQuery(e.target.value)} 
            />
          </div>
          <div className="dash-header-right">
            <div className={`dash-user-pill${activePanel === "add-funds" ? " active" : ""}`} onClick={() => switchPanel("add-funds")}>
              <span className="bal-icon"><i className="fa-solid fa-wallet" /></span>
              <span className="bal-text">{shortBalance}</span>
            </div>
            <div className="topbar-avatar" onClick={() => switchPanel("profile")}>{initials}</div>
          </div>
        </div>

        {/* Content */}
        <div className="dash-content" key={renderKey}>
          {/* SMM PANEL */}
          {activePanel === "smm" && (
            <div className="dash-panel smm-panel">
              <div className="smm-hero">
                <div className="smm-hero-content">
                  <div className="smm-badge">🚀 Social Media Growth</div>
                  <h1>Boost Your Social Presence</h1>
                  <p>Get real-quality likes, followers, views, and comments across all major platforms</p>
                </div>
              </div>

              <div className="smm-controls">
                <div className="smm-search">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input 
                    type="text" 
                    placeholder="Search services..." 
                    value={smmSearchQuery}
                    onChange={(e) => setSmmSearchQuery(e.target.value)}
                  />
                </div>

                <div className="smm-platform-filters">
                  <button 
                    className={`smm-filter-btn ${smmPlatformFilter === "all" ? "active" : ""}`}
                    onClick={() => setSmmPlatformFilter("all")}
                  >
                    All Platforms
                  </button>
                  {smmPlatforms.map(platform => (
                    <button
                      key={platform}
                      className={`smm-filter-btn ${smmPlatformFilter === platform ? "active" : ""}`}
                      onClick={() => setSmmPlatformFilter(platform)}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div className="smm-grid">
                {filteredSmmServices.map((service, idx) => (
                  <div key={service.id} className={`smm-card ${service.popular ? "popular" : ""} ${idx % 3 === 0 ? "slide-from-left" : idx % 3 === 1 ? "slide-from-right" : ""}`}>
                    {service.popular && <div className="smm-popular-badge">⭐ POPULAR</div>}
                    
                    <div className="smm-card-header">
                      <div className="smm-icon">
                        <i className={service.icon}></i>
                      </div>
                      <div className="smm-platform-label">{service.platform}</div>
                    </div>

                    <h3 className="smm-service-name">{service.name}</h3>
                    <p className="smm-service-desc">{service.description}</p>

                    <div className="smm-stats">
                      <div className="stat">
                        <span className="stat-label">Quantity</span>
                        <span className="stat-value">{service.quantity.toLocaleString()}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Delivery</span>
                        <span className="stat-value">{service.delivery_time}</span>
                      </div>
                    </div>

                    <div className="smm-pricing">
                      <span className="smm-price">₦{service.price.toLocaleString()}</span>
                      <span className="smm-per-unit">/ order</span>
                    </div>

                    <button className="smm-add-btn" onClick={() => {
                      const existingItem = smmCart.find(item => item.service.id === service.id);
                      if (existingItem) {
                        setSmmCart(smmCart.map(item => 
                          item.service.id === service.id 
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                        ));
                      } else {
                        setSmmCart([...smmCart, { service, quantity: 1 }]);
                      }
                      toast.success(`${service.name} added to cart!`);
                    }}>
                      <i className="fa-solid fa-plus"></i> Add to Cart
                    </button>
                  </div>
                ))}
              </div>

              {filteredSmmServices.length === 0 && (
                <div className="smm-empty">
                  <div className="smm-empty-icon">🔍</div>
                  <h3>No services found</h3>
                  <p>Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          )}

          {/* Keep all other panels as they were... HOME, CATEGORIES, ORDERS, PROFILE, ADD FUNDS, MANUAL PAYMENTS, SUPPORT */}
          {/* HOME PANEL */}
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

              {dataLoading ? (
                <ProductGridSkeleton count={6} />
              ) : filteredDbCategories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--db-text-muted))' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                  <h3 style={{ marginBottom: '8px', color: 'hsl(var(--db-text))' }}>No Products Available</h3>
                  <p>Check back later for new products or adjust your filters.</p>
                </div>
              ) : (
                filteredDbCategories.map((cat) => {
                  const prods = getProductsForCategory(cat.id).filter(p => filterBySearch(p.title + p.description));
                  if (prods.length === 0) return null;
                  return (
                    <div key={cat.id} className="category-block">
                      <div className="category-header">
                        <div className="cat-head-left">
                          <div className="cat-platform-icon">
                            {getCatIcon(cat)}
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
                            <div className="account-actions">
                              <button className="buy-btn" onClick={() => { setModal({ title: product.title, desc: product.description, platform: product.platform, stock: product.stock, price: `${product.currency} ${product.price.toLocaleString("en-NG")}`, product_id: product.id, priceNum: product.price }); setPurchaseQuantity(1); }}>
                                <i className="fa-solid fa-bolt" /> BUY
                              </button>
                            </div>
                          ) : (
                            <button className="buy-btn" disabled>Out of Stock</button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
              <div style={{ height: 28 }} />
            </div>
          )}

          {/* CATEGORIES PANEL */}
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
                {dataLoading ? (
                  <CategoryGridSkeleton count={8} />
                ) : dbCategories.filter((cat) => cat.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--db-text-muted))', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
                    <h3 style={{ marginBottom: '8px', color: 'hsl(var(--db-text))' }}>No Categories Found</h3>
                    <p>Try adjusting your search or check back later.</p>
                  </div>
                ) : (
                  dbCategories
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
                          {getCatIcon(cat)}
                        </div>
                        <div className="category-card-title">{cat.name}</div>
                        <div className="category-card-count">{getProductsForCategory(cat.id).length} products</div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

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
                  {typeof getCatIcon(selectedCategory) === 'string' ? getCatIcon(selectedCategory) : getCatIcon(selectedCategory)}
                </div>
                <div>
                  <h2 className="category-banner-title">{selectedCategory.name.toUpperCase()}</h2>
                  <p className="category-banner-count">{getProductsForCategory(selectedCategory.id).length} products available</p>
                </div>
              </div>

              <div className="category-detail-list">
                {dataLoading ? (
                  <ProductGridSkeleton count={4} />
                ) : (
                  getProductsForCategory(selectedCategory.id).filter(p => filterBySearch(p.title + p.description)).map((product, idx) => (
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
                        <button className="buy-btn" onClick={() => { setModal({ title: product.title, desc: product.description, platform: product.platform, stock: product.stock, price: `${product.currency} ${product.price.toLocaleString("en-NG")}`, product_id: product.id, priceNum: product.price }); setPurchaseQuantity(1); }}>
                          <i className="fa-solid fa-cart-shopping" /> BUY
                        </button>
                      ) : (
                        <button className="buy-btn" disabled>Out of Stock</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ORDERS PANEL */}
          {activePanel === "orders" && (
            <div className="dash-panel">
              <div style={{ padding: "24px 24px 0" }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>My Orders</h2>
                <p style={{ fontSize: 14, color: "hsl(210 15% 55%)", marginBottom: 16 }}>View and manage your purchased accounts</p>
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
                  <div className="table-container orders-desktop-table">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Order ID</th><th>Account</th><th>Platform</th><th>Price</th><th>Date</th><th>Status</th><th>Access</th>
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
                            <td>
                              <button
                                className="order-view-btn"
                                onClick={() => fetchOrderDetails(o.id, o.product_title)}
                              >
                                👁️ View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="orders-mobile-cards">
                    {orders.map((o) => (
                      <div key={o.id} className="order-mobile-card">
                        <div className="omc-row">
                          <span className="omc-label">Order ID</span>
                          <span className="omc-val order-id">#{o.id.slice(0, 6)}</span>
                        </div>
                        <div className="omc-row">
                          <span className="omc-label">Account</span>
                          <span className="omc-val">{o.product_title}</span>
                        </div>
                        <div className="omc-row">
                          <span className="omc-label">Platform</span>
                          <span className="omc-val">{o.product_platform}</span>
                        </div>
                        <div className="omc-row">
                          <span className="omc-label">Price</span>
                          <span className="omc-val order-price">NGN {Number(o.total_price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="omc-row">
                          <span className="omc-label">Date</span>
                          <span className="omc-val">{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                        <div className="omc-row">
                          <span className="omc-label">Status</span>
                          <span className={`status-pill status-${o.status}`}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span>
                        </div>
                        <button
                          className="order-view-btn"
                          style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}
                          onClick={() => fetchOrderDetails(o.id, o.product_title)}
                        >
                          👁️ View Account Details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {viewingOrderLogs && (
            <div className="details-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewingOrderLogs(null); }}>
              <div className="details-modal">
                <div className="details-modal-header">
                  <h3><i className="fa-solid fa-receipt" style={{ marginRight: 12, opacity: 0.8 }} />Order Details</h3>
                  <button onClick={() => setViewingOrderLogs(null)}><i className="fa-solid fa-xmark" /></button>
                </div>
                <div className="details-modal-body">
                  <div style={{ marginBottom: 24, padding: '16px', background: 'hsl(var(--db-blue-dim))', borderRadius: 12, border: '1px solid hsl(var(--db-blue-border))' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--db-blue))', opacity: 0.8, marginBottom: 4 }}>Product Purchased</div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: 'hsl(var(--db-blue))' }}>{viewingOrderTitle}</div>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'hsl(var(--db-text))', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fa-solid fa-key" style={{ opacity: 0.5 }} /> Your Account Credentials
                  </div>

                  <div className="accounts-list">
                    {viewingOrderLogs.length > 0 ? viewingOrderLogs.map((acc, i) => (
                      <div key={i} style={{
                        background: 'hsl(220 20% 97%)',
                        border: '1px solid hsl(220 20% 90%)',
                        borderRadius: 14,
                        padding: '16px',
                        marginBottom: 12,
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute', top: 12, left: 16,
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.08em', color: 'hsl(220 10% 55%)'
                        }}>
                          Account {i + 1}
                        </div>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(acc.login);
                            toast.success("Copied!");
                          }}
                          style={{
                            position: 'absolute', top: 10, right: 12,
                            background: 'hsl(220 70% 55%)', color: 'white',
                            border: 'none', borderRadius: 8, padding: '5px 12px',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5
                          }}
                        >
                          <i className="fa-solid fa-copy" style={{ fontSize: 10 }} /> Copy
                        </button>

                        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ marginTop: 24 }}>
                            <div style={{ fontFamily: '', fontSize: 14, background: 'white', borderRadius: 8, padding: '12px 14px', border: '1px solid hsl(220 20% 86%)', wordBreak: 'break-all', lineHeight: 1.7 }}>
                              {acc.login.split(':').join(' || ')}
                            </div>
                          </div>
                        </div>

                        {acc.description && (
                          <div style={{
                            marginTop: 10,
                            padding: '12px 14px',
                            background: 'linear-gradient(135deg, hsl(45 100% 97%), hsl(38 100% 93%))',
                            border: '1px solid hsl(45 80% 78%)',
                            borderRadius: 10,
                            display: 'flex', gap: 10, alignItems: 'flex-start'
                          }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>📋</span>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(38 80% 35%)', marginBottom: 4 }}>
                                Instructions
                              </div>
                              <div style={{ fontSize: 13, color: 'hsl(38 60% 25%)', lineHeight: 1.6, fontWeight: 500 }}>
                                {acc.description}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                        <i className="fa-solid fa-ghost" style={{ fontSize: 32, marginBottom: 12, display: 'block' }} />
                        <p>No access details found for this order.</p>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 24, textAlign: 'center', paddingTop: '20px' }}>
                    <button className="btn-save" style={{ width: '100%' }} onClick={() => setViewingOrderLogs(null)}>Done</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE PANEL */}
          {activePanel === "profile" && (
            <div className="dash-panel">
              <div className="profile-panel-inner">
                <div className="profile-form">
                  <div className="form-section-title">Profile Information</div>
                  <div className="form-grid">
                    <div className="form-group full">
                      <label className="form-label">Username</label>
                      <div className="dash-form-input" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <i className="fa-solid fa-user" style={{ color: "hsl(210 15% 55%)" }} />
                        {username || "—"}
                      </div>
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Email Address</label>
                      <div className="dash-form-input" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <i className="fa-solid fa-envelope" style={{ color: "hsl(210 15% 55%)" }} />
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
                  <p style={{ fontSize: 13, color: "hsl(210 15% 55%)", marginBottom: 20, marginTop: -10 }}>Update your password to keep your account secure</p>
                  <div className="form-grid">
                    <div className="form-group full">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        className="dash-form-input"
                        placeholder="Enter new password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                      />
                      <span style={{ fontSize: 11, color: "hsl(210 15% 55%)", marginTop: 4, display: "block" }}>Password must be at least 6 characters long</span>
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        className="dash-form-input"
                        placeholder="Confirm new password"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn-save" onClick={handleUpdatePassword}>Update Password</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADD FUNDS PANEL - Kept as original */}
          {activePanel === "add-funds" && (
            <div className="dash-panel">
              <div className="funds-panel">
                {fundSuccess ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
                  }}>
                    <div style={{
                      width: 90, height: 90, borderRadius: '50%',
                      background: 'linear-gradient(135deg, hsl(142 70% 45%), hsl(158 65% 40%))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 40, marginBottom: 24, color: 'white',
                      boxShadow: '0 12px 40px hsl(142 60% 40% / 0.35)',
                    }}>✓</div>
                    <h2 style={{ fontSize: 26, fontWeight: 800, color: 'hsl(220 20% 12%)', marginBottom: 8 }}>
                      Funds Added Successfully!
                    </h2>
                    <p style={{ fontSize: 15, color: 'hsl(210 15% 50%)', marginBottom: 4 }}>
                      <strong style={{ color: 'hsl(142 60% 35%)', fontSize: 18 }}>
                        ₦{fundAmount.toLocaleString()}
                      </strong> has been credited to your wallet
                    </p>
                    <p style={{ fontSize: 13, color: 'hsl(210 15% 60%)', marginBottom: 32 }}>
                      New balance: <strong>{formattedBalance}</strong>
                    </p>
                    <div style={{
                      background: 'linear-gradient(135deg, hsl(220 70% 55%), hsl(240 65% 60%))',
                      borderRadius: 16, padding: '24px 48px', marginBottom: 32,
                      boxShadow: '0 8px 32px hsl(220 70% 55% / 0.3)',
                      color: 'white',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Wallet Balance
                      </div>
                      <div style={{ fontSize: 34, fontWeight: 900 }}>{formattedBalance}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button
                        onClick={() => { setFundSuccess(false); setCustomAmount(""); }}
                        style={{
                          background: 'hsl(220 20% 93%)', color: 'hsl(220 20% 30%)',
                          border: 'none', borderRadius: 12, padding: '12px 24px',
                          fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        }}
                      >+ Add More Funds</button>
                      <button
                        onClick={() => switchPanel("smm")}
                        style={{
                          background: 'linear-gradient(135deg, hsl(220 70% 55%), hsl(240 65% 60%))',
                          color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px',
                          fontSize: 14, fontWeight: 700, cursor: 'pointer',
                          boxShadow: '0 4px 16px hsl(220 70% 55% / 0.3)',
                        }}
                      >Back to Shopping →</button>
                    </div>
                  </div>
                ) : (
                  <>
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
                              <button
                                key={amt}
                                className={`preset-btn ${selectedPreset === amt && !customAmount ? "selected" : ""}`}
                                onClick={() => { setSelectedPreset(amt); setCustomAmount(""); }}
                              >{amt}</button>
                            ))}
                          </div>
                          <div className="form-group" style={{ marginTop: 14 }}>
                            <label className="form-label">Or Enter Custom Amount</label>
                            <input
                              type="number"
                              className="dash-form-input"
                              placeholder="Enter amount in NGN"
                              value={customAmount}
                              onChange={(e) => {
                                setCustomAmount(e.target.value);
                                if (e.target.value) {
                                  setSelectedPreset("");
                                }
                              }}
                            />
                          </div>

                          <div className="form-section-title" style={{ marginTop: 20 }}>Payment Method</div>
                          <div className="payment-methods">
                            {[
                              { icon: "⚡", name: "SprintPay", desc: "Bank Transfer · Crypto · Fast & Secure" },
                              { icon: "🏦", name: "Manual Transfer", desc: "Direct bank deposit · Admin verified" },
                            ].map((pm, i) => (
                              <div
                                key={i}
                                className={`payment-method ${selectedPayment === i ? "selected" : ""}`}
                                onClick={() => setSelectedPayment(i)}
                              >
                                <span className="pm-icon">{pm.icon}</span>
                                <div>
                                  <div className="pm-name">{pm.name}</div>
                                  <div className="pm-desc">{pm.desc}</div>
                                </div>
                                <div style={{
                                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginLeft: 'auto',
                                  border: `2px solid ${selectedPayment === i ? 'hsl(220 70% 55%)' : 'hsl(220 20% 75%)'}`,
                                  background: selectedPayment === i ? 'hsl(220 70% 55%)' : 'white',
                                }} />
                              </div>
                            ))}
                          </div>

                          {selectedPayment === 0 && (
                            <div style={{
                              marginTop: 14, padding: '14px 16px',
                              background: 'hsl(220 70% 55% / 0.06)',
                              border: '1px solid hsl(220 70% 55% / 0.2)',
                              borderRadius: 12, fontSize: 12, color: 'hsl(220 20% 40%)', lineHeight: 1.7,
                            }}>
                              <div style={{ fontWeight: 700, marginBottom: 6, color: 'hsl(220 70% 45%)', fontSize: 13 }}>
                                ⚡ SprintPay Checkout
                              </div>
                              You'll be redirected to SprintPay's secure hosted payment page. After payment, you'll be sent back here and your wallet will be credited automatically.
                            </div>
                          )}

                          {selectedPayment === 1 && (
                            <div style={{
                              marginTop: 14, padding: '14px 16px',
                              background: 'hsl(38 100% 97%)',
                              border: '1px solid hsl(38 80% 80%)',
                              borderRadius: 12, fontSize: 12, color: 'hsl(38 60% 30%)', lineHeight: 1.7,
                            }}>
                              <div style={{ fontWeight: 700, marginBottom: 4 }}>⏳ Manual Transfer</div>
                              Use the <strong>Manual Payments</strong> tab to submit proof. Admin will verify and credit your wallet within 30 minutes.
                            </div>
                          )}

                          <button
                            className="btn-submit-funds"
                            style={{ marginTop: 20, opacity: payLoading ? 0.7 : 1 }}
                            disabled={payLoading}
                            onClick={() => {
                              if (selectedPayment === 1) {
                                switchPanel("manual-payments");
                                return;
                              }
                              const amount = customAmount
                                ? Number(customAmount)
                                : selectedPreset ? Number(selectedPreset.replace(/[^\d]/g, "")) : 0;
                              if (!amount || amount < 100) {
                                toast.error("Minimum amount is ₦100");
                                return;
                              }
                              setPayLoading(true);
                              const SPRINT_API_KEY = "55699454060223578858586";
                              const ref = `sp-${userId.slice(0, 8)}-${Date.now()}`;
                              const payUrl = `https://web.sprintpay.online/pay?amount=${amount}&key=${SPRINT_API_KEY}&ref=${ref}&email=${encodeURIComponent(email)}`;
                              window.location.href = payUrl;
                            }}
                          >
                            {payLoading
                              ? "Redirecting..."
                              : selectedPayment === 1
                              ? "Go to Manual Payments →"
                              : `Pay ₦${(customAmount ? Number(customAmount) : selectedPreset ? Number(selectedPreset.replace(/[^\d]/g, "")) : 0).toLocaleString()} via SprintPay →`
                            }
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="funds-card">
                          <div className="funds-card-title">Current Balance</div>
                          <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <div style={{ fontSize: 36, fontWeight: 800, color: "hsl(200 85% 45%)" }}>{formattedBalance}</div>
                            <div style={{ fontSize: 13, color: "hsl(210 15% 55%)", marginTop: 4 }}>Available Balance</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* MANUAL PAYMENTS PANEL */}
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
                      <div className="funds-card-title">Payment Account Details</div>
                      <p style={{ fontSize: 13, color: "hsl(210 15% 55%)", marginBottom: 16 }}>Send payment to any of the accounts below and submit proof of payment</p>

                      {bankDetails.length === 0 ? (
                        <div className="manual-bank-card">
                          <div className="manual-bank-name">No accounts found</div>
                          <div className="manual-bank-detail">Please contact support for payment details.</div>
                        </div>
                      ) : (
                        bankDetails.map((b) => (
                          <div key={b.id} className="manual-bank-card">
                            <div className="manual-bank-name">🏦 {b.label}</div>
                            <div className="manual-bank-detail"><span>Account Name:</span> <strong>{b.account_name}</strong></div>
                            <div className="manual-bank-detail"><span>Account Number:</span> <strong>{b.account_number}</strong></div>
                          </div>
                        ))
                      )}

                      <div className="form-section-title" style={{ marginTop: 20 }}>Submit Proof of Payment</div>
                      <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label">Amount Sent (NGN)</label>
                        <input
                          type="number"
                          className="dash-form-input"
                          placeholder="e.g. 5000"
                          value={manualPayAmount}
                          onChange={(e) => setManualPayAmount(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label">Transaction Reference</label>
                        <input
                          type="text"
                          className="dash-form-input"
                          placeholder="Bank reference or TX hash"
                          value={manualPayRef}
                          onChange={(e) => setManualPayRef(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label">Payment Method Used</label>
                        <select
                          className="dash-form-input"
                          value={manualPayMethod}
                          onChange={(e) => setManualPayMethod(e.target.value)}
                        >
                          <option value="">Select Method</option>
                          {bankDetails.map(b => (
                            <option key={b.id} value={b.label}>{b.label}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        className={`btn-submit-funds ${loading ? "loading" : ""}`}
                        disabled={loading}
                        onClick={submitManualPayment}
                      >
                        {loading ? "Submitting..." : "Submit Payment Proof →"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="funds-card">
                      <div className="funds-card-title">Current Balance</div>
                      <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: "hsl(200 85% 45%)" }}>{formattedBalance}</div>
                        <div style={{ fontSize: 13, color: "hsl(210 15% 55%)", marginTop: 4 }}>Available Balance</div>
                      </div>
                    </div>
                    <div className="funds-card" style={{ marginTop: 16 }}>
                      <div className="funds-card-title">⏳ Processing Times</div>
                      <div className="manual-bank-detail"><span>Bank Transfer:</span> <strong>15-30 minutes</strong></div>
                      <div className="manual-bank-detail"><span>Cryptocurrency:</span> <strong>5-15 minutes</strong></div>
                      <div style={{ fontSize: 12, color: "hsl(210 15% 55%)", marginTop: 12 }}>Payments are verified manually. Contact support if not credited within 1 hour.</div>
                    </div>
                  </div>
                </div>

                <div className="section-header" style={{ padding: "40px 0 20px" }}>
                  <div className="section-head-left">
                    <div className="section-hl" />
                    <span className="section-title">My Payment History</span>
                  </div>
                </div>

                <div className="orders-table-wrap">
                  <div className="table-container">
                    <table className="dash-table">
                      <thead>
                        <tr><th>Method</th><th>Amount</th><th>Reference</th><th>Date</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {userManualPayments.map(mp => (
                          <tr key={mp.id}>
                            <td>{mp.method}</td>
                            <td className="order-price">₦{Number(mp.amount).toLocaleString()}</td>
                            <td style={{ fontFamily: "monospace", fontSize: 11 }}>{mp.reference || "—"}</td>
                            <td>{new Date(mp.created_at).toLocaleDateString()}</td>
                            <td><span className={`status-pill status-${mp.status}`}>{mp.status.charAt(0).toUpperCase() + mp.status.slice(1)}</span></td>
                          </tr>
                        ))}
                        {userManualPayments.length === 0 && (
                          <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "hsl(220 10% 60%)" }}>No payment submissions yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUPPORT PANEL */}
          {activePanel === "support" && (
            <div className="dash-panel">
              {!supportChatOpen ? (
                <div className="support-panel-modern">
                  <div className="support-hero">
                    <h2 className="support-hero-title">Customer Support</h2>
                    <p className="support-hero-desc">We're here to help! Choose your preferred support channel below and our team will assist you promptly.</p>
                  </div>

                  <div className="support-grid-modern">
                    <div className="support-card-modern">
                      <div className="support-card-icon-wrap" style={{ background: 'hsl(210 100% 25% / 0.1)', color: 'hsl(210 100% 25%)' }}>
                        <i className="fa-solid fa-bullhorn" />
                      </div>
                      <div className="support-card-info">
                        <h3>Telegram Announcement Group</h3>
                        <p>Get latest updates, announcements and news</p>
                      </div>
                      <button className="support-card-btn" onClick={() => window.open(siteSettings.telegram_group, '_blank')}>
                        Click to Join Group
                      </button>
                    </div>

                    <div className="support-card-modern">
                      <div className="support-card-icon-wrap" style={{ background: 'hsl(200 100% 45% / 0.1)', color: 'hsl(200 100% 45%)' }}>
                        <i className="fa-brands fa-telegram" />
                      </div>
                      <div className="support-card-info">
                        <h3>Telegram Support</h3>
                        <p>Chat with our support team 24/7</p>
                      </div>
                      <button className="support-card-btn" onClick={() => window.open(siteSettings.telegram_support, '_blank')}>
                        Start Telegram Chat
                      </button>
                    </div>

                    <div className="support-card-modern">
                      <div className="support-card-icon-wrap" style={{ background: 'hsl(140 70% 45% / 0.1)', color: 'hsl(140 70% 45%)' }}>
                        <i className="fa-brands fa-whatsapp" />
                      </div>
                      <div className="support-card-info">
                        <h3>WhatsApp Channel</h3>
                        <p>Join our WhatsApp community for instant support</p>
                      </div>
                      <button className="support-card-btn" onClick={() => window.open(siteSettings.whatsapp_channel, '_blank')}>
                        Click to Join WhatsApp Channel
                      </button>
                    </div>

                    <div className="support-card-modern">
                      <div className="support-card-icon-wrap" style={{ background: 'hsl(260 70% 55% / 0.1)', color: 'hsl(260 70% 55%)' }}>
                        <i className="fa-solid fa-comments" />
                      </div>
                      <div className="support-card-info">
                        <h3>Internal Dashboard Chat</h3>
                        <p>Message us directly here if you prefer not to use other apps.</p>
                      </div>
                      <button className="support-card-btn" onClick={() => setSupportChatOpen(true)}>
                        Open Dashboard Chat
                      </button>
                    </div>
                  </div>

                  <div className="support-info-banner">
                    <div className="sib-icon">🕒</div>
                    <div className="sib-content">
                      <h3>24/7 Support Available</h3>
                      <p>Our support team responds within 24 hours. For urgent matters, please use Telegram or WhatsApp for faster response.</p>
                    </div>
                  </div>

                  <div className="support-tips-section">
                    <h3 className="tips-title">Quick Tips for Better Support</h3>
                    <div className="tips-grid">
                      <div className="tip-item">
                        <i className="fa-solid fa-hashtag" />
                        <span>Include your order number in all support requests</span>
                      </div>
                      <div className="tip-item">
                        <i className="fa-solid fa-camera" />
                        <span>Provide screenshots for technical issues</span>
                      </div>
                      <div className="tip-item">
                        <i className="fa-solid fa-circle-question" />
                        <span>Check FAQ section before contacting support</span>
                      </div>
                      <div className="tip-item">
                        <i className="fa-solid fa-bolt" />
                        <span>Use Telegram/WhatsApp for urgent matters</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ padding: "24px 24px 0", display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button
                      onClick={() => setSupportChatOpen(false)}
                      style={{ background: 'none', border: 'none', fontSize: 18, color: 'hsl(var(--db-blue))', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <i className="fa-solid fa-arrow-left" />
                    </button>
                    <div>
                      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 2 }}>Live Chat</h2>
                      <p style={{ fontSize: 13, color: "hsl(210 15% 55%)" }}>Our agents typically respond within 15 minutes</p>
                    </div>
                  </div>

                  <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
                    <div
                      id="chat-container"
                      style={{
                        background: "hsl(var(--db-bg))",
                        border: "1px solid hsl(var(--db-border))",
                        borderRadius: 16,
                        padding: 24,
                        minHeight: 450,
                        maxHeight: 600,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12
                      }}
                    >
                      {messages.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--db-text-muted))', opacity: 0.7 }}>
                          <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
                          <p style={{ fontSize: 15, fontWeight: 500 }}>Start a conversation</p>
                          <p style={{ fontSize: 13 }}>Send a message to our support agents below.</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            style={{
                              alignSelf: msg.sender_id === userId ? "flex-end" : "flex-start",
                              background: msg.sender_id === userId ? "hsl(var(--db-blue))" : "hsl(220 20% 94%)",
                              color: msg.sender_id === userId ? "white" : "hsl(var(--db-text))",
                              padding: "12px 18px",
                              borderRadius: msg.sender_id === userId ? "16px 16px 0 16px" : "16px 16px 16px 0",
                              maxWidth: "75%",
                              fontSize: 14,
                              boxShadow: "0 1px 4px hsl(0 0% 0% / 0.05)",
                              border: "none",
                              marginLeft: msg.sender_id === userId ? "auto" : "0",
                              marginRight: msg.sender_id === userId ? "0" : "auto",
                            }}
                          >
                            <div style={{ lineHeight: 1.5 }}>{msg.content}</div>
                            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6, textAlign: msg.sender_id === userId ? 'right' : 'left' }}>
                              {new Date(msg.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <input
                        type="text"
                        className="dash-form-input"
                        placeholder="Type your message..."
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                        style={{ flex: 1, height: 48, borderRadius: 12 }}
                      />
                      <button className="btn-save" onClick={() => sendMessage()} style={{ padding: '0 24px', height: 48, borderRadius: 12 }}>
                        Send <i className="fa-solid fa-paper-plane" style={{ marginLeft: 8 }} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="bottom-nav">
        <button className={`bottom-nav-item ${activePanel === "smm" ? "active" : ""}`} onClick={() => switchPanel("smm")}>
          <i className="fa-solid fa-rocket"></i>
          <span>SMM</span>
        </button>
        <button className={`bottom-nav-item ${activePanel === "home" ? "active" : ""}`} onClick={() => switchPanel("home")}>
          <i className="fa-solid fa-home"></i>
          <span>Home</span>
        </button>
        <button className={`bottom-nav-item ${activePanel === "orders" ? "active" : ""}`} onClick={() => switchPanel("orders")}>
          <i className="fa-solid fa-box"></i>
          <span>Orders</span>
        </button>
        <button className={`bottom-nav-item ${activePanel === "profile" ? "active" : ""}`} onClick={() => switchPanel("profile")}>
          <i className="fa-solid fa-user"></i>
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
    }
