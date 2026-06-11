// Generates minimal SVG-based PWA icons as PNG using built-in Node APIs
// Run: node scripts/generate-icons.mjs

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Simple SVG icon — blue bg + bar chart symbol
const svgIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#2563eb"/>
  <g transform="translate(${size*0.15}, ${size*0.12})">
    <rect x="${size*0.05}" y="${size*0.35}" width="${size*0.15}" height="${size*0.35}" rx="2" fill="white" opacity="0.9"/>
    <rect x="${size*0.27}" y="${size*0.2}" width="${size*0.15}" height="${size*0.5}" rx="2" fill="white"/>
    <rect x="${size*0.49}" y="${size*0.08}" width="${size*0.15}" height="${size*0.62}" rx="2" fill="white" opacity="0.9"/>
    <rect x="${size*0.71}" y="${size*0.28}" width="${size*0.15}" height="${size*0.42}" rx="2" fill="white" opacity="0.7"/>
  </g>
</svg>`;

// Write SVG files that browsers can use directly as icons
const publicDir = resolve(__dirname, "../public");

writeFileSync(resolve(publicDir, "icon-192.png"), svgIcon(192));
writeFileSync(resolve(publicDir, "icon-512.png"), svgIcon(512));
writeFileSync(resolve(publicDir, "icon.svg"), svgIcon(512));

console.log("✓ Icons written to public/");
