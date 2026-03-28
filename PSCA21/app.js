const express = require('express');
const session = require('express-session');
const formsAuth = require('./formsAuth');

const app = express();
const PORT = 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: false })); // парсинг form-данных
app.use(express.json());

app.use(session({
  secret: 'secret-key-21-03',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

// ─── Страница входа (GET) ─────────────────────────────────────────────────────
app.get('/login', (req, res) => {
  // Если уже залогинен — сразу на /resource
  if (req.session && req.session.user) {
    return res.redirect('/resource');
  }

  const error = req.query.error;
  let errorMsg = '';
  if (error === 'invalid') errorMsg = 'Неверный логин или пароль.';
  if (error === 'empty')   errorMsg = 'Введите логин и пароль.';

  res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Вход — 21-03</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #f0f2f5;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      background: #fff;
      padding: 2rem 2.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      width: 320px;
    }
    h1 { font-size: 1.4rem; margin-bottom: 1.5rem; color: #1a1a2e; }
    label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 0.25rem; }
    input {
      width: 100%;
      padding: 0.55rem 0.75rem;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-size: 0.95rem;
      margin-bottom: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: #4a90e2; }
    button {
      width: 100%;
      padding: 0.65rem;
      background: #4a90e2;
      color: #fff;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #357abd; }
    .error {
      background: #ffe0e0;
      color: #c0392b;
      padding: 0.5rem 0.75rem;
      border-radius: 5px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔐 Вход в систему</h1>
    ${errorMsg ? `<div class="error">${errorMsg}</div>` : ''}
    <form method="POST" action="/login">
      <label for="username">Логин</label>
      <input type="text" id="username" name="username" placeholder="admin" autofocus>
      <label for="password">Пароль</label>
      <input type="password" id="password" name="password" placeholder="••••••••">
      <button type="submit">Войти</button>
    </form>
  </div>
</body>
</html>`);
});

// ─── Обработка POST /login (наш middleware) ───────────────────────────────────
app.post('/login', formsAuth.login);

// ─── Защищённый ресурс ────────────────────────────────────────────────────────
app.get('/resource', formsAuth.protect, (req, res) => {
  const { username } = req.session.user;
  res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Ресурс — 21-03</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #f0f2f5;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      background: #fff;
      padding: 2rem 2.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      text-align: center;
      width: 320px;
    }
    h1 { font-size: 1.4rem; color: #1a1a2e; margin-bottom: 0.75rem; }
    p { color: #555; margin-bottom: 1.5rem; }
    a {
      display: inline-block;
      padding: 0.55rem 1.25rem;
      background: #e74c3c;
      color: #fff;
      border-radius: 5px;
      text-decoration: none;
      font-size: 0.95rem;
      transition: background 0.2s;
    }
    a:hover { background: #c0392b; }
  </style>
</head>
<body>
  <div class="card">
    <h1>✅ RESOURCE</h1>
    <p>Привет, <b>${username}</b>!</p>
    <a href="/logout">Выйти</a>
  </div>
</body>
</html>`);
});

// ─── Выход ────────────────────────────────────────────────────────────────────
app.get('/logout', formsAuth.logout);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// ─── Запуск ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server 21-03 is running on http://localhost:${PORT}`);
  console.log('Routes:');
  console.log(`  GET  /login    — форма входа`);
  console.log(`  POST /login    — обработка формы (formsAuth middleware)`);
  console.log(`  GET  /resource — защищённый ресурс`);
  console.log(`  GET  /logout   — выход`);
});