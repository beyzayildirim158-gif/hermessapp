#!/usr/bin/env node
/**
 * Generates square placeholder app icons (1024, 512, 192) from a gradient + emblem text.
 * This is a temporary helper to satisfy Expo's square icon requirement.
 */
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

async function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }

async function generate(){
  const assetsDir = path.join(process.cwd(),'assets');
  await ensureDir(assetsDir);
  const primarySize = 1024;
  const sizes = [1024, 512, 192];

  // Colors for mystical gradient
  const topColor = {r:25,g:17,b:46}; // deep indigo
  const bottomColor = {r:120,g:82,b:18}; // warm gold-brown

  for(const size of sizes){
    const img = new Jimp(size, size);
    for(let y=0;y<size;y++){
      const t = y/(size-1);
      const r = Math.round(topColor.r + (bottomColor.r-topColor.r)*t);
      const g = Math.round(topColor.g + (bottomColor.g-topColor.g)*t);
      const b = Math.round(topColor.b + (bottomColor.b-topColor.b)*t);
      for(let x=0;x<size;x++){
        img.setPixelColor(Jimp.rgbaToInt(r,g,b,255), x, y);
      }
    }
    // Add subtle radial highlight
    const center = size/2;
    const radius = size*0.45;
    for(let y=0;y<size;y++){
      for(let x=0;x<size;x++){
        const dx=x-center, dy=y-center;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<radius){
          const fade = 1 - (d/radius);
          const idx = img.getPixelIndex(x,y);
          const r=img.bitmap.data[idx];
            img.bitmap.data[idx] = Math.min(255, r + 40*fade);
        }
      }
    }

    // Load built-in font for placeholder monogram
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
    const text = 'H';
    const textImg = new Jimp(size, size, 0x00000000);
    textImg.print(font,0,0,{text,alignmentX:Jimp.HORIZONTAL_ALIGN_CENTER,alignmentY:Jimp.VERTICAL_ALIGN_MIDDLE}, size, size);

    // Slight glow
    textImg.blur(Math.max(1, Math.round(size/256)));
    img.composite(textImg,0,0);

    const outName = size===primarySize ? 'app-icon.png' : `app-icon-${size}.png`;
    const outPath = path.join(assetsDir, outName);
    await img.writeAsync(outPath);
    console.log('Generated', outName);
  }
  console.log('Square placeholder icons created. Update app.json to use assets/app-icon.png if not already.');
}

generate().catch(e=>{ console.error(e); process.exit(1); });
