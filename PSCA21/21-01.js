const express = require('express');
const passport = require('passport');
const { BasicStrategy } = require('passport-http');
const session = require('express-session');

const usersData = require('./users.json');

const app = express();
const PORT = 3000;

app.use(session({
  secret: 'secret-key-21-01',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new BasicStrategy((username, password, done) => {
  const user = usersData.users.find(
    u => u.username === username && u.password === password
  );
  if (!user) {
    return done(null, false);
  }
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.username));
passport.deserializeUser((username, done) => {
  const user = usersData.users.find(u => u.username === username);
  done(null, user || false);
});

function isAuthenticated(req) {
  return req.isAuthenticated && req.isAuthenticated();
}

app.get('/login',
  passport.authenticate('basic', { session: true }),
  (req, res) => {
    res.send(`Logged in as <b>${req.user.username}</b>. <a href="/resource">Go to resource</a>`);
  }
);

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.send('You have been logged out. <a href="/login">Login again</a>');
  });
});

app.get('/resource', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.redirect('/login');
  }
  res.send('RESOURCE');
});

app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

app.listen(PORT, () => {
  console.log(`Server 21-01 is running on http://localhost:${PORT}`);
  console.log('Routes:');
  console.log(`  GET /login    — BASIC auth challenge`);
  console.log(`  GET /logout   — logout`);
  console.log(`  GET /resource — protected resource`);
});