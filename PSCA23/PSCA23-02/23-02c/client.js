/**
 * 23-02c — Клиент: получение файла + проверка цифровой подписи RSA-SHA256
 *
 * Порядок работы:
 *   1. GET /           → получаем publicKey (PEM) + challengeToken
 *   2. POST /sign-init → отправляем challengeToken, получаем sessionId
 *   3. GET /resource   → получаем { text, signature }
 *   4. Проверяем подпись локально, выводим результат в консоль
 */

const http   = require('http');
const crypto = require('crypto');

const SERVER_HOST = 'localhost';
const SERVER_PORT = 3002;

// ── HTTP-утилита ──────────────────────────────────────────────────────────────

function request(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: SERVER_HOST,
      port:     SERVER_PORT,
      path:     urlPath,
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
          reject(new Error(`[409] Нарушение схемы: ${data}`));
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
  console.log('=== 23-02c: Клиент запущен ===\n');

  // ── Шаг 1: получаем публичный ключ и challenge ──
  console.log('[1] GET / — запрашиваем публичный ключ и challengeToken...');
  const { publicKey, challengeToken } = await request('GET', '/');
  console.log('    Публичный ключ получен (RSA-2048 PEM)');
  console.log('    challengeToken:', challengeToken.slice(0, 16) + '...');

  // ── Шаг 2: подтверждаем challenge ──
  console.log('\n[2] POST /sign-init — подтверждаем challengeToken...');
  const { sessionId } = await request('POST', '/sign-init', { challengeToken });
  console.log('    sessionId:', sessionId);

  // ── Шаг 3: запрашиваем ресурс ──
  console.log('\n[3] GET /resource — получаем файл и подпись...');
  const { text, signature } = await request('GET', `/resource?sessionId=${sessionId}`);

  console.log('\n────────────────────────────────────');
  console.log('Полученный текст:');
  console.log(' ', text.trim());
  console.log('────────────────────────────────────');

  // ── Шаг 4: проверяем цифровую подпись ──
  const verify = crypto.createVerify('SHA256');
  verify.update(text);
  verify.end();
  const isValid = verify.verify(publicKey, signature, 'base64');

  if (isValid) {
    console.log('✅ Цифровая подпись ДЕЙСТВИТЕЛЬНА — файл подлинный, не изменён.');
  } else {
    console.log('❌ Цифровая подпись НЕДЕЙСТВИТЕЛЬНА — файл повреждён или подменён!');
  }
}

main().catch(err => {
  console.error('\n❌ Ошибка:', err.message);
  process.exit(1);
});
