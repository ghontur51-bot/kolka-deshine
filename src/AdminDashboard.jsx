import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { 
  LayoutDashboard, ShoppingBag, Package, MapPin, Phone,
  CheckCircle, ChefHat, Truck, Trash2, XCircle, Check, Play, Edit3, Plus, Image as ImageIcon, Star, Mail
} from 'lucide-react';

const ADMIN_PASSWORD = '74391';
const ADMIN_SESSION_KEY = 'luminaAdminUnlocked';

export default function AdminDashboard() {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'products'
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Product Form State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  
  const initialProductState = { name: '', category: 'Acrylic', desc: '', price: '', stock: '', images: [] };
  const [productForm, setProductForm] = useState(initialProductState);
  
  // Img Upload State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setIsUploading(true);
    let completed = 0;
    const newImages = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          // Compression to ensure it fits entirely inside Firestore's 1MB limit easily
          const MAX_SIZE = 600; 
          
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Downscale to JPEG 0.7 to achieve ~30kb image strings
          const dataURL = canvas.toDataURL('image/jpeg', 0.7);
          newImages.push(dataURL);
          
          completed++;
          setUploadProgress((completed / files.length) * 100);
          
          if (completed === files.length) {
            setProductForm(prev => ({
              ...prev, 
              images: [...(prev.images || []), ...newImages]
            }));
            setIsUploading(false);
            setUploadProgress(0);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setProductForm(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const setPrimaryImage = (index) => {
    setProductForm(prev => {
      const newImages = [...prev.images];
      const selected = newImages.splice(index, 1)[0];
      newImages.unshift(selected); // Put at front
      return { ...prev, images: newImages };
    });
  };

  useEffect(() => {
    if (!isAdminUnlocked) return;
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orderData = [];
      snapshot.forEach(doc => orderData.push({ id: doc.id, ...doc.data() }));
      orderData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setOrders(orderData);
    });
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productData = [];
      snapshot.forEach(doc => productData.push({ id: doc.id, ...doc.data() }));
      setProducts(productData);
      setLoading(false);
    });
    return () => { unsubOrders(); unsubProducts(); };
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
    try { await updateDoc(doc(db, 'orders', id), { status: newStatus }); } 
    catch (err) { alert("Error updating order: " + err.message); }
  };

  const deleteOrder = async (id) => {
    if (window.confirm('Delete this order record permanently?')) {
      await deleteDoc(doc(db, 'orders', id));
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: productForm.name,
        category: productForm.category,
        desc: productForm.desc,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        images: productForm.images?.length > 0 ? productForm.images : ['https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&q=80&w=400']
      };

      if (editingProductId) {
        await updateDoc(doc(db, 'products', editingProductId), data);
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
      }

      setProductForm(initialProductState);
      setIsAddingProduct(false);
      setEditingProductId(null);
    } catch (err) {
      alert("Error saving product: " + err.message);
    }
  };

  const editProduct = (product) => {
    // Migrate legacy 'img' to 'images' for backwards compatibility
    const images = product.images ? product.images : (product.img ? [product.img] : []);
    setProductForm({ ...product, images });
    setEditingProductId(product.id);
    setIsAddingProduct(true);
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Delete this product from the storefront?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  const getStatusConfig = (status) => {
    switch(status) {
      case 'pending': return { color: 'border-yellow-400', label: 'Pending', bg: 'bg-yellow-50' };
      case 'preparing': return { color: 'border-orange-400', label: 'Crafting', bg: 'bg-orange-50' };
      case 'out_for_delivery': return { color: 'border-blue-400', label: 'Shipped', bg: 'bg-blue-50' };
      case 'delivered': return { color: 'border-green-400', label: 'Delivered', bg: 'bg-green-50' };
      case 'rejected': return { color: 'border-red-400', label: 'Rejected', bg: 'bg-red-50' };
      default: return { color: 'border-gray-200', label: status, bg: 'bg-[#11131a]' };
    }
  };

  if (!isAdminUnlocked) {
    return (
      <div className="min-h-screen bg-[#08090C] text-[white] flex items-center justify-center px-4">
        <form onSubmit={handleAdminLogin} className="w-full max-w-sm bg-[#08090C] rounded-[2.5rem] shadow-2xl border border-[#D4A42F]/20 p-10">
          <h1 className="text-3xl font-serif font-bold text-[#D4A42F] mb-2 text-center">Admin Access</h1>
          <p className="text-sm text-[#1F4E79] mb-8 text-center font-bold">Secure the Kolkaa vault.</p>
          <input
            autoFocus type="password" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
            className="w-full bg-[#11131a] border-2 border-transparent focus:border-[#D4A42F] focus:bg-[#08090C] rounded-xl p-4 text-sm outline-none transition-all"
            placeholder="Enter unlock code"
          />
          {passwordError && <p className="text-xs text-red-500 font-bold mt-3 text-center">{passwordError}</p>}
          <button type="submit" className="mt-6 w-full bg-[#D4A42F] text-[#08090C] rounded-xl px-5 py-4 font-bold text-sm shadow-[#D4A42F]/30 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
            Enter Dashboard
          </button>
          <a href="/" className="block text-center mt-6 text-xs font-bold text-[#1F4E79] hover:text-[#D4A42F] transition">← Back to Storefront</a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090C] text-[white] flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-[#08090C] border-b md:border-b-0 md:border-r border-[#D4A42F]/10 p-4 md:p-6 flex flex-col shadow-sm shrink-0">
        <div className="flex md:flex-col justify-between items-center md:items-stretch mb-4 md:mb-10">
          <h1 className="text-xl md:text-2xl font-serif font-bold text-[#D4A42F] text-center tracking-wide">
            Cozy Threads Admin
          </h1>
          <a href="/" className="md:hidden text-xs font-bold text-[#1F4E79] hover:text-[#D4A42F] transition">← Storefront</a>
        </div>
        <nav className="flex md:flex-col space-x-3 md:space-x-0 md:space-y-3 px-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <button onClick={() => setActiveTab('orders')} className={`whitespace-nowrap flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-[#D4A42F] text-[#08090C] shadow-md' : 'text-[#1F4E79] hover:bg-[#11131a] bg-[#11131a] md:bg-transparent'}`}>
            <ShoppingBag size={18} /> Orders <span className="ml-2 md:ml-auto bg-[white]/10 text-[10px] px-2 py-0.5 rounded-full">{orders.length}</span>
          </button>
          <button onClick={() => setActiveTab('products')} className={`whitespace-nowrap flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl font-bold transition-all ${activeTab === 'products' ? 'bg-[#D4A42F] text-[#08090C] shadow-md' : 'text-[#1F4E79] hover:bg-[#11131a] bg-[#11131a] md:bg-transparent'}`}>
            <Package size={18} /> Products <span className="ml-2 md:ml-auto bg-[white]/10 text-[10px] px-2 py-0.5 rounded-full">{products.length}</span>
          </button>
        </nav>
        <div className="hidden md:block pt-6 border-t border-[#D4A42F]/10 text-center mt-auto">
          <a href="/" className="text-xs font-bold text-[#1F4E79] hover:text-[#D4A42F] transition">← Back to Storefront</a>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto w-full max-w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <h2 className="text-4xl font-serif font-bold text-[#D4A42F] capitalize">{activeTab} CMS</h2>
            <p className="text-sm font-bold text-[#1F4E79] mt-2">Manage your handcrafted items and orders.</p>
          </div>
          {activeTab === 'orders' && (
            <div className="bg-[#08090C] px-8 py-5 rounded-3xl shadow-sm border border-[#D4A42F]/10 text-right">
              <p className="text-[10px] text-[#D4A42F] font-bold tracking-[0.2em] uppercase">Total Revenue</p>
              <p className="text-3xl font-serif font-bold text-[white] mt-1">₹{totalRevenue.toFixed(2)}</p>
            </div>
          )}
          {activeTab === 'products' && !isAddingProduct && (
            <button onClick={() => setIsAddingProduct(true)} className="bg-[#D4A42F] text-[#08090C] px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#D4A42F]/30 hover:scale-[1.02] transition-all">
              <Plus size={16} /> New Product
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A42F]" />
          </div>
        ) : activeTab === 'orders' ? (
          <div className="grid gap-6">
            {orders.length === 0 ? <p className="text-[#1F4E79] font-bold">No orders received yet.</p> : orders.map(order => {
              const statusInfo = getStatusConfig(order.status);
              return (
                <div key={order.id} className={`bg-[#08090C] rounded-3xl p-6 md:p-8 shadow-sm border-l-8 transition-all ${statusInfo.color} ${order.status === 'delivered' || order.status === 'rejected' ? 'opacity-75' : ''}`}>
                  <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4">
                    <div className="w-full lg:w-auto">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <h3 className="font-bold text-xl">{order.customer?.name}</h3>
                        <span className={`w-fit text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${statusInfo.bg} ${statusInfo.color.replace('border', 'text')}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#1F4E79] flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 mt-3 bg-[#11131a] p-3 sm:p-0 sm:bg-transparent rounded-lg">
                        <span className="flex items-center gap-2"><MapPin size={14} className="text-[#D4A42F] flex-shrink-0"/> <span className="truncate max-w-[200px] sm:max-w-xs">{order.customer?.address}</span></span>
                        <span className="flex items-center gap-2"><Phone size={14} className="text-[#D4A42F] flex-shrink-0"/> {order.customer?.phone}</span>
                        <span className="flex items-center gap-2 opacity-50"><Mail size={14} className="sm:hidden text-gray-400 flex-shrink-0"/> <span className="truncate max-w-[200px]">{order.userEmail}</span></span>
                      </div>
                    </div>
                    <div className="text-left lg:text-right w-full lg:w-auto bg-[#D4A42F]/5 lg:bg-transparent p-4 lg:p-0 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-[#D4A42F] lg:hidden mb-1 tracking-wider">Total Amount</p>
                      <p className="text-3xl font-serif font-bold text-[white]">₹{order.total?.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-[#08090C] rounded-2xl p-5 mb-6">
                    <p className="text-[10px] font-bold text-[#D4A42F] mb-3 uppercase tracking-[0.2em]">Craft Items Ordered</p>
                    {order.items?.map((item, i) => (
                      <div key={i} className="text-sm flex justify-between py-2 border-b border-[#D4A42F]/10 last:border-0 font-bold text-[#1F4E79]">
                        <span><span className="text-[#D4A42F]">{item.qty}x</span> {item.name}</span>
                        <span className="text-[white]">₹{(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap md:flex-nowrap gap-3 justify-between items-center bg-[#11131a] p-3 rounded-xl">
                    <button onClick={() => deleteOrder(order.id)} className="w-full md:w-auto p-3 bg-[#08090C] border border-[#333] rounded-lg text-gray-400 hover:text-red-500 hover:border-red-100 hover:shadow-sm transition-all flex justify-center items-center gap-2 order-last md:order-first" title="Delete Record">
                      <Trash2 size={16} /> <span className="md:hidden font-bold text-sm">Delete Record</span>
                    </button>
                    
                    <div className="flex flex-wrap w-full md:w-auto gap-2 justify-end order-first md:order-last">
                      {order.status === 'pending' && (
                        <>
                          <button onClick={() => updateOrderStatus(order.id, 'rejected')} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-3 md:py-2 bg-red-100 text-red-600 rounded-lg font-bold text-xs hover:bg-red-200 transition-all shadow-sm border border-red-200">
                            Cancel
                          </button>
                          <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-3 md:py-2 hover:bg-green-600 bg-green-500 text-white rounded-lg font-bold text-xs shadow-md shadow-green-500/20 hover:scale-105 active:scale-95 transition-all">
                            Accept Order
                          </button>
                        </>
                      )}

                      {order.status === 'preparing' && (
                        <>
                          <button onClick={() => updateOrderStatus(order.id, 'rejected')} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-3 md:py-2 border-2 border-red-100 text-red-500 rounded-lg font-bold text-xs hover:bg-red-50 transition-all">
                            Cancel
                          </button>
                          <button onClick={() => updateOrderStatus(order.id, 'out_for_delivery')} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-3 md:py-2.5 bg-blue-500 text-white rounded-lg font-bold text-xs shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                            Ship Order
                          </button>
                        </>
                      )}

                      {order.status === 'out_for_delivery' && (
                        <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="w-full md:w-auto justify-center flex items-center gap-2 px-5 py-3 md:py-2.5 bg-[#D4A42F] text-[#08090C] rounded-lg font-bold text-xs shadow-md shadow-[#D4A42F]/20 hover:scale-105 active:scale-95 transition-all">
                          Mark Delivered
                        </button>
                      )}

                      {order.status === 'delivered' && ( <span className="w-full md:w-auto justify-center flex items-center gap-1 text-green-600 font-bold text-xs px-4 py-3 md:py-2 bg-green-50 rounded-lg text-center border border-green-200">Fulfilled</span> )}
                      {order.status === 'rejected' && ( <span className="w-full md:w-auto justify-center flex items-center gap-1 text-red-600 font-bold text-xs px-4 py-3 md:py-2 bg-red-50 rounded-lg text-center border border-red-200">Cancelled</span> )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {isAddingProduct && (
              <div className="bg-[#08090C] p-8 rounded-[2.5rem] shadow-xl border border-[#D4A42F]/20 mb-10 animate-in slide-in-from-top-4 fade-in duration-300">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-2xl font-serif font-bold text-[white]">{editingProductId ? 'Edit Product' : 'Add New Item'}</h3>
                   <button onClick={() => { setIsAddingProduct(false); setProductForm(initialProductState); setEditingProductId(null); }} className="p-2 bg-[#11131a] text-gray-400 rounded-full hover:bg-[#1a1f26]"><XCircle size={18}/></button>
                </div>
                <form onSubmit={handleProductSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#D4A42F] ml-2 uppercase">Product Name</label>
                      <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full bg-[#11131a] border-2 border-transparent focus:border-[#D4A42F] focus:bg-[#08090C] rounded-xl p-3 text-sm font-bold outline-none transition-all" placeholder="E.g. Pastel Bear Charm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#D4A42F] ml-2 uppercase">Category</label>
                      <input required type="text" list="categoryList" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full bg-[#11131a] border-2 border-transparent focus:border-[#D4A42F] focus:bg-[#08090C] rounded-xl p-3 text-sm font-bold outline-none transition-all" placeholder="Type new or select existing..." />
                      <datalist id="categoryList">
                        {[...new Set(products.map(p => p.category))].map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#D4A42F] ml-2 uppercase">Handmade Description / Specs</label>
                    <textarea required value={productForm.desc} onChange={e => setProductForm({...productForm, desc: e.target.value})} className="w-full bg-[#11131a] border-2 border-transparent focus:border-[#D4A42F] focus:bg-[#08090C] rounded-xl p-3 text-sm font-bold outline-none transition-all resize-none h-24" placeholder="Detail the charm, material, and handcrafted love put into this..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#D4A42F] ml-2 uppercase">Price (₹)</label>
                      <input required type="number" step="1" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full bg-[#11131a] border-2 border-transparent focus:border-[#D4A42F] focus:bg-[#08090C] rounded-xl p-3 text-sm font-bold outline-none transition-all" placeholder="499" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#D4A42F] ml-2 uppercase">Quantity in Stock</label>
                      <input required type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full bg-[#11131a] border-2 border-transparent focus:border-[#D4A42F] focus:bg-[#08090C] rounded-xl p-3 text-sm font-bold outline-none transition-all" placeholder="50" />
                    </div>
                    <div className="space-y-1 flex flex-col justify-end">
                      <label className="text-[10px] font-bold text-[#D4A42F] ml-2 uppercase">Upload Images</label>
                      <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full bg-[#11131a] border-2 border-transparent focus:border-[#D4A42F] focus:bg-[#08090C] rounded-xl p-2 text-sm font-bold outline-none transition-all file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#D4A42F]/10 file:text-[#D4A42F] hover:file:bg-[#D4A42F]/20 cursor-pointer" />
                      {isUploading && <div className="text-[10px] font-bold text-[#D4A42F] ml-2">Uploading: {Math.round(uploadProgress)}%</div>}
                    </div>
                  </div>

                  {productForm.images?.length > 0 && (
                    <div className="bg-[#11131a] rounded-xl p-4 border border-[#D4A42F]/10">
                       <label className="text-[10px] font-bold text-[#D4A42F] uppercase mb-3 block">Image Gallery (First is Cover)</label>
                       <div className="flex gap-4 overflow-x-auto pb-2">
                          {productForm.images.map((img, idx) => (
                            <div key={idx} className={`relative w-24 h-24 rounded-xl shrink-0 overflow-hidden border-2 transition-all ${idx === 0 ? 'border-[#D4A42F] shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'}`}>
                               <img src={img} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  {idx !== 0 && (
                                    <button type="button" onClick={() => setPrimaryImage(idx)} className="p-1.5 bg-[#08090C] text-yellow-500 rounded-full hover:scale-110" title="Set as primary"><Star size={12}/></button>
                                  )}
                                  <button type="button" onClick={() => removeImage(idx)} className="p-1.5 bg-[#08090C] text-red-500 rounded-full hover:scale-110" title="Delete"><Trash2 size={12}/></button>
                               </div>
                               {idx === 0 && <span className="absolute top-1 left-1 bg-[#D4A42F] text-[#08090C] text-[8px] font-bold px-2 py-0.5 rounded-full">COVER</span>}
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  <button type="submit" className="w-full bg-[#D4A42F] text-[#08090C] py-4 rounded-xl font-bold mt-4 shadow-lg shadow-[#D4A42F]/30">
                    {editingProductId ? 'Update Item' : 'Save New Item to Store'}
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.length === 0 && !isAddingProduct && <p className="text-[#1F4E79] font-bold col-span-full">No items in store yet.</p>}
              {products.map(product => {
                const imgSource = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : (product.img || 'https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b');
                
                return (
                <div key={product.id} className="bg-[#08090C] rounded-3xl p-5 border border-[#D4A42F]/10 shadow-sm flex flex-col hover:shadow-xl transition-shadow relative overflow-hidden group">
                  <div className="absolute top-4 right-4 z-10 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => editProduct(product)} className="w-8 h-8 bg-[#08090C] text-blue-500 rounded-full shadow border flex justify-center items-center hover:scale-105"><Edit3 size={14}/></button>
                    <button onClick={() => deleteProduct(product.id)} className="w-8 h-8 bg-[#08090C] text-red-500 rounded-full shadow border flex justify-center items-center hover:scale-105"><Trash2 size={14}/></button>
                  </div>
                  <img src={imgSource} alt={product.name} className="w-full h-40 object-cover rounded-2xl mb-4 bg-[#11131a]" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg text-[white] leading-tight pr-2">{product.name}</h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A42F] bg-[#D4A42F]/10 px-2 py-0.5 rounded-full inline-block mb-2">{product.category}</span>
                    <p className="text-xs text-[#1F4E79] font-medium line-clamp-2 leading-relaxed mb-4">{product.desc}</p>
                  </div>
                  <div className="flex justify-between items-end pt-3 border-t border-[#333]">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Stock</p>
                      <p className="text-sm font-bold text-[white]">{product.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-serif font-bold text-[#D4A42F]">₹{Number(product.price).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
