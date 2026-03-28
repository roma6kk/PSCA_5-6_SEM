/**
 * 23-01c — Клиент: Диффи-Хеллман + расшифровка файла
 *
 * Порядок работы:
 *   1. GET /           → получаем p, g, serverPublic, tempId
 *   2. POST /dh-init   → отправляем clientPublic, получаем sessionId
 *   3. GET /resource   → получаем зашифрованный файл, расшифровываем, пишем на диск
 */

const http   = require('http');
const crypto = require('crypto');
const fs     = require('fs');

const SERVER_HOST = 'localhost';
const SERVER_PORT = 3001;
const OUT_FILE    = 'decrypted_student.txt';

// ── Утилиты ───────────────────────────────────────────────────────────────────

function modPow(base, exp, mod) {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}

function randomBigInt(bits = 256) {
  const bytes = crypto.randomBytes(bits / 8);
  return BigInt('0x' + bytes.toString('hex'));
}

function bigIntToHex(n) {
  return n.toString(16).padStart(512, '0');
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: SERVER_HOST,
      port:     SERVER_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 409) {
          reject(new Error(`[409] Сервер: нарушение схемы — ${data}`));
        } else if (res.statusCode >= 400) {
          reject(new Error(`[${res.statusCode}] ${data}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Основной поток ────────────────────────────────────────────────────────────

async function main() {
  console.log('=== 23-01c: Клиент запущен ===\n');

  // ── Шаг 1: получаем DH-параметры от сервера ──
  console.log('[1] GET / — запрашиваем параметры DH...');
  const { p: pHex, g: gStr, serverPublic: spHex, tempId } = await request('GET', '/');

  const p = BigInt('0x' + pHex);
  const g = BigInt(gStr);

  console.log('    Получены: p (2048 бит), g =', gStr, ', tempId:', tempId);

  // ── Шаг 2: генерируем пару клиента ──
  const clientPrivate = randomBigInt(256);
  const clientPublic  = modPow(g, clientPrivate, p);

  console.log('\n[2] POST /dh-init — отправляем clientPublic...');
  const { sessionId } = await request('POST', '/dh-init', {
    clientPublic: bigIntToHex(clientPublic),
    tempId,
  });
  console.log('    Получен sessionId:', sessionId);

  // ── Вычисляем сеансовый ключ на стороне клиента ──
  const serverPublicBig = BigInt('0x' + spHex);
  const sharedSecret    = modPow(serverPublicBig, clientPrivate, p);
  const secretHex       = sharedSecret.toString(16).padStart(512, '0');
  const sessionKey      = crypto.createHash('sha256').update(secretHex).digest();

  console.log('    Сеансовый ключ вычислен (SHA-256 от общего секрета DH)');

  // ── Шаг 3: получаем зашифрованный файл ──
  console.log('\n[3] GET /resource — запрашиваем зашифрованный файл...');
  const { iv: ivHex, data: dataHex } = await request('GET', `/resource?sessionId=${sessionId}`);

  const iv        = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(dataHex, 'hex');

  // ── Расшифровываем ──
  const decipher  = crypto.createDecipheriv('aes-256-cbc', sessionKey, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  fs.writeFileSync(OUT_FILE, decrypted);
  console.log(`\n✅ Файл расшифрован и сохранён: ${OUT_FILE}`);
  console.log('   Содержимое:', decrypted.toString('utf8').trim());
}

main().catch(err => {
  console.error('\n❌ Ошибка:', err.message);
  process.exit(1);
});
