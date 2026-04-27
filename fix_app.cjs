const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Move MAC-STYLE PRODUCT MODAL
const modalStartStr = '{/* MAC-STYLE PRODUCT MODAL */}';
const modalStartIndex = code.indexOf(modalStartStr);

if (modalStartIndex !== -1) {
    const deliveryStr = '<h2 className="text-3xl font-serif font-bold text-[#2A2431] mb-1">Delivery Details</h2>';
    const deliveryIndex = code.indexOf(deliveryStr);
    
    if (deliveryIndex !== -1) {
        const modalContent = code.substring(modalStartIndex, deliveryIndex).trim();
        code = code.replace(modalContent, '');

        const cartPanelStr = '{/* REFINED CART PANEL (NO DELIVERY FORM IN SIDEBAR) */}';
        code = code.replace(cartPanelStr, modalContent + '\n\n      ' + cartPanelStr);
    }
}

// 2. Map Multiple Images smoothly across the app
code = code.replace(
    /item\.img/g,
    "(Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : (item.img || 'https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&q=80&w=400'))"
);

code = code.replace(
    /selectedProduct\.img/g,
    "(Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0 ? selectedProduct.images[0] : (selectedProduct.img || 'https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&q=80&w=400'))"
);

// 3. Fix Currency Syntax `$` -> `₹` globally, targeting specific patterns for safety
code = code.replace(/\$\{item.price.toFixed/g, '₹${item.price.toFixed');
code = code.replace(/\$\{order.total\?.toFixed/g, '₹${order.total?.toFixed');
code = code.replace(/\$\{\(item.price \* item.qty\).toFixed/g, '₹${(item.price * item.qty).toFixed');
code = code.replace(/\$\{cartTotal.toFixed/g, '₹${cartTotal.toFixed');
code = code.replace(/\$\{Number\(selectedProduct.price\).toFixed/g, '₹${Number(selectedProduct.price).toFixed');
code = code.replace(/>\$\{/g, '>₹{'); // specific catch-alls just in case 
code = code.replace(/>\$(?=\d)/g, '>₹');

// Additional exact matches in jsx text:
code = code.replace(/\$([0-9]+\.[0-9]{2})/g, '₹$1'); // e.g. "$499.00" -> "₹499.00"

fs.writeFileSync('src/App.jsx', code, 'utf8');

console.log("App.jsx fix applied!");
