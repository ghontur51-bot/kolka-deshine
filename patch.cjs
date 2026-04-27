const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Fix Currency Doubling (₹$)
appCode = appCode.replace(/₹\$/g, '₹');
appCode = appCode.replace(/>\$(?=\d)/g, '>₹'); 

// 2. Add Animations for Mac OS Zoom
const styleBlockTarget = '</style>';
const newAnimations = `
        @keyframes zoomIn95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .zoom-in-95 { animation: zoomIn95 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
`;
if (!appCode.includes('@keyframes zoomIn95')) {
    appCode = appCode.replace('</style>', newAnimations + '      </style>');
}

// 3. Make the Entire Card Clickable to open Preview Modal
appCode = appCode.replace(
    '<div key={item.id} className="group bg-white rounded-3xl p-4 shadow-sm flex flex-col relative animate-in slide-in-from-bottom-4">',
    '<div key={item.id} onClick={() => { setSelectedProduct(item); setSelectedQty(1); }} className="group bg-white rounded-3xl p-4 shadow-sm flex flex-col relative animate-in slide-in-from-bottom-4 cursor-pointer hover:shadow-xl transition-all">'
);

// Stop the cart button from opening event firing twice by capturing event
appCode = appCode.replace(
    'onClick={() => { setSelectedProduct(item); setSelectedQty(1); }} className="bg-[#A284C5] text-white p-2.5',
    'onClick={(e) => { e.stopPropagation(); addToCart(item, 1); }} className="bg-[#A284C5] text-white p-2.5'
);

// 4. Update the Mac Modal UI to look much more Aesthetic and handle multiple images!
const macModalStart = '      {/* MAC-STYLE PRODUCT MODAL */}';
const macModalEnd = '        </div>\n      )}'; // Be careful matching this correctly
// Actually, I can use a simpler targeted replace for the Mac Modal image section to add multiple images support!

appCode = appCode.replace(
    /<img src={\(Array.isArray\(selectedProduct.images\).*? className="w-full max-h-64 object-contain.*? \/>/,
    `{Array.isArray(selectedProduct.images) && selectedProduct.images.length > 1 ? (
                 <div className="w-full h-full flex overflow-x-auto gap-4 snap-x snap-mandatory no-scrollbar p-4">
                    {selectedProduct.images.map((imgUrl, idx) => (
                      <img key={idx} src={imgUrl} onError={(e)=> {e.target.src='https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&w=400';}} alt={selectedProduct.name} className="w-full h-full object-contain shrink-0 snap-center rounded-2xl shadow-sm bg-white/50 border border-[#A284C5]/10 hover:scale-[1.02] transition-transform duration-300" />
                    ))}
                 </div>
              ) : (
                 <img src={Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0 ? selectedProduct.images[0] : (selectedProduct.img || 'https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&w=400')} onError={(e)=> {e.target.src='https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&w=400';}} alt={selectedProduct.name} className="w-full max-h-72 object-contain rounded-2xl animate-rich-float hover:scale-105 transition-transform duration-500 bg-white/50 p-4 border border-[#A284C5]/10 shadow-sm" />
              )}`
);

// Fix store image fallback nicely too
appCode = appCode.replace(
    /<img src={\(Array.isArray\(item.images\)(.*?)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" \/>/g,
    '<img src={(Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : (item.img || "https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&w=400"))} onError={(e)=>{e.target.src="https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&w=400";}} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-[#EBE6F0]" />'
);

// Mac modal aesthetics tweaks
appCode = appCode.replace(
    'relative bg-[#F7F5FA] rounded-[2rem] w-full max-w-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 border border-white',
    'relative bg-[#F7F5FA] rounded-[2rem] w-full max-w-3xl shadow-[0_30px_60px_-15px_rgba(42,36,49,0.3)] flex flex-col md:flex-row overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 border-2 border-white/50 backdrop-blur-xl'
);
appCode = appCode.replace(
    'w-full md:w-1/2 bg-white relative p-12 flex flex-col justify-center items-center',
    'w-full md:w-1/2 bg-gradient-to-br from-white to-[#F7F5FA]/50 relative p-10 flex flex-col justify-center items-center overflow-hidden'
);


fs.writeFileSync('src/App.jsx', appCode, 'utf8');
console.log("App.jsx heavily patched!");
