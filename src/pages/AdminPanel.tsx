import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import "../styles/admin.css";

type AdminTab = "overview" | "users" | "orders" | "products" | "categories" | "transactions" | "admins";

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  created_at: string;
  is_blocked: boolean;
}

interface Wallet {
  user_id: string;
  balance: number;
  id: string;
}

interface Order {
  id: string;
  user_id: string;
  product_title: string;
  product_platform: string;
  total_price: number;
  status: string;
  created_at: string;
  quantity: number;
  account_details: string | null;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  platform: string;
  category_id: string;
  is_active: boolean;
  currency: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  display_order: number;
}

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  reference: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

const NAV: { label: string; icon: string; tab: AdminTab }[] = [
  { label: "Overview", icon: "📊", tab: "overview" },
  { label: "Users", icon: "👥", tab: "users" },
  { label: "Orders", icon: "📦", tab: "orders" },
  { label: "Products", icon: "🛍️", tab: "products" },
  { label: "Categories", icon: "📁", tab: "categories" },
  { label: "Transactions", icon: "💰", tab: "transactions" },
  { label: "Admin Roles", icon: "🛡️", tab: "admins" },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletAction, setWalletAction] = useState<"credit" | "debit" | null>(null);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const [productForm, setProductForm] = useState({ title: "", description: "", price: 0, stock: 0, platform: "", category_id: "", currency: "NGN" });
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", emoji: "", display_order: 0 });
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [p, w, o, pr, c, t, r] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("wallets").select("*"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("display_order"),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
    ]);
    if (p.data) setProfiles(p.data as Profile[]);
    if (w.data) setWallets(w.data as Wallet[]);
    if (o.data) setOrders(o.data as Order[]);
    if (pr.data) setProducts(pr.data as Product[]);
    if (c.data) setCategories(c.data as Category[]);
    if (t.data) setTransactions(t.data as Transaction[]);
    if (r.data) setRoles(r.data as UserRole[]);
  };

  const getWalletBalance = (userId: string) => {
    const w = wallets.find((x) => x.user_id === userId);
    return w ? Number(w.balance) : 0;
  };

  const getUserName = (userId: string) => {
    const p = profiles.find((x) => x.user_id === userId);
    return p?.username || userId.slice(0, 8);
  };

  const isUserAdmin = (userId: string) => roles.some((r) => r.user_id === userId && r.role === "admin");
  const isUserBlocked = (userId: string) => profiles.find((p) => p.user_id === userId)?.is_blocked || false;

  const toggleBlockUser = async (userId: string) => {
    const profile = profiles.find((p) => p.user_id === userId);
    if (!profile) return;
    const newStatus = !profile.is_blocked;
    const { error } = await supabase.from("profiles").update({ is_blocked: newStatus }).eq("user_id", userId);
    if (error) { toast.error("Failed to update user"); return; }
    toast.success(newStatus ? "User blocked" : "User unblocked");
    // Update local state
    setProfiles(profiles.map((p) => p.user_id === userId ? { ...p, is_blocked: newStatus } : p));
    if (selectedUser?.user_id === userId) setSelectedUser({ ...selectedUser, is_blocked: newStatus });
  };

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;

  const getUserOrders = (userId: string) => orders.filter((o) => o.user_id === userId);
  const getUserTransactions = (userId: string) => transactions.filter((t) => t.user_id === userId);

  const switchTab = (t: AdminTab) => {
    setTab(t);
    setSearch("");
    setSelectedUser(null);
    setSidebarOpen(false);
  };

  // Wallet credit/debit
  const handleWalletAction = async () => {
    if (!selectedUser || !walletAmount || !walletAction) return;
    const amount = Number(walletAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid amount"); return; }

    const wallet = wallets.find((w) => w.user_id === selectedUser.user_id);
    if (!wallet) { toast.error("User has no wallet"); return; }

    const newBalance = walletAction === "credit"
      ? Number(wallet.balance) + amount
      : Number(wallet.balance) - amount;

    if (newBalance < 0) { toast.error("Insufficient balance for debit"); return; }

    const { error: wErr } = await supabase.from("wallets").update({ balance: newBalance }).eq("user_id", selectedUser.user_id);
    if (wErr) { toast.error("Failed to update wallet"); return; }

    // Log transaction
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("transactions").insert({
      user_id: selectedUser.user_id,
      amount,
      type: walletAction,
      description: `Admin ${walletAction} by ${user?.email || "admin"}`,
      reference: `admin-${Date.now()}`,
    });

    toast.success(`₦${amount.toLocaleString()} ${walletAction}ed successfully`);
    setWalletAmount("");
    setWalletAction(null);
    loadAll();
  };

  // Order status update
  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) { toast.error("Failed to update order"); return; }
    toast.success(`Order ${status}`);
    loadAll();
  };

  // Product CRUD
  const saveProduct = async () => {
    if (!productForm.title || !productForm.category_id) { toast.error("Fill required fields"); return; }
    if (editProduct) {
      const { error } = await supabase.from("products").update(productForm).eq("id", editProduct.id);
      if (error) { toast.error("Failed to update product"); return; }
      toast.success("Product updated");
    } else {
      const { error } = await supabase.from("products").insert(productForm);
      if (error) { toast.error("Failed to create product"); return; }
      toast.success("Product created");
    }
    setShowProductModal(false);
    setEditProduct(null);
    setProductForm({ title: "", description: "", price: 0, stock: 0, platform: "", category_id: "", currency: "NGN" });
    loadAll();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Product deleted");
    loadAll();
  };

  // Category CRUD
  const saveCategory = async () => {
    if (!categoryForm.name || !categoryForm.slug) { toast.error("Fill required fields"); return; }
    if (editCategory) {
      const { error } = await supabase.from("categories").update(categoryForm).eq("id", editCategory.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Category updated");
    } else {
      const { error } = await supabase.from("categories").insert(categoryForm);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Category created");
    }
    setShowCategoryModal(false);
    setEditCategory(null);
    setCategoryForm({ name: "", slug: "", emoji: "", display_order: 0 });
    loadAll();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Category deleted");
    loadAll();
  };

  // Admin role management
  const addAdmin = async () => {
    if (!adminEmail) { toast.error("Enter an email"); return; }
    const { data: allProfiles } = await supabase.from("profiles").select("user_id, username");
    if (!allProfiles) { toast.error("Could not load users"); return; }
    const match = allProfiles.find((p) =>
      p.username?.toLowerCase() === adminEmail.toLowerCase() ||
      p.username?.toLowerCase() === adminEmail.split("@")[0].toLowerCase()
    );
    if (!match) { toast.error("User not found. Make sure they have signed up."); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: match.user_id, role: "admin" });
    if (error) {
      if (error.code === "23505") toast.error("Already an admin");
      else toast.error("Failed to add admin");
      return;
    }
    toast.success("Admin added!");
    setAdminEmail("");
    setShowAdminModal(false);
    loadAll();
  };

  const removeAdmin = async (roleId: string) => {
    if (!confirm("Remove this admin role?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) { toast.error("Failed to remove"); return; }
    toast.success("Admin removed");
    loadAll();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredProfiles = profiles.filter((p) =>
    !search || p.username?.toLowerCase().includes(search.toLowerCase()) || p.user_id.includes(search)
  );

  const filteredOrders = orders.filter((o) =>
    !search || o.product_title.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search) || getUserName(o.user_id).toLowerCase().includes(search.toLowerCase())
  );

  const filteredTransactions = transactions.filter((t) =>
    !search || t.description.toLowerCase().includes(search.toLowerCase()) || getUserName(t.user_id).toLowerCase().includes(search.toLowerCase())
  );

  const renderModal = (show: boolean, onClose: () => void, title: string, children: React.ReactNode) => {
    if (!show) return null;
    return (
      <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="admin-modal">
          <h3>{title}</h3>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <div className="admin-mobile-header">
        <button className="admin-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? "✕" : "☰"}
        </button>
        <span className="admin-mobile-title">Admin Panel</span>
      </div>

      {/* Sidebar Overlay */}
      <div className={`admin-sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Product Modal */}
      {renderModal(showProductModal, () => { setShowProductModal(false); setEditProduct(null); }, editProduct ? "Edit Product" : "Add Product", (
        <>
          <div className="admin-form-group">
            <label className="admin-form-label">Title *</label>
            <input className="admin-form-input" value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Description</label>
            <textarea className="admin-form-input" rows={3} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Platform</label>
            <input className="admin-form-input" value={productForm.platform} onChange={(e) => setProductForm({ ...productForm, platform: e.target.value })} />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Category *</label>
            <select className="admin-form-input" value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="admin-form-group" style={{ flex: 1 }}>
              <label className="admin-form-label">Price (₦)</label>
              <input type="number" className="admin-form-input" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
            </div>
            <div className="admin-form-group" style={{ flex: 1 }}>
              <label className="admin-form-label">Stock</label>
              <input type="number" className="admin-form-input" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} />
            </div>
          </div>
          <div className="admin-form-actions">
            <button className="admin-btn admin-btn-primary" onClick={saveProduct}>{editProduct ? "Update" : "Create"}</button>
            <button className="admin-btn" style={{ background: "hsl(220 20% 93%)" }} onClick={() => { setShowProductModal(false); setEditProduct(null); }}>Cancel</button>
          </div>
        </>
      ))}

      {/* Category Modal */}
      {renderModal(showCategoryModal, () => { setShowCategoryModal(false); setEditCategory(null); }, editCategory ? "Edit Category" : "Add Category", (
        <>
          <div className="admin-form-group">
            <label className="admin-form-label">Name *</label>
            <input className="admin-form-input" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Slug *</label>
            <input className="admin-form-input" value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="admin-form-group" style={{ flex: 1 }}>
              <label className="admin-form-label">Emoji</label>
              <input className="admin-form-input" value={categoryForm.emoji} onChange={(e) => setCategoryForm({ ...categoryForm, emoji: e.target.value })} />
            </div>
            <div className="admin-form-group" style={{ flex: 1 }}>
              <label className="admin-form-label">Order</label>
              <input type="number" className="admin-form-input" value={categoryForm.display_order} onChange={(e) => setCategoryForm({ ...categoryForm, display_order: Number(e.target.value) })} />
            </div>
          </div>
          <div className="admin-form-actions">
            <button className="admin-btn admin-btn-primary" onClick={saveCategory}>{editCategory ? "Update" : "Create"}</button>
            <button className="admin-btn" style={{ background: "hsl(220 20% 93%)" }} onClick={() => { setShowCategoryModal(false); setEditCategory(null); }}>Cancel</button>
          </div>
        </>
      ))}

      {/* Admin Modal */}
      {renderModal(showAdminModal, () => setShowAdminModal(false), "Add Admin User", (
        <>
          <p style={{ fontSize: 13, color: "hsl(220 10% 50%)", marginBottom: 16 }}>Enter the username or email prefix of the user. They must have an account.</p>
          <div className="admin-form-group">
            <label className="admin-form-label">Username or Email</label>
            <input className="admin-form-input" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="e.g. john or john@example.com" />
          </div>
          <div className="admin-form-actions">
            <button className="admin-btn admin-btn-primary" onClick={addAdmin}>Add Admin</button>
            <button className="admin-btn" style={{ background: "hsl(220 20% 93%)" }} onClick={() => setShowAdminModal(false)}>Cancel</button>
          </div>
        </>
      ))}

      {/* Wallet Action Modal */}
      {renderModal(!!walletAction, () => setWalletAction(null), `${walletAction === "credit" ? "Credit" : "Debit"} Wallet — ${selectedUser?.username || ""}`, (
        <>
          <p style={{ fontSize: 13, color: "hsl(220 10% 50%)", marginBottom: 16 }}>
            Current balance: <strong>₦{selectedUser ? getWalletBalance(selectedUser.user_id).toLocaleString() : 0}</strong>
          </p>
          <div className="admin-form-group">
            <label className="admin-form-label">Amount (₦)</label>
            <input type="number" className="admin-form-input" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} placeholder="Enter amount" />
          </div>
          <div className="admin-form-actions">
            <button className={`admin-btn ${walletAction === "credit" ? "admin-btn-success" : "admin-btn-danger"}`}
              style={{ padding: "10px 20px" }} onClick={handleWalletAction}>
              {walletAction === "credit" ? "💰 Credit" : "💸 Debit"}
            </button>
            <button className="admin-btn" style={{ background: "hsl(220 20% 93%)" }} onClick={() => setWalletAction(null)}>Cancel</button>
          </div>
        </>
      ))}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-logo">
          <div className="logo-dot">G</div>
          Admin Panel
        </div>
        <nav className="admin-nav">
          {NAV.map((n) => (
            <button key={n.tab} className={`admin-nav-item ${tab === n.tab ? "active" : ""}`} onClick={() => switchTab(n.tab)}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <button className="admin-nav-item" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>
          <button className="admin-nav-item" onClick={handleSignOut}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-title">{NAV.find((n) => n.tab === tab)?.icon} {NAV.find((n) => n.tab === tab)?.label || "Admin"}</div>
          {["users", "orders", "transactions"].includes(tab) && (
            <div className="admin-search">
              <span style={{ fontSize: 14 }}>🔍</span>
              <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
        </div>

        <div className="admin-content">
          {/* ═══ OVERVIEW ═══ */}
          {tab === "overview" && (
            <>
              <div className="admin-stats">
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Total Users</div>
                  <div className="admin-stat-val">{profiles.length}</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Total Orders</div>
                  <div className="admin-stat-val">{orders.length}</div>
                  <div className="admin-stat-sub">{pendingOrders} pending · {completedOrders} completed</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Revenue</div>
                  <div className="admin-stat-val">₦{totalRevenue.toLocaleString()}</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Products</div>
                  <div className="admin-stat-val">{products.length}</div>
                  <div className="admin-stat-sub">{products.filter((p) => p.is_active).length} active</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Categories</div>
                  <div className="admin-stat-val">{categories.length}</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Transactions</div>
                  <div className="admin-stat-val">{transactions.length}</div>
                </div>
              </div>

              {/* Recent orders - desktop table */}
              <div className="admin-table-wrap">
                <div className="admin-table-header">
                  <div className="admin-table-title">Recent Orders</div>
                </div>
                <table className="admin-table">
                  <thead><tr><th>ID</th><th>User</th><th>Product</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {orders.slice(0, 8).map((o) => (
                      <tr key={o.id}>
                        <td>#{o.id.slice(0, 6)}</td>
                        <td>{getUserName(o.user_id)}</td>
                        <td>{o.product_title}</td>
                        <td style={{ fontWeight: 700 }}>₦{Number(o.total_price).toLocaleString()}</td>
                        <td><span className={`admin-status admin-status-${o.status}`}>{o.status}</span></td>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">📦</div>No orders yet</div>}
              </div>

              {/* Recent orders - mobile cards */}
              <div className="admin-card-list">
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: "hsl(220 20% 12%)" }}>Recent Orders</div>
                {orders.slice(0, 8).map((o) => (
                  <div className="admin-card-item" key={o.id}>
                    <div className="admin-card-item-row">
                      <span className="admin-card-item-label">Product</span>
                      <span className="admin-card-item-value">{o.product_title}</span>
                    </div>
                    <div className="admin-card-item-row">
                      <span className="admin-card-item-label">User</span>
                      <span className="admin-card-item-value">{getUserName(o.user_id)}</span>
                    </div>
                    <div className="admin-card-item-row">
                      <span className="admin-card-item-label">Amount</span>
                      <span className="admin-card-item-value" style={{ fontWeight: 700 }}>₦{Number(o.total_price).toLocaleString()}</span>
                    </div>
                    <div className="admin-card-item-row">
                      <span className="admin-card-item-label">Status</span>
                      <span className={`admin-status admin-status-${o.status}`}>{o.status}</span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">📦</div>No orders yet</div>}
              </div>
            </>
          )}

          {/* ═══ USERS ═══ */}
          {tab === "users" && (
            <>
              {selectedUser ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <button className="admin-btn" style={{ background: "hsl(220 20% 93%)" }} onClick={() => setSelectedUser(null)}>
                      ← Back to Users
                    </button>
                  </div>
                  <div className="admin-user-detail">
                    <div className="admin-user-detail-header">
                      <div className="admin-user-detail-info">
                        <div className="admin-user-avatar">
                          {(selectedUser.username || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="admin-user-detail-name">{selectedUser.username || "Unknown"}</div>
                          <div className="admin-user-detail-id">{selectedUser.user_id}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {isUserAdmin(selectedUser.user_id) && <span className="admin-status admin-status-active">Admin</span>}
                        {selectedUser.is_blocked && <span className="admin-status admin-status-blocked">Blocked</span>}
                      </div>
                    </div>
                    <div className="admin-user-detail-stats">
                      <div>
                        <div className="admin-stat-label">Wallet Balance</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "hsl(220 20% 12%)" }}>₦{getWalletBalance(selectedUser.user_id).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="admin-stat-label">Total Orders</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "hsl(220 20% 12%)" }}>{getUserOrders(selectedUser.user_id).length}</div>
                      </div>
                      <div>
                        <div className="admin-stat-label">Transactions</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "hsl(220 20% 12%)" }}>{getUserTransactions(selectedUser.user_id).length}</div>
                      </div>
                      <div>
                        <div className="admin-stat-label">Joined</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(220 20% 12%)", marginTop: 4 }}>{new Date(selectedUser.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="admin-user-detail-actions">
                      <button className="admin-btn admin-btn-success" onClick={() => { setWalletAction("credit"); setWalletAmount(""); }}>
                        💰 Credit Wallet
                      </button>
                      <button className="admin-btn admin-btn-danger" onClick={() => { setWalletAction("debit"); setWalletAmount(""); }}>
                        💸 Debit Wallet
                      </button>
                      <button
                        className={`admin-btn ${selectedUser.is_blocked ? "admin-btn-success" : "admin-btn-danger"}`}
                        onClick={() => toggleBlockUser(selectedUser.user_id)}
                      >
                        {selectedUser.is_blocked ? "✅ Unblock User" : "🚫 Block User"}
                      </button>
                    </div>
                  </div>

                  {/* User's orders */}
                  <div className="admin-table-wrap" style={{ marginBottom: 20 }}>
                    <div className="admin-table-header">
                      <div className="admin-table-title">Orders ({getUserOrders(selectedUser.user_id).length})</div>
                    </div>
                    <table className="admin-table">
                      <thead><tr><th>Product</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                      <tbody>
                        {getUserOrders(selectedUser.user_id).map((o) => (
                          <tr key={o.id}>
                            <td>{o.product_title}</td>
                            <td style={{ fontWeight: 700 }}>₦{Number(o.total_price).toLocaleString()}</td>
                            <td><span className={`admin-status admin-status-${o.status}`}>{o.status}</span></td>
                            <td>{new Date(o.created_at).toLocaleDateString()}</td>
                            <td>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => updateOrderStatus(o.id, "completed")}>✓</button>
                                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => updateOrderStatus(o.id, "cancelled")}>✕</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {getUserOrders(selectedUser.user_id).length === 0 && <div className="admin-empty" style={{ padding: 30 }}>No orders</div>}
                  </div>

                  {/* Mobile cards for user orders */}
                  <div className="admin-card-list" style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Orders ({getUserOrders(selectedUser.user_id).length})</div>
                    {getUserOrders(selectedUser.user_id).map((o) => (
                      <div className="admin-card-item" key={o.id}>
                        <div className="admin-card-item-row"><span className="admin-card-item-label">Product</span><span className="admin-card-item-value">{o.product_title}</span></div>
                        <div className="admin-card-item-row"><span className="admin-card-item-label">Amount</span><span className="admin-card-item-value">₦{Number(o.total_price).toLocaleString()}</span></div>
                        <div className="admin-card-item-row"><span className="admin-card-item-label">Status</span><span className={`admin-status admin-status-${o.status}`}>{o.status}</span></div>
                        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                          <button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => updateOrderStatus(o.id, "completed")}>✓ Complete</button>
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => updateOrderStatus(o.id, "cancelled")}>✕ Cancel</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* User's transactions */}
                  <div className="admin-table-wrap">
                    <div className="admin-table-header">
                      <div className="admin-table-title">Transactions ({getUserTransactions(selectedUser.user_id).length})</div>
                    </div>
                    <table className="admin-table">
                      <thead><tr><th>Type</th><th>Amount</th><th>Description</th><th>Date</th></tr></thead>
                      <tbody>
                        {getUserTransactions(selectedUser.user_id).map((t) => (
                          <tr key={t.id}>
                            <td><span className={`admin-status ${t.type === "credit" ? "admin-status-active" : "admin-status-blocked"}`}>{t.type}</span></td>
                            <td style={{ fontWeight: 700 }}>₦{Number(t.amount).toLocaleString()}</td>
                            <td>{t.description}</td>
                            <td>{new Date(t.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {getUserTransactions(selectedUser.user_id).length === 0 && <div className="admin-empty" style={{ padding: 30 }}>No transactions</div>}
                  </div>

                  <div className="admin-card-list">
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Transactions ({getUserTransactions(selectedUser.user_id).length})</div>
                    {getUserTransactions(selectedUser.user_id).map((t) => (
                      <div className="admin-card-item" key={t.id}>
                        <div className="admin-card-item-row"><span className="admin-card-item-label">Type</span><span className={`admin-status ${t.type === "credit" ? "admin-status-active" : "admin-status-blocked"}`}>{t.type}</span></div>
                        <div className="admin-card-item-row"><span className="admin-card-item-label">Amount</span><span className="admin-card-item-value">₦{Number(t.amount).toLocaleString()}</span></div>
                        <div className="admin-card-item-row"><span className="admin-card-item-label">Description</span><span className="admin-card-item-value">{t.description}</span></div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="admin-table-wrap">
                    <div className="admin-table-header">
                      <div className="admin-table-title">All Users ({filteredProfiles.length})</div>
                    </div>
                    <table className="admin-table">
                      <thead><tr><th>Username</th><th>Balance</th><th>Orders</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
                      <tbody>
                        {filteredProfiles.map((p) => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600 }}>{p.username || "—"}</td>
                            <td style={{ fontWeight: 700 }}>₦{getWalletBalance(p.user_id).toLocaleString()}</td>
                            <td>{getUserOrders(p.user_id).length}</td>
                            <td>{isUserAdmin(p.user_id) ? <span className="admin-status admin-status-active">Admin</span> : <span className="admin-status">User</span>}</td>
                            <td>{new Date(p.created_at).toLocaleDateString()}</td>
                            <td>
                              <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setSelectedUser(p)}>
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredProfiles.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">👥</div>No users found</div>}
                  </div>

                  {/* Mobile cards */}
                  <div className="admin-card-list">
                    {filteredProfiles.map((p) => (
                      <div className="admin-card-item" key={p.id} onClick={() => setSelectedUser(p)} style={{ cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                          <div className="admin-user-avatar" style={{ width: 38, height: 38, fontSize: 14, borderRadius: 10 }}>
                            {(p.username || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{p.username || "—"}</div>
                            <div style={{ fontSize: 11, color: "hsl(220 10% 50%)" }}>{new Date(p.created_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{ marginLeft: "auto" }}>
                            {isUserAdmin(p.user_id) && <span className="admin-status admin-status-active">Admin</span>}
                          </div>
                        </div>
                        <div className="admin-card-item-row">
                          <span className="admin-card-item-label">Balance</span>
                          <span className="admin-card-item-value">₦{getWalletBalance(p.user_id).toLocaleString()}</span>
                        </div>
                        <div className="admin-card-item-row">
                          <span className="admin-card-item-label">Orders</span>
                          <span className="admin-card-item-value">{getUserOrders(p.user_id).length}</span>
                        </div>
                      </div>
                    ))}
                    {filteredProfiles.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">👥</div>No users found</div>}
                  </div>
                </>
              )}
            </>
          )}

          {/* ═══ ORDERS ═══ */}
          {tab === "orders" && (
            <>
              <div className="admin-table-wrap">
                <div className="admin-table-header">
                  <div className="admin-table-title">All Orders ({filteredOrders.length})</div>
                </div>
                <table className="admin-table">
                  <thead><tr><th>ID</th><th>User</th><th>Product</th><th>Platform</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.id}>
                        <td>#{o.id.slice(0, 6)}</td>
                        <td style={{ cursor: "pointer", color: "hsl(230 65% 55%)", fontWeight: 600 }} onClick={() => {
                          const user = profiles.find((p) => p.user_id === o.user_id);
                          if (user) { setSelectedUser(user); setTab("users"); }
                        }}>{getUserName(o.user_id)}</td>
                        <td>{o.product_title}</td>
                        <td>{o.product_platform}</td>
                        <td style={{ fontWeight: 700 }}>₦{Number(o.total_price).toLocaleString()}</td>
                        <td><span className={`admin-status admin-status-${o.status}`}>{o.status}</span></td>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => updateOrderStatus(o.id, "completed")}>✓</button>
                            <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => updateOrderStatus(o.id, "cancelled")}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredOrders.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">📦</div>No orders found</div>}
              </div>

              <div className="admin-card-list">
                {filteredOrders.map((o) => (
                  <div className="admin-card-item" key={o.id}>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">ID</span><span className="admin-card-item-value">#{o.id.slice(0, 6)}</span></div>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">User</span><span className="admin-card-item-value" style={{ color: "hsl(230 65% 55%)", cursor: "pointer" }} onClick={() => {
                      const user = profiles.find((p) => p.user_id === o.user_id);
                      if (user) { setSelectedUser(user); setTab("users"); }
                    }}>{getUserName(o.user_id)}</span></div>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">Product</span><span className="admin-card-item-value">{o.product_title}</span></div>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">Amount</span><span className="admin-card-item-value" style={{ fontWeight: 700 }}>₦{Number(o.total_price).toLocaleString()}</span></div>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">Status</span><span className={`admin-status admin-status-${o.status}`}>{o.status}</span></div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => updateOrderStatus(o.id, "completed")}>✓ Complete</button>
                      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => updateOrderStatus(o.id, "cancelled")}>✕ Cancel</button>
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">📦</div>No orders</div>}
              </div>
            </>
          )}

          {/* ═══ PRODUCTS ═══ */}
          {tab === "products" && (
            <>
              <div className="admin-table-wrap">
                <div className="admin-table-header">
                  <div className="admin-table-title">All Products ({products.length})</div>
                  <button className="admin-btn admin-btn-primary" onClick={() => {
                    setEditProduct(null);
                    setProductForm({ title: "", description: "", price: 0, stock: 0, platform: "", category_id: "", currency: "NGN" });
                    setShowProductModal(true);
                  }}>+ Add Product</button>
                </div>
                <table className="admin-table">
                  <thead><tr><th>Title</th><th>Platform</th><th>Price</th><th>Stock</th><th>Active</th><th>Actions</th></tr></thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.title}</td>
                        <td>{p.platform}</td>
                        <td>₦{Number(p.price).toLocaleString()}</td>
                        <td>{p.stock}</td>
                        <td>{p.is_active ? <span className="admin-status admin-status-active">Active</span> : <span className="admin-status admin-status-blocked">Inactive</span>}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="admin-btn admin-btn-sm" style={{ background: "hsl(220 20% 93%)" }} onClick={() => {
                              setEditProduct(p);
                              setProductForm({ title: p.title, description: p.description, price: p.price, stock: p.stock, platform: p.platform, category_id: p.category_id, currency: p.currency });
                              setShowProductModal(true);
                            }}>✏️</button>
                            <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => deleteProduct(p.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">🛍️</div>No products yet<br /><button className="admin-btn admin-btn-primary" style={{ marginTop: 12 }} onClick={() => setShowProductModal(true)}>Add First Product</button></div>}
              </div>

              <div className="admin-card-list">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Products ({products.length})</div>
                  <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => {
                    setEditProduct(null);
                    setProductForm({ title: "", description: "", price: 0, stock: 0, platform: "", category_id: "", currency: "NGN" });
                    setShowProductModal(true);
                  }}>+ Add</button>
                </div>
                {products.map((p) => (
                  <div className="admin-card-item" key={p.id}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{p.title}</div>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">Platform</span><span className="admin-card-item-value">{p.platform}</span></div>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">Price</span><span className="admin-card-item-value">₦{Number(p.price).toLocaleString()}</span></div>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">Stock</span><span className="admin-card-item-value">{p.stock}</span></div>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">Status</span>{p.is_active ? <span className="admin-status admin-status-active">Active</span> : <span className="admin-status admin-status-blocked">Inactive</span>}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <button className="admin-btn admin-btn-sm" style={{ background: "hsl(220 20% 93%)" }} onClick={() => {
                        setEditProduct(p);
                        setProductForm({ title: p.title, description: p.description, price: p.price, stock: p.stock, platform: p.platform, category_id: p.category_id, currency: p.currency });
                        setShowProductModal(true);
                      }}>✏️ Edit</button>
                      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => deleteProduct(p.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ═══ CATEGORIES ═══ */}
          {tab === "categories" && (
            <>
              <div className="admin-table-wrap">
                <div className="admin-table-header">
                  <div className="admin-table-title">Categories ({categories.length})</div>
                  <button className="admin-btn admin-btn-primary" onClick={() => {
                    setEditCategory(null);
                    setCategoryForm({ name: "", slug: "", emoji: "", display_order: 0 });
                    setShowCategoryModal(true);
                  }}>+ Add Category</button>
                </div>
                <table className="admin-table">
                  <thead><tr><th>Emoji</th><th>Name</th><th>Slug</th><th>Order</th><th>Actions</th></tr></thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontSize: 20 }}>{c.emoji || "—"}</td>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 12 }}>{c.slug}</td>
                        <td>{c.display_order}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="admin-btn admin-btn-sm" style={{ background: "hsl(220 20% 93%)" }} onClick={() => {
                              setEditCategory(c);
                              setCategoryForm({ name: c.name, slug: c.slug, emoji: c.emoji || "", display_order: c.display_order });
                              setShowCategoryModal(true);
                            }}>✏️</button>
                            <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => deleteCategory(c.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {categories.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">📁</div>No categories yet</div>}
              </div>

              <div className="admin-card-list">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Categories ({categories.length})</div>
                  <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => {
                    setEditCategory(null);
                    setCategoryForm({ name: "", slug: "", emoji: "", display_order: 0 });
                    setShowCategoryModal(true);
                  }}>+ Add</button>
                </div>
                {categories.map((c) => (
                  <div className="admin-card-item" key={c.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 22 }}>{c.emoji || "📁"}</span>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                    </div>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">Slug</span><span className="admin-card-item-value" style={{ fontFamily: "monospace", fontSize: 12 }}>{c.slug}</span></div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <button className="admin-btn admin-btn-sm" style={{ background: "hsl(220 20% 93%)" }} onClick={() => {
                        setEditCategory(c);
                        setCategoryForm({ name: c.name, slug: c.slug, emoji: c.emoji || "", display_order: c.display_order });
                        setShowCategoryModal(true);
                      }}>✏️ Edit</button>
                      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => deleteCategory(c.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ═══ TRANSACTIONS ═══ */}
          {tab === "transactions" && (
            <>
              <div className="admin-table-wrap">
                <div className="admin-table-header">
                  <div className="admin-table-title">All Transactions ({filteredTransactions.length})</div>
                </div>
                <table className="admin-table">
                  <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Description</th><th>Reference</th><th>Date</th></tr></thead>
                  <tbody>
                    {filteredTransactions.map((t) => (
                      <tr key={t.id}>
                        <td style={{ cursor: "pointer", color: "hsl(230 65% 55%)", fontWeight: 600 }} onClick={() => {
                          const user = profiles.find((p) => p.user_id === t.user_id);
                          if (user) { setSelectedUser(user); setTab("users"); }
                        }}>{getUserName(t.user_id)}</td>
                        <td><span className={`admin-status ${t.type === "credit" ? "admin-status-active" : "admin-status-blocked"}`}>{t.type}</span></td>
                        <td style={{ fontWeight: 700 }}>₦{Number(t.amount).toLocaleString()}</td>
                        <td>{t.description}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{t.reference || "—"}</td>
                        <td>{new Date(t.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTransactions.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">💰</div>No transactions</div>}
              </div>

              <div className="admin-card-list">
                {filteredTransactions.map((t) => (
                  <div className="admin-card-item" key={t.id}>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">User</span><span className="admin-card-item-value" style={{ color: "hsl(230 65% 55%)", cursor: "pointer" }} onClick={() => {
                      const user = profiles.find((p) => p.user_id === t.user_id);
                      if (user) { setSelectedUser(user); setTab("users"); }
                    }}>{getUserName(t.user_id)}</span></div>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">Type</span><span className={`admin-status ${t.type === "credit" ? "admin-status-active" : "admin-status-blocked"}`}>{t.type}</span></div>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">Amount</span><span className="admin-card-item-value" style={{ fontWeight: 700 }}>₦{Number(t.amount).toLocaleString()}</span></div>
                    <div className="admin-card-item-row"><span className="admin-card-item-label">Description</span><span className="admin-card-item-value">{t.description}</span></div>
                  </div>
                ))}
                {filteredTransactions.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">💰</div>No transactions</div>}
              </div>
            </>
          )}

          {/* ═══ ADMINS ═══ */}
          {tab === "admins" && (
            <>
              <div className="admin-table-wrap">
                <div className="admin-table-header">
                  <div className="admin-table-title">Admin Users ({roles.filter((r) => r.role === "admin").length})</div>
                  <button className="admin-btn admin-btn-primary" onClick={() => setShowAdminModal(true)}>+ Add Admin</button>
                </div>
                <table className="admin-table">
                  <thead><tr><th>Username</th><th>User ID</th><th>Role</th><th>Added</th><th>Actions</th></tr></thead>
                  <tbody>
                    {roles.filter((r) => r.role === "admin").map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{getUserName(r.user_id)}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{r.user_id.slice(0, 12)}...</td>
                        <td><span className="admin-status admin-status-active">{r.role}</span></td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => removeAdmin(r.id)}>🗑️ Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-card-list">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Admins ({roles.filter((r) => r.role === "admin").length})</div>
                  <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setShowAdminModal(true)}>+ Add</button>
                </div>
                {roles.filter((r) => r.role === "admin").map((r) => (
                  <div className="admin-card-item" key={r.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div className="admin-user-avatar" style={{ width: 36, height: 36, fontSize: 13, borderRadius: 10 }}>
                        {getUserName(r.user_id)[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{getUserName(r.user_id)}</div>
                        <div style={{ fontSize: 11, color: "hsl(220 10% 50%)" }}>{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => removeAdmin(r.id)}>🗑️ Remove Admin</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
