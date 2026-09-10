import express from 'express';
import cors from 'cors';
import { apiRouter } from './api.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API v1 Namespace
app.use('/api/v1', apiRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[SaaS Backend] Express API server running on http://localhost:${PORT}`);
});
