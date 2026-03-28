/**
 * formsAuth.js
 * Собственный middleware-модуль для FORMS-аутентификации.
 *
 * Экспортирует три функции:
 *   formsAuth.login(req, res, next)   — проверяет POST /login (username + password)
 *   formsAuth.protect(req, res, next) — защищает маршрут, редиректит на /login
 *   formsAuth.logout(req, res)        — уничтожает сессию
 */

const usersData = require('./users.json');

// ─── Вспомогательная функция поиска пользователя ──────────────────────────────
function findUser(username, password) {
  return usersData.users.find(
    u => u.username === username && u.password === password
  ) || null;
}

// ─── Middleware: обработка POST /login ────────────────────────────────────────
function login(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.redirect('/login?error=empty');
  }

  const user = findUser(username, password);

  if (!user) {
    return res.redirect('/login?error=invalid');
  }

  // Сохраняем пользователя в сессии
  req.session.user = { username: user.username };
  req.session.save(() => {
    res.redirect('/resource');
  });
}

// ─── Middleware: защита маршрута ──────────────────────────────────────────────
function protect(req, res, next) {
  if (req.session && req.session.user) {
    // Пользователь аутентифицирован — продолжаем
    return next();
  }
  // Не аутентифицирован — редирект на форму входа
  res.redirect('/login');
}

// ─── Middleware: выход ────────────────────────────────────────────────────────
function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}

module.exports = { login, protect, logout };