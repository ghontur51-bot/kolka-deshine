const fs = require('fs');

function replaceInFile(path, replacements) {
    let content = fs.readFileSync(path, 'utf8');
    for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, value);
    }
    // Special regex replacements for App.jsx
    if (path === 'App.jsx') {
        // Change text-[#08090C] to text-white
        content = content.replace(/text-\[#08090C\]/g, 'text-white');
        // Change bg-[#F5F1E6] and bg-white to bg-[#08090C]
        content = content.replace(/bg-white/g, 'bg-[#08090C]');
        content = content.replace(/bg-\[#F5F1E6\]/g, 'bg-[#08090C]');
        // Make sure buttons with yellow background have dark text for contrast
        content = content.replace(/bg-\[#D4A42F\] text-white/g, 'bg-[#D4A42F] text-[#08090C]');
        // Fix up the overlay bg color since we want a clear image layer
        content = content.replace(/bg-\[#D7E4F2\]/g, 'bg-transparent');
    }
    
    if (path === 'src/AdminDashboard.jsx') {
        content = content.replace(/#A284C5/g, '#D4A42F');
        content = content.replace(/#2A2431/g, 'white');
        content = content.replace(/#7E6A93/g, '#1F4E79');
        content = content.replace(/#F7F5FA/g, '#08090C');
        content = content.replace(/bg-white/g, 'bg-[#08090C]');
        content = content.replace(/bg-gray-50/g, 'bg-[#11131a]');
        content = content.replace(/bg-gray-100/g, 'bg-[#1a1f26]');
        content = content.replace(/border-gray-50/g, 'border-[#222]');
        content = content.replace(/border-gray-100/g, 'border-[#333]');
        content = content.replace(/text-\[#2A2431\]/g, 'text-white');
        content = content.replace(/bg-\[#D4A42F\] text-white/g, 'bg-[#D4A42F] text-[#08090C]');
    }

    fs.writeFileSync(path, content);
}

replaceInFile('App.jsx', {
    "const COLORS = {\n  coffee: '#1F4E79', deepBrown: '#08090C', cream: '#F5F1E6',\n  mutedGreen: '#D7E4F2', softGold: '#D4A42F', white: '#FFFFFF',\n};": "const COLORS = {\n  coffee: '#1F4E79', deepBrown: '#08090C', cream: '#08090C',\n  mutedGreen: '#D7E4F2', softGold: '#D4A42F', white: '#FFFFFF',\n};",
    "bg-gray-50": "bg-[#11131a]",
    "bg-gray-100": "bg-[#1a1f26]",
    "border-gray-50": "border-[#222]",
    "border-gray-100": "border-[#333]",
    "text-gray-700": "text-gray-300",
    "text-gray-600": "text-gray-400",
    "text-gray-500": "text-gray-400",
});

replaceInFile('src/AdminDashboard.jsx', {});

replaceInFile('src/App.css', {
    "rgba(245, 241, 230, 0.94)": "rgba(8, 9, 12, 0.94)",
    "rgba(245, 241, 230, 0.96)": "rgba(8, 9, 12, 0.96)",
    "rgba(245, 241, 230, 1)": "rgba(8, 9, 12, 1)",
    "rgba(255, 255, 255, 0.98)": "rgba(8, 9, 12, 0.98)",
    "rgba(248, 245, 236, 0.98)": "rgba(8, 9, 12, 0.98)",
    "rgba(215, 228, 242, 0.24)": "rgba(8, 9, 12, 0.8)",
    "#f7f1df": "#08090c",
    "#f5f1e6": "#08090c",
    "#edf3f8": "#08090c",
    "color: #08090c;": "color: #ffffff;"
});

console.log('Theme updated to dark successfully!');
