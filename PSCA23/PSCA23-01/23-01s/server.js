/**
 * 23-01s — Сервер: Диффи-Хеллман + AES-шифрование файла
 *
 * Протокол обмена (DH):
 *   1. GET /          → сервер отдаёт { p, g, serverPublic }
 *   2. POST /dh-init  → клиент присылает { clientPublic }
 *                       сервер вычисляет сеансовый ключ, сохраняет в сессии
 *                       → отвечает { status: 'ok', sessionId }
 *   3. GET /resource?sessionId=<id>
 *                     → сервер шифрует файл (AES-256-CBC) сеансовым ключом
 *                       → отдаёт { iv, data } (hex)
 */

const express = require('express');
const crypto  = require('crypto');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 3001;

app.use(express.json());

// ── DH-параметры (2048-bit MODP group 14, RFC 3526) ──────────────────────────
const DH_PRIME = (
  'ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd1' +
  '29024e088a67cc74020bbea63b139b22514a08798e3404dd' +
  'ef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245' +
  'e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7ed' +
  'ee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3d' +
  'c2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f' +
  '83655d23dca3ad961c62f356208552bb9ed529077096966d' +
  '670c354e4abc9804f1746c08ca18217c32905e462e36ce3b' +
  'e39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9' +
  'de2bcbf6955817183995497cea956ae515d2261898fa0510' +
  '15728e5a8aacaa68ffffffffffffffff'
);
const DH_GENERATOR = 2n;
const p = BigInt('0x' + DH_PRIME);
const g = DH_GENERATOR;

// хранилище сессий { sessionId → sessionKey (Buffer) }
const sessions = new Map();

function randomBigInt(bits = 256) {
  const bytes = crypto.randomBytes(bits / 8);
  return BigInt('0x' + bytes.toString('hex'));
}

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

function bigIntToHex(n) {
  return n.toString(16).padStart(512, '0');   // 2048 bit → 512 hex chars
}

// ── Маршруты ──────────────────────────────────────────────────────────────────

// Шаг 1: клиент инициирует соединение
app.get('/', (req, res) => {
  const serverPrivate = randomBigInt(256);
  const serverPublic  = modPow(g, serverPrivate, p);

  // временно храним приватный ключ сервера под временным id
  const tempId = crypto.randomUUID();
  sessions.set('pending:' + tempId, { serverPrivate });

  console.log('[DH] Шаг 1 — отправляем параметры клиенту, tempId:', tempId);

  res.json({
    p:            bigIntToHex(p),
    g:            g.toString(),
    serverPublic: bigIntToHex(serverPublic),
    tempId,
  });
});

// Шаг 2: клиент присылает свой открытый ключ
app.post('/dh-init', (req, res) => {
  const { clientPublic, tempId } = req.body;

  if (!clientPublic || !tempId) {
    return res.status(409).json({ error: 'Нарушение схемы: отсутствуют clientPublic или tempId' });
  }

  const pending = sessions.get('pending:' + tempId);
  if (!pending) {
    return res.status(409).json({ error: 'Нарушение схемы: неизвестный tempId или истёк' });
  }

  let clientPubBig;
  try {
    clientPubBig = BigInt('0x' + clientPublic);
  } catch {
    return res.status(409).json({ error: 'Нарушение схемы: некорректный clientPublic' });
  }

  // вычисляем общий секрет
  const sharedSecret = modPow(clientPubBig, pending.serverPrivate, p);
  const secretHex    = sharedSecret.toString(16).padStart(512, '0');

  // деривация ключа AES-256: SHA-256 от общего секрета
  const sessionKey = crypto.createHash('sha256').update(secretHex).digest();

  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { key: sessionKey });
  sessions.delete('pending:' + tempId);

  console.log('[DH] Шаг 2 — сеансовый ключ вычислен, sessionId:', sessionId);

  res.json({ status: 'ok', sessionId });
});

// Шаг 3: отдаём зашифрованный файл
app.get('/resource', (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(409).json({ error: 'Нарушение схемы: не передан sessionId' });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(409).json({ error: 'Нарушение схемы: сессия не найдена' });
  }

  const filePath = path.join(__dirname, 'student.txt');
  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: 'Файл student.txt не найден на сервере' });
  }

  const plainText = fs.readFileSync(filePath);
  const iv        = crypto.randomBytes(16);
  const cipher    = crypto.createCipheriv('aes-256-cbc', session.key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()]);

  console.log('[RES] Файл зашифрован и отправлен для sessionId:', sessionId);

  res.json({
    iv:   iv.toString('hex'),
    data: encrypted.toString('hex'),
  });
});

app.listen(PORT, () => {
  console.log(`23-01s сервер запущен: http://localhost:${PORT}`);
});
