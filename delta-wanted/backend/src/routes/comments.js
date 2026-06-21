import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../models/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/:bountyId/comments', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: '评论不能为空' });

  const bounty = db.prepare('SELECT id FROM bounties WHERE id = ?').get(req.params.bountyId);
  if (!bounty) return res.status(404).json({ error: '通缉令不存在' });

  const id = uuid();
  db.prepare(
    'INSERT INTO bounty_comments (id, bounty_id, user_id, content) VALUES (?, ?, ?, ?)'
  ).run(id, req.params.bountyId, req.user.id, content.trim());

  const comment = db.prepare(`
    SELECT c.*, u.username, u.avatar
    FROM bounty_comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).get(id);

  res.json({ comment });
});

export default router;
