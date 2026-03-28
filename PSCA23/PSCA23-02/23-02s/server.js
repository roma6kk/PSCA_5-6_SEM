/**
 * 23-02s — Сервер: цифровая подпись RSA-SHA256
 *
 * Протокол обмена:
 *   1. GET /           → сервер отдаёт { publicKey } (PEM) + выдаёт challengeToken
 *   2. POST /sign-init → клиент присылает { challengeToken } (подтверждение),
 *                        сервер выдаёт sessionId
 *   3. GET /resource?sessionId=<id>
 *                     → сервер отдаёт { text, signature } (Base64)
 *
 * При нарушении любого шага → 409
 */

const express = require('express');
const crypto  = require('crypto');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 3002;

app.use(express.json());

// ── Генерируем пару ключей RSA при старте сервера ─────────────────────────────
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

console.log('[INIT] RSA 2048-bit ключевая пара сгенерирована');

// хранилище: challengeToken → использован?  /  sessionId → валиден
const challenges = new Map(); // token → timestamp
const sessions   = new Map(); // sessionId → true

// ── Маршруты ──────────────────────────────────────────────────────────────────

// Шаг 1: клиент узнаёт публичный ключ и получает challenge
app.get('/', (req, res) => {
  const challengeToken = crypto.randomBytes(32).toString('hex');
  challenges.set(challengeToken, Date.now());
  console.log('[1] Выдан challengeToken:', challengeToken.slice(0, 16) + '...');
  res.json({ publicKey, challengeToken });
});

// Шаг 2: клиент подтверждает получение challenge → сервер создаёт сессию
app.post('/sign-init', (req, res) => {
  const { challengeToken } = req.body;

  if (!challengeToken) {
    return res.status(409).json({ error: 'Нарушение схемы: отсутствует challengeToken' });
  }

  if (!challenges.has(challengeToken)) {
    return res.status(409).json({ error: 'Нарушение схемы: неизвестный или уже использованный challengeToken' });
  }

  // разовый token — удаляем после использования
  challenges.delete(challengeToken);

  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, true);

  console.log('[2] Сессия создана:', sessionId);
  res.json({ status: 'ok', sessionId });
});

// Шаг 3: возвращаем файл + подпись
app.get('/resource', (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(409).json({ error: 'Нарушение схемы: sessionId не передан' });
  }

  if (!sessions.has(sessionId)) {
    return res.status(409).json({ error: 'Нарушение схемы: сессия не найдена' });
  }

  // разовый доступ
  sessions.delete(sessionId);

  const filePath = path.join(__dirname, 'student.txt');
  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: 'student.txt не найден' });
  }

  const text = fs.readFileSync(filePath, 'utf8');

  // Подписываем RSA-SHA256
  const sign      = crypto.createSign('SHA256');
  sign.update(text);
  sign.end();
  const signature = sign.sign(privateKey, 'base64');

  console.log('[3] Файл подписан и отправлен для sessionId:', sessionId);

  res.json({ text, signature });
});

app.listen(PORT, () => {
  console.log(`23-02s сервер запущен: http://localhost:${PORT}`);
});
