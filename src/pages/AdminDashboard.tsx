import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Bell, 
  TrendingUp, 
  AlertCircle,
  Truck,
  Plus,
  MessageSquare,
  LogOut,
  X,
  Settings,
  Tag,
  MapPin,
  Edit,
  Trash2,
  DollarSign,
  CreditCard,
  Upload,
  Phone,
  User,
  LayoutGrid,
  CheckCircle2
} from 'lucide-react';
import { useNotifications } from '../components/NotificationProvider';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { notifications, markAsRead } = useNotifications();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'notifications' | 'orders' | 'products' | 'chats' | 'offers' | 'settings' | 'categories'>('overview');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [settings, setSettings] = useState({ free_shipping: '0', return_policy: '7' });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', original_price: '', stock: '', category_id: '1', description: '', image_url: 'https://picsum.photos/seed/new/400/400', location: '', is_flash_sale: false
  });
  const [newOffer, setNewOffer] = useState({
    title: '', discount_percent: '', image_url: 'https://picsum.photos/seed/offer/800/400'
  });
  const navigate = useNavigate();

  const adminToken = localStorage.getItem('adminToken');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'offer') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'product') {
          setNewProduct({ ...newProduct, image_url: base64String });
        } else {
          setNewOffer({ ...newOffer, image_url: base64String });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${adminToken}` };
    
    try {
      const [ordersRes, productsRes, chatsRes, offersRes, categoriesRes, settingsRes] = await Promise.all([
        fetch('/api/orders', { headers }),
        fetch('/api/products', { headers }),
        fetch('/api/admin/chats', { headers }),
        fetch('/api/offers', { headers }),
        fetch('/api/categories'),
        fetch('/api/settings')
      ]);

      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
      if (chatsRes.ok) setChats(await chatsRes.json());
      if (offersRes.ok) setOffers(await offersRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchData();
    } else {
      navigate('/admin/login');
    }
  }, [adminToken, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const updateOrderStatus = async (id: number, status: string) => {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      alert('Please fill in all required fields (Name, Price, Stock)');
      return;
    }

    setIsSavingProduct(true);
    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
    const method = editingProduct ? 'PUT' : 'POST';
    
    // Parse numbers to ensure they are sent correctly
    const price = parseFloat(newProduct.price);
    const original_price = newProduct.original_price ? parseFloat(newProduct.original_price) : price;
    const stock = parseInt(newProduct.stock, 10);
    const category_id = parseInt(newProduct.category_id, 10);

    if (isNaN(price) || isNaN(stock)) {
      alert('Price and Stock must be valid numbers');
      setIsSavingProduct(false);
      return;
    }

    const payload = {
      ...newProduct,
      price,
      original_price,
      stock,
      category_id,
      is_flash_sale: newProduct.is_flash_sale ? 1 : 0
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchData();
        setShowProductModal(false);
        setEditingProduct(null);
        setNewProduct({
          name: '', price: '', original_price: '', stock: '', category_id: '1', description: '', image_url: 'https://picsum.photos/seed/new/400/400', location: '', is_flash_sale: false
        });
      } else {
        const errData = await response.json();
        alert(`Error: ${errData.error || 'Failed to save product'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const response = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    if (response.ok) fetchData();
  };

  const handleMarkAsSold = async (id: number) => {
    if (!confirm('Mark this product as sold? (Stock will be set to 0)')) return;
    const response = await fetch(`/api/admin/products/${id}/sold`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    if (response.ok) fetchData();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const response = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: newCategoryName }),
    });
    if (response.ok) {
      setNewCategoryName('');
      setShowCategoryModal(false);
      fetchData();
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure? Products in this category might become unassigned.')) return;
    const response = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    if (response.ok) fetchData();
  };

  const handleDeleteOffer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    const response = await fetch(`/api/admin/offers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    if (response.ok) fetchData();
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(settings),
    });
    if (response.ok) alert('Settings updated!');
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingOffer ? `/api/admin/offers/${editingOffer.id}` : '/api/admin/offers';
    const method = editingOffer ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(newOffer),
    });

    if (response.ok) {
      fetchData();
      setShowOfferModal(false);
      setEditingOffer(null);
      setNewOffer({
        title: '', discount_percent: '', image_url: 'https://picsum.photos/seed/offer/800/400'
      });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter">
              <span className="text-orange-500">Sechand</span> Deal
              <span className="ml-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Manager</span>
            </h1>
          </motion.div>
          <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <LogOut size={20} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-500 p-4 rounded-2xl text-white shadow-lg shadow-orange-500/20">
            <TrendingUp size={20} className="mb-2" />
            <div className="text-2xl font-bold">Rs. {orders.filter(o => o.payment_status === 'paid').reduce((acc, o) => acc + o.total, 0).toLocaleString()}</div>
            <div className="text-[10px] font-medium opacity-80">Total Revenue</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <ShoppingBag size={20} className="text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{orders.filter(o => o.payment_status === 'paid' || o.payment_method === 'cod').length}</div>
            <div className="text-[10px] font-medium text-gray-400">Valid Orders</div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 px-6 py-4 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
          { id: 'orders', icon: Package, label: 'Orders' },
          { id: 'products', icon: ShoppingBag, label: 'Products' },
          { id: 'offers', icon: Tag, label: 'Offers' },
          { id: 'categories', icon: LayoutGrid, label: 'Categories' },
          { id: 'chats', icon: MessageSquare, label: 'Chats' },
          { id: 'notifications', icon: Bell, label: 'Alerts' },
          { id: 'settings', icon: Settings, label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full transition-all ${
              activeTab === tab.id 
                ? 'bg-gray-900 text-white shadow-lg' 
                : 'bg-white text-gray-500 border border-gray-100'
            }`}
          >
            <tab.icon size={16} />
            <span className="text-xs font-bold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Recent Notifications</h3>
                  <button onClick={() => setActiveTab('notifications')} className="text-orange-500 text-xs font-bold">View All</button>
                </div>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((n) => (
                    <div key={n.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        n.type === 'order' ? 'bg-emerald-50 text-emerald-500' :
                        n.type === 'inventory' ? 'bg-amber-50 text-amber-500' :
                        'bg-blue-50 text-blue-500'
                      }`}>
                        {n.type === 'order' && <ShoppingBag size={20} />}
                        {n.type === 'inventory' && <AlertCircle size={20} />}
                        {n.type === 'shipping' && <Truck size={20} />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                        <span className="text-[10px] text-gray-400 mt-2 block">{formatDistanceToNow(new Date(n.created_at))} ago</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => markAsRead(n.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    n.is_read ? 'bg-white border-gray-50 opacity-60' : 'bg-white border-orange-100 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      n.type === 'order' ? 'bg-emerald-100 text-emerald-700' :
                      n.type === 'inventory' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {n.type}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(n.created_at))} ago</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {orders.filter(o => o.status !== 'pending_payment').map((order) => (
                <div key={order.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order #{order.id}</span>
                      <h4 className="font-bold text-gray-900">{order.customer_name} {order.customer_surname}</h4>
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-1">
                          <Phone size={10} className="text-gray-400" />
                          <span className="text-[10px] text-gray-500">{order.customer_contact}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={10} className="text-gray-400" />
                          <span className="text-[10px] text-gray-500">{order.customer_location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard size={10} className="text-gray-400" />
                          <span className="text-[10px] text-gray-400 uppercase">{order.payment_status} ({order.payment_method || 'N/A'})</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-gray-900">Rs. {order.total}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                        className="flex-1 bg-gray-900 text-white text-xs font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
                      >
                        <Truck size={16} /> Mark as Shipped
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 bg-gray-50 text-gray-600 text-xs font-bold py-3 rounded-2xl"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setNewProduct({
                    name: '', price: '', original_price: '', stock: '', category_id: '1', description: '', image_url: 'https://picsum.photos/seed/new/400/400', location: '', is_flash_sale: false
                  });
                  setShowProductModal(true);
                }}
                className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Plus size={20} /> ADD NEW PRODUCT
              </button>

              <div className="grid grid-cols-1 gap-3">
                {products.map((p) => (
                  <div key={p.id} className="bg-white p-3 rounded-2xl border border-gray-100 flex gap-4 items-center">
                    <img src={p.image_url} className="w-16 h-16 rounded-xl object-cover" alt={p.name} />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900">{p.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-orange-500">Rs. {p.price}</span>
                        <span className="text-[10px] text-gray-400">Stock: {p.stock}</span>
                      </div>
                      {p.location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin size={10} className="text-gray-400" />
                          <span className="text-[10px] text-gray-400">{p.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleMarkAsSold(p.id)}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg"
                        title="Mark as Sold"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingProduct(p);
                          setNewProduct({
                            name: p.name,
                            price: p.price.toString(),
                            original_price: p.original_price.toString(),
                            stock: p.stock.toString(),
                            category_id: p.category_id.toString(),
                            description: p.description,
                            image_url: p.image_url,
                            location: p.location || '',
                            is_flash_sale: !!p.is_flash_sale
                          });
                          setShowProductModal(true);
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'chats' && (
            <motion.div
              key="chats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-white p-4 rounded-3xl border border-gray-100 mb-4">
                <h3 className="font-bold text-gray-900 mb-2">Client Inquiries</h3>
                <p className="text-xs text-gray-500">Manage real-time conversations with your customers.</p>
              </div>

              {chats.map((chat) => (
                <div key={chat.id} className={`p-4 rounded-2xl border ${chat.is_admin_reply ? 'bg-gray-50 border-gray-100 ml-8' : 'bg-white border-orange-100'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-gray-900">{chat.is_admin_reply ? 'You' : chat.customer_name}</span>
                    <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(chat.created_at))} ago</span>
                  </div>
                  <p className="text-xs text-gray-700">{chat.message}</p>
                  {!chat.is_admin_reply && (
                    <button className="mt-3 text-orange-500 text-[10px] font-bold uppercase tracking-wider">Reply Now</button>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'offers' && (
            <motion.div
              key="offers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <button 
                onClick={() => setShowOfferModal(true)}
                className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Plus size={20} /> CREATE NEW OFFER
              </button>

              {offers.map((offer) => (
                <div key={offer.id} className="bg-white p-4 rounded-2xl border border-gray-100 overflow-hidden">
                  <img src={offer.image_url} className="w-full h-24 object-cover rounded-xl mb-3" alt={offer.title} />
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{offer.title}</h4>
                      <span className="text-xs text-orange-500 font-bold">{offer.discount_percent}% OFF</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingOffer(offer);
                          setNewOffer({
                            title: offer.title,
                            discount_percent: offer.discount_percent.toString(),
                            image_url: offer.image_url
                          });
                          setShowOfferModal(true);
                        }}
                        className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <button 
                onClick={() => setShowCategoryModal(true)}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                <Plus size={20} /> ADD NEW CATEGORY
              </button>

              <div className="grid grid-cols-1 gap-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-gray-900">{cat.name}</span>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 mb-6">Store Configuration</h3>
                <form onSubmit={handleUpdateSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Free Shipping Threshold (Rs.)</label>
                    <input 
                      type="number" 
                      value={settings.free_shipping}
                      onChange={(e) => setSettings({...settings, free_shipping: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
                      placeholder="0 for always free"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Return Policy (Days)</label>
                    <input 
                      type="number" 
                      value={settings.return_policy}
                      onChange={(e) => setSettings({...settings, return_policy: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
                    />
                  </div>
                  <button type="submit" className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl mt-4">
                    SAVE SETTINGS
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[32px] p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-900">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Customer Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                        <User size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Full Name</div>
                        <div className="text-sm font-bold text-gray-900">{selectedOrder.customer_name} {selectedOrder.customer_surname}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
                        <Phone size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Contact Number</div>
                        <div className="text-sm font-bold text-gray-900">{selectedOrder.customer_contact}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Delivery Location</div>
                        <div className="text-sm font-bold text-gray-900">{selectedOrder.customer_location}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment & Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Total Amount</div>
                      <div className="text-lg font-black text-gray-900">Rs. {selectedOrder.total}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Payment Method</div>
                      <div className="text-sm font-bold text-gray-900 uppercase">{selectedOrder.payment_method}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Payment Status</div>
                      <div className={`text-xs font-bold inline-block px-2 py-0.5 rounded ${selectedOrder.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {selectedOrder.payment_status.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Order Status</div>
                      <div className="text-xs font-bold text-gray-900 uppercase">{selectedOrder.status}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const text = `Hello ${selectedOrder.customer_name}, your order #${selectedOrder.id} from Sechand Deal is being processed!`;
                      window.open(`sms:${selectedOrder.customer_contact}?body=${encodeURIComponent(text)}`);
                    }}
                    className="flex-1 bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={18} /> SMS CUSTOMER
                  </button>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 bg-gray-900 text-white font-bold py-4 rounded-2xl"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-900">New Category</h2>
                <button onClick={() => setShowCategoryModal(false)} className="text-gray-400"><X size={24} /></button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Category Name</label>
                  <input 
                    required
                    type="text" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. Electronics"
                  />
                </div>
                <button type="submit" className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl mt-4">
                  ADD CATEGORY
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[32px] p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowProductModal(false)} className="text-gray-400"><X size={24} /></button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Product Image</label>
                  <div className="flex items-center gap-4">
                    <img src={newProduct.image_url} className="w-20 h-20 rounded-2xl object-cover border border-gray-100" alt="Preview" />
                    <label className="flex-1 cursor-pointer">
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-orange-500 transition-colors">
                        <Upload size={20} className="text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Upload Image</span>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'product')} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Category</label>
                  <select 
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Product Name</label>
                  <input 
                    type="text" 
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Price (Rs.)</label>
                    <input 
                      type="number" 
                      required
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Original Price (Rs.)</label>
                    <input 
                      type="number" 
                      value={newProduct.original_price}
                      onChange={(e) => setNewProduct({...newProduct, original_price: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Stock</label>
                    <input 
                      type="number" 
                      required
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={newProduct.is_flash_sale}
                        onChange={(e) => setNewProduct({...newProduct, is_flash_sale: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-xs font-bold text-gray-700 uppercase">Flash Sale?</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Location / Warehouse</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      value={newProduct.location}
                      onChange={(e) => setNewProduct({...newProduct, location: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-3 text-sm"
                      placeholder="e.g. Kathmandu Warehouse"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                  <textarea 
                    rows={3}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSavingProduct}
                  className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingProduct ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      SAVING...
                    </>
                  ) : (
                    editingProduct ? 'UPDATE PRODUCT' : 'SAVE PRODUCT'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Offer Modal */}
      <AnimatePresence>
        {showOfferModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[32px] p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-900">{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h2>
                <button onClick={() => {
                  setShowOfferModal(false);
                  setEditingOffer(null);
                }} className="text-gray-400"><X size={24} /></button>
              </div>

              <form onSubmit={handleSaveOffer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Offer Banner</label>
                  <div className="flex items-center gap-4">
                    <img src={newOffer.image_url} className="w-32 h-16 rounded-xl object-cover border border-gray-100" alt="Preview" />
                    <label className="flex-1 cursor-pointer">
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center gap-1 hover:border-orange-500 transition-colors">
                        <Upload size={16} className="text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Upload Banner</span>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'offer')} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Offer Title</label>
                  <input 
                    type="text" 
                    required
                    value={newOffer.title}
                    onChange={(e) => setNewOffer({...newOffer, title: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
                    placeholder="e.g. Winter Clearance"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Discount (%)</label>
                  <input 
                    type="number" 
                    required
                    value={newOffer.discount_percent}
                    onChange={(e) => setNewOffer({...newOffer, discount_percent: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
                  />
                </div>
                <button type="submit" className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl mt-4">
                  {editingOffer ? 'UPDATE OFFER' : 'CREATE OFFER'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
