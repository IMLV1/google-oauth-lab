// ตรวจข้อกำหนดข้อ 3 ของแล็บ: client_secret ต้องไม่หลุดไปอยู่ใน bundle ฝั่ง client
// รันด้วย: npm run check:secret
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../client/dist/', import.meta.url).pathname;
const NEEDLES = ['GOCSPX-', 'client_secret', 'CLIENT_SECRET'];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

let hits = 0;
for (const file of walk(DIST)) {
  const text = readFileSync(file, 'utf8');
  for (const needle of NEEDLES) {
    if (text.includes(needle)) {
      console.error(`พบ "${needle}" ใน ${file.replace(DIST, 'dist/')}`);
      hits++;
    }
  }
}

if (hits) {
  console.error(`\nไม่ผ่าน — มีร่องรอยของ secret ${hits} จุดใน bundle`);
  process.exit(1);
}
console.log('ผ่าน — ไม่พบ client_secret ใน bundle ฝั่ง client');
