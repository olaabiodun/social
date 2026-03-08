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
}

interface Wallet {
  user_id: string;
  balance: number;
}

interface Order {
  id: string;
  user_id: string;
  product_title: string;
  product_platform: string;
  total_price: number;
  status: string;
  created_at: string;
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
  { label: "Overview", icon: "fa-solid fa-chart-pie", tab: "overview" },
  { label: "Users", icon: "fa-solid fa-users", tab: "users" },
  { label: "Orders", icon: "fa-solid fa-box", tab: "orders" },
  { label: "Products", icon: "fa-solid fa-bag-shopping", tab: "products" },
  { label: "Categories", icon: "fa-solid fa-layer-group", tab: "categories" },
  { label: "Transactions", icon: "fa-solid fa-money-bill-transfer", tab: "transactions" },
  { label: "Admin Roles", icon: "fa-solid fa-shield-halved", tab: "admins" },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [search, setSearch] = useState("");

  // Data
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  // Form state
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

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_price), 0);

  // Order status update
  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) { toast.error("Failed to update order"); return; }
    toast.success(`Order status updated to ${status}`);
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
      if (error) { toast.error("Failed to update category"); return; }
      toast.success("Category updated");
    } else {
      const { error } = await supabase.from("categories").insert(categoryForm);
      if (error) { toast.error("Failed to create category"); return; }
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
    // Find user by looking up profiles - we need to find the user_id
    // Since we can't query auth.users directly, we'll use an edge function approach
    // For now, check profiles for matching username/email pattern
    const { data: allProfiles } = await supabase.from("profiles").select("user_id, username");
    if (!allProfiles) { toast.error("Could not load users"); return; }
    
    // Try to match by username (which is often the email prefix)
    const match = allProfiles.find((p) => 
      p.username?.toLowerCase() === adminEmail.toLowerCase() || 
      p.username?.toLowerCase() === adminEmail.split("@")[0].toLowerCase()
    );
    
    if (!match) { toast.error("User not found. Make sure they have signed up first."); return; }
    
    const { error } = await supabase.from("user_roles").insert({ user_id: match.user_id, role: "admin" });
    if (error) {
      if (error.code === "23505") toast.error("User is already an admin");
      else toast.error("Failed to add admin");
      return;
    }
    toast.success("Admin role added!");
    setAdminEmail("");
    setShowAdminModal(false);
    loadAll();
  };

  const removeAdmin = async (roleId: string) => {
    if (!confirm("Remove this admin role?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) { toast.error("Failed to remove"); return; }
    toast.success("Admin role removed");
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
    !search || o.product_title.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
  );

  return (
    <div className="admin-layout">
      {/* Product Modal */}
      {showProductModal && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowProductModal(false); }}>
          <div className="admin-modal">
            <h3>{editProduct ? "Edit Product" : "Add Product"}</h3>
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
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div className="admin-form-group" style={{ flex: 1 }}>
                <label className="admin-form-label">Price (NGN)</label>
                <input type="number" className="admin-form-input" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
              </div>
              <div className="admin-form-group" style={{ flex: 1 }}>
                <label className="admin-form-label">Stock</label>
                <input type="number" className="admin-form-input" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} />
              </div>
            </div>
            <div className="admin-form-actions">
              <button className="admin-btn admin-btn-primary" onClick={saveProduct}>{editProduct ? "Update" : "Create"} Product</button>
              <button className="admin-btn" style={{ background: "hsl(220 20% 93%)" }} onClick={() => { setShowProductModal(false); setEditProduct(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCategoryModal(false); }}>
          <div className="admin-modal">
            <h3>{editCategory ? "Edit Category" : "Add Category"}</h3>
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
                <label className="admin-form-label">Display Order</label>
                <input type="number" className="admin-form-input" value={categoryForm.display_order} onChange={(e) => setCategoryForm({ ...categoryForm, display_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="admin-form-actions">
              <button className="admin-btn admin-btn-primary" onClick={saveCategory}>{editCategory ? "Update" : "Create"} Category</button>
              <button className="admin-btn" style={{ background: "hsl(220 20% 93%)" }} onClick={() => { setShowCategoryModal(false); setEditCategory(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAdminModal(false); }}>
          <div className="admin-modal">
            <h3>Add Admin User</h3>
            <p style={{ fontSize: 13, color: "hsl(220 10% 50%)", marginBottom: 16 }}>Enter the username or email prefix of the user you want to make admin. The user must have an account first.</p>
            <div className="admin-form-group">
              <label className="admin-form-label">Username or Email</label>
              <input className="admin-form-input" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="e.g. abiodun2035 or abiodun2035@gmail.com" />
            </div>
            <div className="admin-form-actions">
              <button className="admin-btn admin-btn-primary" onClick={addAdmin}>Add Admin</button>
              <button className="admin-btn" style={{ background: "hsl(220 20% 93%)" }} onClick={() => setShowAdminModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <div className="logo-dot">G</div>
          Admin Panel
        </div>
        <nav className="admin-nav">
          {NAV.map((n) => (
            <button key={n.tab} className={`admin-nav-item ${tab === n.tab ? "active" : ""}`} onClick={() => { setTab(n.tab); setSearch(""); }}>
              <i className={n.icon} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <button className="admin-nav-item" onClick={() => navigate("/dashboard")}>
            <i className="fa-solid fa-arrow-left" /> Back to Dashboard
          </button>
          <button className="admin-nav-item" onClick={handleSignOut}>
            <i className="fa-solid fa-arrow-right-from-bracket" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-title">{NAV.find((n) => n.tab === tab)?.label || "Admin"}</div>
          {["users", "orders", "transactions"].includes(tab) && (
            <div className="admin-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
        </div>

        <div className="admin-content">
          {/* OVERVIEW */}
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
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Total Revenue</div>
                  <div className="admin-stat-val">₦{totalRevenue.toLocaleString()}</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Products</div>
                  <div className="admin-stat-val">{products.length}</div>
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

              <div className="admin-table-wrap">
                <div className="admin-table-header">
                  <div className="admin-table-title">Recent Orders</div>
                </div>
                <table className="admin-table">
                  <thead><tr><th>Order ID</th><th>User</th><th>Product</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {orders.slice(0, 10).map((o) => (
                      <tr key={o.id}>
                        <td>#{o.id.slice(0, 6)}</td>
                        <td>{getUserName(o.user_id)}</td>
                        <td>{o.product_title}</td>
                        <td>₦{Number(o.total_price).toLocaleString()}</td>
                        <td><span className={`admin-status admin-status-${o.status}`}>{o.status}</span></td>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">📦</div>No orders yet</div>}
              </div>
            </>
          )}

          {/* USERS */}
          {tab === "users" && (
            <div className="admin-table-wrap">
              <div className="admin-table-header">
                <div className="admin-table-title">All Users ({filteredProfiles.length})</div>
              </div>
              <table className="admin-table">
                <thead><tr><th>Username</th><th>User ID</th><th>Balance</th><th>Role</th><th>Joined</th></tr></thead>
                <tbody>
                  {filteredProfiles.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.username || "—"}</td>
                      <td style={{ fontSize: 11, fontFamily: "monospace" }}>{p.user_id.slice(0, 12)}...</td>
                      <td style={{ fontWeight: 600 }}>₦{getWalletBalance(p.user_id).toLocaleString()}</td>
                      <td>{isUserAdmin(p.user_id) ? <span className="admin-status admin-status-active">Admin</span> : <span className="admin-status">User</span>}</td>
                      <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProfiles.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">👥</div>No users found</div>}
            </div>
          )}

          {/* ORDERS */}
          {tab === "orders" && (
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
                      <td>{getUserName(o.user_id)}</td>
                      <td>{o.product_title}</td>
                      <td>{o.product_platform}</td>
                      <td style={{ fontWeight: 600 }}>₦{Number(o.total_price).toLocaleString()}</td>
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
          )}

          {/* PRODUCTS */}
          {tab === "products" && (
            <div className="admin-table-wrap">
              <div className="admin-table-header">
                <div className="admin-table-title">All Products ({products.length})</div>
                <button className="admin-btn admin-btn-primary" onClick={() => {
                  setEditProduct(null);
                  setProductForm({ title: "", description: "", price: 0, stock: 0, platform: "", category_id: "", currency: "NGN" });
                  setShowProductModal(true);
                }}><i className="fa-solid fa-plus" /> Add Product</button>
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
                          }}><i className="fa-solid fa-pen" /></button>
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => deleteProduct(p.id)}><i className="fa-solid fa-trash" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">🛍️</div>No products yet<br /><button className="admin-btn admin-btn-primary" style={{ marginTop: 12 }} onClick={() => setShowProductModal(true)}>Add First Product</button></div>}
            </div>
          )}

          {/* CATEGORIES */}
          {tab === "categories" && (
            <div className="admin-table-wrap">
              <div className="admin-table-header">
                <div className="admin-table-title">All Categories ({categories.length})</div>
                <button className="admin-btn admin-btn-primary" onClick={() => {
                  setEditCategory(null);
                  setCategoryForm({ name: "", slug: "", emoji: "", display_order: 0 });
                  setShowCategoryModal(true);
                }}><i className="fa-solid fa-plus" /> Add Category</button>
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
                          }}><i className="fa-solid fa-pen" /></button>
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => deleteCategory(c.id)}><i className="fa-solid fa-trash" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {categories.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">📁</div>No categories yet</div>}
            </div>
          )}

          {/* TRANSACTIONS */}
          {tab === "transactions" && (
            <div className="admin-table-wrap">
              <div className="admin-table-header">
                <div className="admin-table-title">All Transactions ({transactions.length})</div>
              </div>
              <table className="admin-table">
                <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Description</th><th>Reference</th><th>Date</th></tr></thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{getUserName(t.user_id)}</td>
                      <td><span className={`admin-status ${t.type === "credit" ? "admin-status-active" : "admin-status-blocked"}`}>{t.type}</span></td>
                      <td style={{ fontWeight: 600 }}>₦{Number(t.amount).toLocaleString()}</td>
                      <td>{t.description}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 11 }}>{t.reference || "—"}</td>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && <div className="admin-empty"><div className="admin-empty-icon">💰</div>No transactions yet</div>}
            </div>
          )}

          {/* ADMINS */}
          {tab === "admins" && (
            <div className="admin-table-wrap">
              <div className="admin-table-header">
                <div className="admin-table-title">Admin Users ({roles.filter((r) => r.role === "admin").length})</div>
                <button className="admin-btn admin-btn-primary" onClick={() => setShowAdminModal(true)}><i className="fa-solid fa-plus" /> Add Admin</button>
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
                        <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => removeAdmin(r.id)}>
                          <i className="fa-solid fa-trash" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
