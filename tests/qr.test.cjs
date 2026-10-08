const assert=require('node:assert/strict'),qr=require('../dist/vendor/qrcode.js'),decode=require('../dist/vendor/jsQR.js');
const value='https://example.test/visitor?event=12345678-1234-1234-1234-123456789012#pass='+'a'.repeat(64);
const code=qr(0,'M');code.addData(value);code.make();const scale=5,border=4,size=(code.getModuleCount()+border*2)*scale,pixels=new Uint8ClampedArray(size*size*4);
for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.floor(y/scale)-border,c=Math.floor(x/scale)-border;const black=r>=0&&c>=0&&r<code.getModuleCount()&&c<code.getModuleCount()&&code.isDark(r,c);const i=(y*size+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=black?0:255;pixels[i+3]=255;}
assert.equal(decode(pixels,size,size).data,value);console.log('PASS: generated visitor QR is decoded by the bundled scanner.');
