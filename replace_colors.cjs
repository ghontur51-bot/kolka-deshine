const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

const replacements = {
  '#A284C5': '#FFB800', // Gold/Yellow
  '#2A2431': '#000000', // Black
  '#7E6A93': '#82e3f0ff', // Blue
  '#F7F5FA': '#111111', // Very Dark Grey
  '#EBE6F0': '#1A1A1A', // Dark Grey
  'bg-white': 'bg-[#111111]', // Cards background to dark
  'text-gray-700': 'text-gray-300',
  'text-gray-500': 'text-gray-400',
  'bg-gray-50': 'bg-[#1A1A1A]',
  'bg-gray-100': 'bg-[#222222]',
  'border-gray-50': 'border-[#222222]',
  'border-gray-100': 'border-[#333333]',
  'text-\\[#2A2431\\]': 'text-white', // Replace old dark text with white text for readability on dark background
  'C O Z Y': 'K O L K A A',
  'T H R E A D S': 'D E S H I N E S',
  'Cozy Threads': 'Kolkaa Deshines',
  'Where every thread tells a story': 'Illuminating tradition with modern aesthetics',
  'Tiny <span className="text-\\[#FFB800\\] italic">Pieces</span><br />of Joy.': 'Kolka <span className="text-[#FFB800] italic">Vibe</span><br />Illuminated.',
  'Aesthetic handcrafted items , designed to sprinkle little threads of magic in your everyday life.': 'Aesthetic kolka designs, bringing yellow, blue and black illumination to your everyday life.',
  'bg-white/90': 'bg-[#000000]/90',
  'text-white': 'text-[#E0E0E0]', // Soft white for text
  'bg-white text-\\[#FFB800\\]': 'bg-[#111111] text-[#FFB800]', // Active tabs
};

for (const [key, value] of Object.entries(replacements)) {
  const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  content = content.replace(regex, value);
}

// Special overrides
content = content.replace(/text-\\[#000000\\]/g, 'text-white'); // Headings should be white or gold
content = content.replace(/bg-\\[#000000\\]/g, 'bg-black');
content = content.replace(/text-\\[#FFB800\\] font-medium hover:text-\\[#82e3f0ff\\]/g, 'text-white font-medium hover:text-[#FFB800]'); // Navbar links
content = content.replace(/bg-\\[#111111\\] border-2 border-\\[#82e3f0ff\\] text-\\[#82e3f0ff\\] hover:bg-\\[#82e3f0ff\\]/g, 'bg-transparent border-2 border-[#FFB800] text-[#FFB800] hover:bg-[#FFB800]'); // Secondary button
content = content.replace(/bg-gradient-to-r from-\\[#82e3f0ff\\] to-\\[#000000\\] text-\\[#E0E0E0\\]/g, 'bg-gradient-to-r from-[#FFB800] to-[#82e3f0ff] text-black'); // Magic button

fs.writeFileSync('src/App.jsx', content);
console.log('Colors and text replaced in App.jsx');
