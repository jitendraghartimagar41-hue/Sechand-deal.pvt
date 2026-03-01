import React, { useState } from 'react';
import { useCart } from '../store';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, CheckCircle2, CreditCard, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const { items, removeItem, addItem, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details' | 'payment' | 'confirm'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'khalti' | 'esewa'>('khalti');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    surname: '',
    location: '',
    contact: ''
  });

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      // If payment method is Khalti or eSewa, we might need to redirect
      if (paymentMethod === 'khalti' || paymentMethod === 'esewa') {
        const response = await fetch(`/api/payments/initiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total(),
            payment_method: paymentMethod,
            customer_details: customerDetails,
            items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price }))
          }),
        });

        const data = await response.json();
        if (data.payment_url) {
          // Redirect to payment gateway
          window.location.href = data.payment_url;
          return;
        } else {
          alert('Failed to initiate payment. Please try again.');
          setIsCheckingOut(false);
          return;
        }
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: total(),
          customer_name: customerDetails.name,
          customer_surname: customerDetails.surname,
          customer_location: customerDetails.location,
          customer_contact: customerDetails.contact,
          payment_method: paymentMethod,
          items: items.map(i => ({ id: i.id, quantity: i.quantity }))
        }),
      });
      
      if (response.ok) {
        setOrderComplete(true);
        clearCart();
      }
    } catch (error) {
      console.error('Checkout failed', error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-8">Your order has been received and is being processed. You'll receive a notification soon.</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl"
        >
          Back to Shopping
        </button>
      </div>
    );
  }

  if (checkoutStep === 'details') {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen p-6">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setCheckoutStep('cart')} className="text-gray-400"><ArrowRight className="rotate-180" size={24} /></button>
          <h1 className="text-xl font-black text-gray-900">Customer Details</h1>
        </header>

        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setCheckoutStep('payment'); }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">First Name</label>
              <input 
                type="text" 
                required
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Surname / Cast</label>
              <input 
                type="text" 
                required
                value={customerDetails.surname}
                onChange={(e) => setCustomerDetails({...customerDetails, surname: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Delivery Location</label>
            <input 
              type="text" 
              required
              value={customerDetails.location}
              onChange={(e) => setCustomerDetails({...customerDetails, location: e.target.value})}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="Full Address, City"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Contact Number</label>
            <input 
              type="tel" 
              required
              value={customerDetails.contact}
              onChange={(e) => setCustomerDetails({...customerDetails, contact: e.target.value})}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="+977-XXXXXXXXXX"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-gray-900/20"
          >
            CONTINUE TO PAYMENT
          </button>
        </form>
      </div>
    );
  }

  if (checkoutStep === 'payment') {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen p-6">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setCheckoutStep('details')} className="text-gray-400"><ArrowRight className="rotate-180" size={24} /></button>
          <h1 className="text-xl font-black text-gray-900">Payment Method</h1>
        </header>

        <div className="space-y-4">
          <button 
            onClick={() => setPaymentMethod('khalti')}
            className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${paymentMethod === 'khalti' ? 'border-purple-600 bg-purple-50' : 'border-gray-100 bg-white'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-black text-xs">
                KHALTI
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Khalti Wallet</div>
                <div className="text-xs text-gray-400">Pay via Khalti / Mobile Banking</div>
              </div>
            </div>
            {paymentMethod === 'khalti' && <CheckCircle2 className="text-purple-600" size={20} />}
          </button>

          <button 
            onClick={() => setPaymentMethod('esewa')}
            className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${paymentMethod === 'esewa' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-white'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-black text-xs">
                eSewa
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">eSewa</div>
                <div className="text-xs text-gray-400">Nepal's First Digital Wallet</div>
              </div>
            </div>
            {paymentMethod === 'esewa' && <CheckCircle2 className="text-emerald-500" size={20} />}
          </button>

          <button 
            onClick={() => setPaymentMethod('card')}
            className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <CreditCard size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Credit / Debit Card</div>
                <div className="text-xs text-gray-400">International / Local Cards</div>
              </div>
            </div>
            {paymentMethod === 'card' && <CheckCircle2 className="text-blue-500" size={20} />}
          </button>

          <button 
            onClick={() => setPaymentMethod('cod')}
            className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${paymentMethod === 'cod' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 text-gray-600 rounded-2xl flex items-center justify-center">
                <ShoppingBag size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Cash on Delivery</div>
                <div className="text-xs text-gray-400">Pay when you receive</div>
              </div>
            </div>
            {paymentMethod === 'cod' && <CheckCircle2 className="text-gray-900" size={20} />}
          </button>

          {paymentMethod !== 'cod' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 space-y-4"
            >
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Details</h4>
              <input 
                type="text" 
                placeholder="Card / Account Number"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                className="w-full bg-white border border-gray-100 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="MM/YY or Expiry"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                  className="w-full bg-white border border-gray-100 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  type="text" 
                  placeholder="CVC / PIN"
                  value={cardDetails.cvc}
                  onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value})}
                  className="w-full bg-white border border-gray-100 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input 
                type="text" 
                placeholder="Account Holder Name"
                value={cardDetails.name}
                onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                className="w-full bg-white border border-gray-100 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </motion.div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 font-medium">Total to Pay</span>
              <span className="text-xl font-black text-gray-900">Rs. {total()}</span>
            </div>
            <button 
              onClick={() => setCheckoutStep('confirm')}
              className="w-full bg-orange-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/20"
            >
              REVIEW ORDER
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (checkoutStep === 'confirm') {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen p-6 flex flex-col">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setCheckoutStep('payment')} className="text-gray-400"><ArrowRight className="rotate-180" size={24} /></button>
          <h1 className="text-xl font-black text-gray-900">Confirm Purchase</h1>
        </header>

        <div className="flex-1 space-y-8">
          <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100">
            <h3 className="text-orange-900 font-black mb-4 flex items-center gap-2">
              <AlertCircle size={20} /> Final Confirmation
            </h3>
            <p className="text-sm text-orange-800 leading-relaxed">
              You are about to purchase <strong>{items.length} items</strong> for a total of <strong>Rs. {total()}</strong>. 
              Please confirm if you are ready to proceed with the payment.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Shipping To</h4>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="font-bold text-gray-900">{customerDetails.name} {customerDetails.surname}</div>
              <div className="text-sm text-gray-500 mt-1">{customerDetails.location}</div>
              <div className="text-sm text-gray-500">{customerDetails.contact}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment Method</h4>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
              {paymentMethod === 'khalti' && <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center text-[8px] text-white font-bold">K</div>}
              {paymentMethod === 'esewa' && <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-[8px] text-white font-bold">e</div>}
              {paymentMethod === 'card' && <CreditCard size={18} className="text-blue-500" />}
              {paymentMethod === 'cod' && <ShoppingBag size={18} className="text-gray-500" />}
              <span className="text-sm font-bold text-gray-900 uppercase">
                {paymentMethod === 'khalti' ? 'Khalti Wallet' : 
                 paymentMethod === 'esewa' ? 'eSewa' : 
                 paymentMethod === 'card' ? 'Credit / Debit Card' : 'Cash on Delivery'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-8">
          <button 
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-gray-900/20 flex items-center justify-center gap-2"
          >
            {isCheckingOut ? 'Processing...' : 'CONFIRM & PAY NOW'}
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-white text-gray-400 font-bold py-4 rounded-2xl border border-gray-100"
          >
            HOLD / CANCEL ORDER
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-40">
      <header className="bg-white p-6 sticky top-0 z-40 border-b border-gray-100">
        <h1 className="text-xl font-black text-gray-900">My Cart</h1>
      </header>

      <div className="p-4 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 shadow-sm">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-500 font-bold">Rs. {item.price}</span>
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1">
                  <button className="text-gray-400"><Minus size={14} /></button>
                  <span className="text-xs font-bold text-gray-900">{item.quantity}</span>
                  <button onClick={() => addItem(item)} className="text-gray-900"><Plus size={14} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Summary */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-100 z-40">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-medium">Total Amount</span>
            <span className="text-xl font-black text-gray-900">Rs. {total()}</span>
          </div>
          <button 
            onClick={() => setCheckoutStep('details')}
            className="w-full bg-orange-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20"
          >
            PROCEED TO CHECKOUT <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
