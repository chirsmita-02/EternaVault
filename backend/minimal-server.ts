import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, '.env') });

import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Simple test endpoint
app.get('/test', (_req: Request, res: Response) => {
  res.json({ message: 'Server is running' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Minimal API listening on :${PORT}`));