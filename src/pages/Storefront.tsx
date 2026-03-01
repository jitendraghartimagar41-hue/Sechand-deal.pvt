import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Zap, ChevronRight, Star, MessageSquare, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  price: number;
  original_price: number;
  image_url: string;
  stock: number;
  is_flash_sale: number;
}

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
    fetch('/api/categories').then(res => res.json()).then(setCategories);
    fetch('/api/offers').then(res => res.json()).then(setOffers);
  }, []);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setIsSending(true);
    try {
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: 'Guest', message: chatMessage }),
      });
      setChatMessage('');
      setShowChat(false);
      alert('Message sent to admin!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const flashSaleProducts = products.filter(p => p.is_flash_sale);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <header className="p-4 sticky top-0 bg-white z-40 border-b border-gray-50 flex items-center justify-between gap-4">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-shrink-0"
        >
          <h1 className="text-lg font-black text-gray-900 tracking-tighter">
            <span className="text-orange-500">Sechand</span> Deal
          </h1>
        </motion.div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-gray-100 rounded-full py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </header>

      {/* Hero Banner */}
      <div className="p-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {offers.map((offer) => (
            <div key={offer.id} className="relative min-w-[300px] h-40 rounded-2xl overflow-hidden bg-orange-500 flex-shrink-0">
              <img 
                src={offer.image_url} 
                className="w-full h-full object-cover opacity-80"
                alt={offer.title}
              />
              <div className="absolute inset-0 flex flex-col justify-center p-6 text-white">
                <span className="text-xs font-bold uppercase tracking-wider mb-1">Limited Offer</span>
                <h2 className="text-2xl font-black leading-tight">{offer.title}</h2>
                <div className="text-xl font-bold mt-1">{offer.discount_percent}% OFF</div>
                <button className="mt-3 bg-white text-orange-600 text-xs font-bold px-4 py-2 rounded-full w-fit">Shop Now</button>
              </div>
            </div>
          ))}
          {offers.length === 0 && (
            <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-orange-500">
              <img 
                src="https://picsum.photos/seed/ecommerce/800/400" 
                className="w-full h-full object-cover opacity-80"
                alt="Sale Banner"
              />
              <div className="absolute inset-0 flex flex-col justify-center p-6 text-white">
                <span className="text-xs font-bold uppercase tracking-wider mb-1">Flash Sale</span>
                <h2 className="text-2xl font-black leading-tight">UP TO 70% OFF</h2>
                <button className="mt-3 bg-white text-orange-600 text-xs font-bold px-4 py-2 rounded-full w-fit">Shop Now</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-4 gap-4 p-4">
        {categories.map((cat) => (
          <div key={cat.id} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-600">
              <img src={`https://picsum.photos/seed/${cat.name}/100/100`} className="w-8 h-8 rounded-lg" alt={cat.name} />
            </div>
            <span className="text-[10px] font-medium text-gray-600">{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Flash Sale Section */}
      <section className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-orange-500 fill-orange-500" size={20} />
            <h3 className="font-bold text-gray-900">Flash Sale</h3>
          </div>
          <Link to="/flash-sale" className="text-orange-500 text-xs font-bold flex items-center">
            SHOP MORE <ChevronRight size={14} />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {flashSaleProducts.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`} className="min-w-[140px] flex-shrink-0">
              <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                <img src={product.image_url} className={`w-full h-full object-cover ${product.stock === 0 ? 'grayscale opacity-50' : ''}`} alt={product.name} />
                {product.stock === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="bg-black text-white text-[10px] font-black px-2 py-1 rounded">SOLD OUT</span>
                  </div>
                )}
                {product.original_price > product.price && product.stock > 0 && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    SAVE {Math.round((1 - product.price / product.original_price) * 100)}%
                  </div>
                )}
              </div>
              <h4 className="text-xs font-medium text-gray-900 line-clamp-1">{product.name}</h4>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-orange-500 font-bold text-sm">Rs. {product.price}</span>
                <span className="text-gray-400 text-[10px] line-through">Rs. {product.original_price}</span>
              </div>
              <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500" 
                  style={{ width: `${(product.stock / 10) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">{product.stock} Stock left</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Just For You */}
      <section className="p-4">
        <h3 className="font-bold text-gray-900 mb-4">Just For You</h3>
        <div className="grid grid-cols-2 gap-4">
          {[...products].reverse().map((product) => (
            <Link key={product.id} to={`/product/${product.id}`} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className={`aspect-square bg-gray-50 relative ${product.stock === 0 ? 'grayscale opacity-50' : ''}`}>
                <img src={product.image_url} className="w-full h-full object-cover" alt={product.name} />
                {product.stock === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <span className="bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-xl">SOLD OUT</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="text-xs font-medium text-gray-900 line-clamp-2 mb-2 h-8">{product.name}</h4>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="text-orange-400 fill-orange-400" size={10} />
                  <span className="text-[10px] text-gray-400">(4.5)</span>
                </div>
                <span className="text-orange-500 font-bold">Rs. {product.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Floating Chat Button */}
      <button 
        onClick={() => setShowChat(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-90 transition-transform"
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-gray-900">Chat with Admin</h3>
                <button onClick={() => setShowChat(false)} className="text-gray-400"><X size={20} /></button>
              </div>
              <form onSubmit={handleSendChat}>
                <textarea 
                  required
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="How can we help you today?"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm mb-4 h-32 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button 
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl disabled:opacity-50"
                >
                  {isSending ? 'Sending...' : 'SEND MESSAGE'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
