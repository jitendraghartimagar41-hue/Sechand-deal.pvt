import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Search, ShoppingBag } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function CategoryPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
    fetch('/api/products').then(res => res.json()).then(setProducts);
  }, []);

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-24">
      {/* Header */}
      <header className="p-6 sticky top-0 bg-white z-40 border-b border-gray-50">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-900">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-black text-gray-900">Categories</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search in categories..." 
            className="w-full bg-gray-100 rounded-full py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </header>

      {/* Category List */}
      <div className="flex gap-3 px-6 py-4 overflow-x-auto no-scrollbar border-b border-gray-50">
        <button 
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === null ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-500'
          }`}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-50 text-gray-500'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <Link 
              key={product.id} 
              to={`/product/${product.id}`}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform"
            >
              <div className="aspect-square bg-gray-50">
                <img src={product.image_url} className="w-full h-full object-cover" alt={product.name} />
              </div>
              <div className="p-3">
                <h4 className="text-xs font-medium text-gray-900 line-clamp-2 mb-2 h-8">{product.name}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-orange-500 font-bold text-sm">Rs. {product.price}</span>
                  <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center">
                    <ShoppingBag size={12} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
              <ShoppingBag size={32} />
            </div>
            <h3 className="font-bold text-gray-900">No products found</h3>
            <p className="text-xs text-gray-400 mt-1">Try another category or search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
