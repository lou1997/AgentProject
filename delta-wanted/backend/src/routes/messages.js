import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../models/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/conversations', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.username, u.avatar,
      (SELECT content FROM messages m2 WHERE (m2.from_id = m.from_id AND m2.to_id = m.to_id) OR (m2.from_id = m.to_id AND m2.to_id = m.from_id) ORDER BY m2.created_at DESC LIMIT 1) as last_msg,
      (SELECT created_at FROM messages m2 WHERE (m2.from_id = m.from_id AND m2.to_id = m.to_id) OR (m2.from_id = m.to_id AND m2.to_id = m.from_id) ORDER BY m2.created_at DESC LIMIT 1) as last_time,
      SUM(CASE WHEN m.to_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) as unread
    FROM messages m
    JOIN users u ON (CASE WHEN m.from_id = ? THEN m.to_id = u.id ELSE m.from_id = u.id END)
    WHERE m.from_id = ? OR m.to_id = ?
    GROUP BY u.id
    ORDER BY last_time DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id);
  res.json({ conversations: rows });
});

router.get('/with/:userId', authMiddleware, (req, res) => {
  db.prepare(
    `UPDATE messages SET is_read = 1 WHERE to_id = ? AND from_id = ? AND is_read = 0`
  ).run(req.user.id, req.params.userId);

  const rows = db.prepare(`
    SELECT m.*, fu.username as from_name, tu.username as to_name
    FROM messages m
    LEFT JOIN users fu ON m.from_id = fu.id
    LEFT JOIN users tu ON m.to_id = tu.id
    WHERE (m.from_id = ? AND m.to_id = ?) OR (m.from_id = ? AND m.to_id = ?)
    ORDER BY m.created_at ASC
  `).all(req.user.id, req.params.userId, req.params.userId, req.user.id);
  res.json({ messages: rows });
});

router.post('/', authMiddleware, (req, res) => {
  const { to_id, content } = req.body;
  if (!to_id || !content) return res.status(400).json({ error: '收件人和内容不能为空' });

  const toUser = db.prepare('SELECT id FROM users WHERE id = ?').get(to_id);
  if (!toUser) return res.status(404).json({ error: '用户不存在' });

  const id = uuid();
  db.prepare(
    'INSERT INTO messages (id, from_id, to_id, content) VALUES (?, ?, ?, ?)'
  ).run(id, req.user.id, to_id, content.trim());

  const msg = db.prepare(`
    SELECT m.*, fu.username as from_name, tu.username as to_name
    FROM messages m
    LEFT JOIN users fu ON m.from_id = fu.id
    LEFT JOIN users tu ON m.to_id = tu.id
    WHERE m.id = ?
  `).get(id);

  res.json({ message: msg });
});

export default router;
