import { Router } from 'express';
import db from '../models/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/search', authMiddleware, (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ users: [] });
  const users = db.prepare(
    'SELECT id, username, avatar FROM users WHERE username LIKE ? AND id != ? LIMIT 10'
  ).all(`%${q}%`, req.user.id);
  res.json({ users });
});

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, avatar, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const posted = db.prepare('SELECT COUNT(*) as count FROM bounties WHERE creator_id = ?').get(req.params.id);
  const hunted = db.prepare('SELECT COUNT(*) as count FROM bounties WHERE hunter_id = ? AND status = ?').get(req.params.id, 'completed');

  res.json({ user, stats: { posted: posted.count, hunted: hunted.count } });
});

export default router;
