import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Star, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '../store';
import { motion } from 'motion/react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [settings, setSettings] = useState({ free_shipping: '0', return_policy: '7' });
  const addItem = useCart(state => state.addItem);

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(products => {
      const p = products.find((p: any) => p.id === Number(id));
      setProduct(p);
    });
    fetch('/api/settings').then(res => res.json()).then(setSettings);
  }, [id]);

  if (!product) return null;

  const handleConsultation = () => {
    const text = `Hello Sechand Deal, I'm interested in "${product.name}" (Rs. ${product.price}). Can you provide more details?`;
    window.open(`sms:+9779800000000?body=${encodeURIComponent(text)}`); // Placeholder number
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-white/80 backdrop-blur-lg border-b border-gray-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-900 border border-gray-100">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-sm font-black text-gray-900 tracking-tighter">
            <span className="text-orange-500">Sechand</span> Deal
          </h1>
        </div>
        <button onClick={() => navigate('/cart')} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-900 border border-gray-100">
          <ShoppingCart size={20} />
        </button>
      </div>

      {/* Product Image */}
      <div className="aspect-square bg-gray-50 pt-16">
        <img src={product.image_url} className="w-full h-full object-cover" alt={product.name} />
      </div>

      {/* Content */}
      <div className="p-6 -mt-6 bg-white rounded-t-[32px] relative z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="text-orange-400 fill-orange-400" size={14} />
                <span className="text-sm font-bold text-gray-900">4.8</span>
              </div>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-400">124 Reviews</span>
            </div>
          </div>
          <div className="text-right">
            {product.stock === 0 && (
              <div className="bg-black text-white text-[10px] font-black px-2 py-1 rounded mb-2 inline-block">SOLD OUT</div>
            )}
            <div className="text-2xl font-black text-orange-500">Rs. {product.price}</div>
            {product.original_price > product.price && (
              <div className="text-sm text-gray-400 line-through">Rs. {product.original_price}</div>
            )}
          </div>
        </div>

        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          {product.description || "Experience the next level of quality with our premium product. Designed for comfort and durability, it's perfect for your daily needs."}
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <ShieldCheck className="text-emerald-500" size={20} />
            <span className="text-[10px] font-bold text-gray-900 text-center">100% Authentic</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <Truck className="text-blue-500" size={20} />
            <span className="text-[10px] font-bold text-gray-900 text-center">
              {Number(settings.free_shipping) === 0 ? 'Free Shipping' : `Free over Rs. ${settings.free_shipping}`}
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <RotateCcw className="text-purple-500" size={20} />
            <span className="text-[10px] font-bold text-gray-900 text-center">{settings.return_policy} Days Return</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleConsultation}
            className="bg-gray-100 text-gray-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            CONSULTATION
          </button>
          <button 
            disabled={product.stock === 0}
            onClick={() => {
              addItem(product);
              navigate('/cart');
            }}
            className={`font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 ${
              product.stock === 0 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-orange-500 text-white shadow-orange-500/20'
            }`}
          >
            {product.stock === 0 ? 'SOLD OUT' : 'ADD TO CART'}
          </button>
        </div>
      </div>
    </div>
  );
}
