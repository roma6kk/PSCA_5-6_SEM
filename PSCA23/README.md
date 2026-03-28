# Лабораторная работа — Node.js криптография

## Задание 01 — Диффи-Хеллман + AES (23-01s / 23-01c)

### Протокол обмена DH:

```
Клиент                            Сервер
  │                                  │
  │─── GET / ───────────────────────▶│  (1) Запрашивает параметры
  │◀── { p, g, serverPublic, tempId }│  Сервер генерирует serverPrivate,
  │                                  │  вычисляет serverPublic = g^serverPrivate mod p
  │                                  │
  │─── POST /dh-init ───────────────▶│  (2) Клиент отправляет clientPublic
  │    { clientPublic, tempId }       │  Сервер вычисляет sharedSecret = clientPublic^serverPrivate mod p
  │◀── { status:'ok', sessionId } ───│  Оба деривируют sessionKey = SHA-256(sharedSecret)
  │                                  │
  │─── GET /resource?sessionId= ────▶│  (3) Запрос зашифрованного файла
  │◀── { iv, data }  ────────────────│  AES-256-CBC(sessionKey, iv, student.txt)
  │                                  │
  │  Расшифровывает, пишет на диск   │
```

При нарушении шагов — сервер отвечает **409**.

### Запуск:

**Терминал 1 — сервер:**
```bash
cd psca23/psca23-01/23-01s
npm install
node server.js
```

**Терминал 2 — клиент:**
```bash
cd psca23/psca23-01/23-01c
node client.js
```

Результат сохраняется в `task01/23-01c/decrypted_student.txt`.

---

## Задание 02 — Цифровая подпись RSA (23-02s / 23-02c)

### Протокол обмена:

```
Клиент                              Сервер
  │                                    │
  │─── GET / ─────────────────────────▶│  (1) Запрос публичного ключа
  │◀── { publicKey(PEM), challengeToken}│  Сервер отдаёт RSA-публичный ключ
  │                                    │  + одноразовый challengeToken
  │                                    │
  │─── POST /sign-init ───────────────▶│  (2) Клиент подтверждает получение
  │    { challengeToken }               │  Сервер инвалидирует token (разовый!)
  │◀── { status:'ok', sessionId } ─────│  Создаёт сессию
  │                                    │
  │─── GET /resource?sessionId= ──────▶│  (3) Запрос ресурса
  │◀── { text, signature(Base64) } ────│  Подпись: RSA-SHA256(privateKey, text)
  │                                    │
  │  verify(publicKey, text, signature)│
  │  → вывод результата в консоль      │
```

При нарушении любого шага — сервер отвечает **409**.

### Запуск:

**Терминал 1 — сервер:**
```bash
cd task02/23-02s
npm install
node server.js
```

**Терминал 2 — клиент:**
```bash
cd task02/23-02c
node client.js
```

---

## Используемые алгоритмы

| Задание | Алгоритм           | Модуль Node.js |
|---------|--------------------|----------------|
| 01      | DH (MODP-2048)     | встроенный `crypto` (BigInt modPow) |
| 01      | AES-256-CBC        | `crypto.createCipheriv` |
| 01      | SHA-256 (KDF)      | `crypto.createHash` |
| 02      | RSA-2048           | `crypto.generateKeyPairSync` |
| 02      | RSA-SHA256 подпись | `crypto.createSign` / `createVerify` |

Все алгоритмы реализованы через **встроенный модуль `crypto`** Node.js —
внешние криптографические библиотеки не используются.
