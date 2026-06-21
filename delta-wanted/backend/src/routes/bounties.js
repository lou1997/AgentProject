import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../models/db.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, (req, res) => {
  const { status, page = '1', limit = '20' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = '';
  const params = [];
  if (status && status !== 'all') {
    where = 'WHERE b.status = ?';
    params.push(status);
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM bounties b ${where}`).get(...params);
  const rows = db.prepare(`
    SELECT b.*,
      u.username as creator_name, u.avatar as creator_avatar,
      h.username as hunter_name, h.avatar as hunter_avatar
    FROM bounties b
    LEFT JOIN users u ON b.creator_id = u.id
    LEFT JOIN users h ON b.hunter_id = h.id
    ${where}
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({
    bounties: rows,
    total: countRow.total,
    page: parseInt(page),
    totalPages: Math.ceil(countRow.total / parseInt(limit))
  });
});

router.get('/:id', optionalAuth, (req, res) => {
  const bounty = db.prepare(`
    SELECT b.*,
      u.username as creator_name, u.avatar as creator_avatar,
      h.username as hunter_name, h.avatar as hunter_avatar
    FROM bounties b
    LEFT JOIN users u ON b.creator_id = u.id
    LEFT JOIN users h ON b.hunter_id = h.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!bounty) return res.status(404).json({ error: '通缉令不存在' });

  const comments = db.prepare(`
    SELECT c.*, u.username, u.avatar
    FROM bounty_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.bounty_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);

  res.json({ bounty, comments });
});

router.post('/', authMiddleware, (req, res) => {
  const { game_id, reason, reward } = req.body;
  if (!game_id || !reason) return res.status(400).json({ error: '游戏ID和通缉理由不能为空' });

  const id = uuid();
  db.prepare(
    'INSERT INTO bounties (id, creator_id, game_id, reason, reward) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.user.id, game_id.trim(), reason.trim(), reward || '');

  res.json({ id, message: '通缉令发布成功' });
});

router.post('/:id/hunt', authMiddleware, (req, res) => {
  const bounty = db.prepare('SELECT * FROM bounties WHERE id = ?').get(req.params.id);
  if (!bounty) return res.status(404).json({ error: '通缉令不存在' });
  if (bounty.status !== 'active') return res.status(400).json({ error: '该通缉令已被接取或完成' });
  if (bounty.creator_id === req.user.id) return res.status(400).json({ error: '不能接自己的通缉令' });

  db.prepare('UPDATE bounties SET status = ?, hunter_id = ? WHERE id = ?')
    .run('hunting', req.user.id, req.params.id);
  res.json({ message: '接取成功，快去狩猎吧！' });
});

router.post('/:id/complete', authMiddleware, (req, res) => {
  const bounty = db.prepare('SELECT * FROM bounties WHERE id = ?').get(req.params.id);
  if (!bounty) return res.status(404).json({ error: '通缉令不存在' });
  if (bounty.creator_id !== req.user.id) return res.status(400).json({ error: '只有发布者才能确认完成' });
  if (bounty.status !== 'hunting') return res.status(400).json({ error: '该通缉令未被接取' });

  db.prepare('UPDATE bounties SET status = ? WHERE id = ?').run('completed', req.params.id);
  res.json({ message: '通缉完成！' });
});

router.post('/:id/cancel', authMiddleware, (req, res) => {
  const bounty = db.prepare('SELECT * FROM bounties WHERE id = ?').get(req.params.id);
  if (!bounty) return res.status(404).json({ error: '通缉令不存在' });
  if (bounty.creator_id !== req.user.id) return res.status(400).json({ error: '只有发布者才能撤销' });

  db.prepare('UPDATE bounties SET status = ? WHERE id = ?').run('cancelled', req.params.id);
  res.json({ message: '通缉令已撤销' });
});

export default router;
