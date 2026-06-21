import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import db from '../models/db.js';
import { signToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  if (username.length < 2 || username.length > 20) return res.status(400).json({ error: '用户名2-20个字符' });
  if (password.length < 6) return res.status(400).json({ error: '密码至少6位' });

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(400).json({ error: '用户名已存在' });

  const id = uuid();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(id, username, hash);

  const token = signToken({ id, username });
  res.json({ token, user: { id, username, avatar: '' } });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }

  const token = signToken({ id: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar } });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, avatar FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

export default router;
