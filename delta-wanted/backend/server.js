import express from 'express';
import cors from 'cors';
import authRoutes from './src/routes/auth.js';
import bountyRoutes from './src/routes/bounties.js';
import commentRoutes from './src/routes/comments.js';
import messageRoutes from './src/routes/messages.js';
import userRoutes from './src/routes/users.js';
import './src/models/db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/bounties', bountyRoutes);
app.use('/api/bounties', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[backend] Delta Wanted API running on http://localhost:${PORT}`);
});
