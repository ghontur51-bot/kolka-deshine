import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  CalendarCheck, 
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  Trash2,
  XCircle,
  ChefHat,
  Truck,
  Check
} from 'lucide-react';

const ADMIN_PASSWORD = '7112232';
const ADMIN_SESSION_KEY = 'luminaAdminUnlockedV2';

export default function AdminDashboard() {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdminUnlocked) return;

    // Listen to Orders
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orderData = [];
      snapshot.forEach(doc => orderData.push({ id: doc.id, ...doc.data() }));
      // Sort by newest first
      orderData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setOrders(orderData);
    }, (error) => {
      alert("Admin Dashboard Firebase Error (Orders): " + error.message);
      setLoading(false);
    });

    // Listen to Bookings
    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const bookingData = [];
      snapshot.forEach(doc => bookingData.push({ id: doc.id, ...doc.data() }));
      bookingData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setBookings(bookingData);
      setLoading(false);
    }, (error) => {
      alert("Admin Dashboard Firebase Error (Bookings): " + error.message);
      setLoading(false);
    });

    return () => {
      unsubOrders();
      unsubBookings();
    };
  }, [isAdminUnlocked]);

  const handleAdminLogin = (e) => {
    e.preventDefault();

    if (password.trim() !== ADMIN_PASSWORD) {
      setPasswordError('Incorrect password.');
      return;
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    setIsAdminUnlocked(true);
    setPassword('');
    setPasswordError('');
  };

  const updateOrderStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: newStatus
      });
    } catch (err) {
      alert("Error updating order: " + err.message);
    }
  };

  const deleteOrder = async (id) => {
    if (window.confirm('Delete this order record permanently?')) {
      await deleteDoc(doc(db, 'orders', id));
    }
  };
  
  const deleteBooking = async (id) => {
    if (window.confirm('Delete this booking?')) {
      await deleteDoc(doc(db, 'bookings', id));
    }
  };

  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  // Status Styling Logic for Admin View
  const getStatusConfig = (status) => {
    switch(status) {
      case 'pending': return { color: 'border-yellow-400', label: 'Pending', bg: 'bg-yellow-50' };
      case 'preparing': return { color: 'border-orange-400', label: 'Preparing', bg: 'bg-orange-50' };
      case 'out_for_delivery': return { color: 'border-blue-400', label: 'Out for Delivery', bg: 'bg-blue-50' };
      case 'delivered': return { color: 'border-green-400', label: 'Delivered', bg: 'bg-green-50' };
      case 'rejected': return { color: 'border-red-400', label: 'Rejected', bg: 'bg-red-50' };
      default: return { color: 'border-gray-200', label: status, bg: 'bg-gray-50' };
    }
  };

  if (!isAdminUnlocked) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 flex items-center justify-center px-4">
        <form onSubmit={handleAdminLogin} className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h1 className="text-2xl font-serif font-bold text-[#2A2431] mb-2">Lumina Admin</h1>
          <p className="text-sm text-gray-500 mb-6">Enter the admin password to continue.</p>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError('');
            }}
            className="mt-1 w-full bg-gray-50 border-2 border-transparent focus:border-[#A284C5] focus:bg-white rounded-xl p-4 text-sm outline-none transition-all"
            placeholder="Enter password"
          />
          {passwordError && <p className="text-xs text-red-500 font-bold mt-3">{passwordError}</p>}
          <button type="submit" className="mt-6 w-full bg-[#A284C5] text-[#2A2431] rounded-xl px-5 py-3 font-bold text-sm hover:shadow-lg transition-all">
            Unlock Dashboard
          </button>
          <a href="/" className="block text-center mt-4 text-xs text-gray-400 hover:text-[#2A2431] transition">Back to Storefront</a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2A2431] text-white p-6 shadow-xl flex flex-col">
        <h1 className="text-2xl font-serif font-bold text-[#A284C5] mb-10 flex items-center gap-2">
          Lumina Admin
        </h1>
        <nav className="space-y-4 flex-1">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-[#A284C5] text-[#2A2431] font-bold' : 'hover:bg-white/10'}`}
          >
            <ShoppingBag size={18} /> Orders 
            <span className="ml-auto bg-white/20 text-xs px-2 py-0.5 rounded-full">{orders.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'bookings' ? 'bg-[#A284C5] text-[#2A2431] font-bold' : 'hover:bg-white/10'}`}
          >
            <CalendarCheck size={18} /> Bookings
            <span className="ml-auto bg-white/20 text-xs px-2 py-0.5 rounded-full">{bookings.length}</span>
          </button>
        </nav>
        <div className="pt-6 border-t border-white/10">
          <a href="/" className="text-sm text-gray-400 hover:text-white transition">← Back to Storefront</a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto w-full font-sans">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 capitalize">{activeTab} Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Real-time sync with customers</p>
          </div>
          {activeTab === 'orders' && (
            <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 text-right">
              <p className="text-xs text-gray-400 font-bold tracking-wider uppercase">Total Revenue</p>
              <p className="text-2xl font-serif font-bold text-[#7E6A93]">${totalRevenue.toFixed(2)}</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A284C5]" />
          </div>
        ) : activeTab === 'orders' ? (
          <div className="grid gap-6">
            {orders.length === 0 ? <p className="text-gray-400">No orders yet.</p> : orders.map(order => {
              const statusInfo = getStatusConfig(order.status);
              return (
                <div key={order.id} className={`bg-white rounded-2xl p-6 shadow-sm border-l-[6px] transition-all ${statusInfo.color} ${order.status === 'delivered' || order.status === 'rejected' ? 'opacity-75' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{order.customer?.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${statusInfo.bg} ${statusInfo.color.replace('border', 'text')}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 flex flex-wrap items-center gap-4 mt-2">
                        <span className="flex items-center gap-1"><MapPin size={14} className="text-[#A284C5]"/> {order.customer?.address}</span>
                        <span className="flex items-center gap-1"><Phone size={14} className="text-[#A284C5]"/> {order.customer?.phone}</span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-300">User: {order.userEmail}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#2A2431]">${order.total?.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 rounded-xl p-4 mb-6 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">Order Details</p>
                    {order.items?.map((item, i) => (
                      <div key={i} className="text-sm flex justify-between border-b border-gray-100 py-2 last:border-0 text-gray-700">
                        <span><span className="font-bold text-[#7E6A93]">{item.qty}x</span> {item.name}</span>
                        <span className="font-medium">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 justify-between items-center">
                    <button onClick={() => deleteOrder(order.id)} className="p-2 text-gray-300 hover:text-red-400 transition-colors" title="Delete Record">
                      <Trash2 size={18} />
                    </button>
                    
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button onClick={() => updateOrderStatus(order.id, 'rejected')} className="flex items-center gap-2 px-4 py-2 border-2 border-red-100 text-red-500 rounded-xl font-bold text-xs hover:bg-red-50 transition-all">
                            <XCircle size={14} /> Reject
                          </button>
                          <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="flex items-center gap-2 px-5 py-2 bg-[#A284C5] text-[#2A2431] rounded-xl font-bold text-xs shadow-lg shadow-[#A284C5]/20 hover:scale-105 active:scale-95 transition-all">
                            <ChefHat size={14} /> Accept & Prepare
                          </button>
                        </>
                      )}

                      {order.status === 'preparing' && (
                        <button onClick={() => updateOrderStatus(order.id, 'out_for_delivery')} className="flex items-center gap-2 px-5 py-2 bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                          <Truck size={14} /> Send for Delivery
                        </button>
                      )}

                      {order.status === 'out_for_delivery' && (
                        <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="flex items-center gap-2 px-5 py-2 bg-green-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all">
                          <CheckCircle size={14} /> Mark Delivered
                        </button>
                      )}

                      {order.status === 'delivered' && (
                        <span className="flex items-center gap-1 text-green-600 font-bold text-xs px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                          <Check size={14} /> Order Fulfilled
                        </span>
                      )}

                      {order.status === 'rejected' && (
                        <span className="flex items-center gap-1 text-red-600 font-bold text-xs px-4 py-2 bg-red-50 rounded-xl border border-red-100">
                          <XCircle size={14} /> Order Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {bookings.length === 0 ? <p className="text-gray-400">No bookings yet.</p> : bookings.map(booking => (
              <div key={booking.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4 text-[9px] font-bold px-3 py-1 bg-[#F7F5FA] text-[#7E6A93] rounded-full uppercase tracking-widest border border-[#A284C5]/20">
                  {booking.type}
                </div>
                <h3 className="font-bold text-xl mb-1 text-[#2A2431]">{booking.name}</h3>
                <p className="text-sm text-gray-500 mb-4 font-medium flex items-center gap-2"><Phone size={14} className="text-[#A284C5]"/> {booking.phone}</p>
                
                <div className="space-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="flex justify-between"><strong>Date:</strong> <span>{booking.date} at {booking.time || booking.duration}</span></p>
                  
                  {booking.type === 'table' ? (
                     <>
                       <p className="flex justify-between"><strong>Party Size:</strong> <span>{booking.partySize}</span></p>
                       <p className="flex justify-between"><strong>Preference:</strong> <span>{booking.preference}</span></p>
                     </>
                  ) : (
                     <div className="pt-2 border-t border-gray-200 mt-2">
                       <p className="flex justify-between"><strong>Event:</strong> <span>{booking.eventType}</span></p>
                       <p className="flex flex-col gap-1 mt-2">
                        <strong className="text-[10px] uppercase text-gray-400">Special Notes:</strong> 
                        <span className="text-xs bg-white p-2 rounded-lg border border-gray-100 italic">{booking.requirements || 'No special requests.'}</span>
                       </p>
                     </div>
                  )}
                  <p className="text-[10px] text-gray-300 mt-2">User: {booking.userEmail}</p>
                </div>
                
                <div className="flex justify-end mt-4">
                  <button onClick={() => deleteBooking(booking.id)} className="p-2 text-gray-300 hover:text-red-400 transition-colors text-sm flex items-center gap-1"><Trash2 size={16} /> Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
