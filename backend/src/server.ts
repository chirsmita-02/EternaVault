import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import router from './routes/index.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Add debug middleware at the very beginning
app.use((req, res, next) => {
  console.log(`=== DEBUG MIDDLEWARE ===`);
  console.log(`Received ${req.method} request to ${req.url}`);
  console.log('Request body:', req.body);
  console.log('========================');
  next();
});

// Add a simple test route at the very beginning
app.get('/test-simple', (_req: Request, res: Response) => {
  console.log('Simple test route accessed');
  res.json({ message: 'Simple test route working' });
});

// Add a specific debug route for registration
app.post('/api/auth/register-debug', (req, res) => {
  console.log('Debug registration route accessed');
  console.log('Request body:', req.body);
  res.json({ message: 'Debug registration successful', received: req.body });
});

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));
app.use('/api', router);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || '';

async function start() {
	if (!MONGO_URI) {
		const { MongoMemoryServer } = await import('mongodb-memory-server');
		const mem = await MongoMemoryServer.create();
		await mongoose.connect(mem.getUri());
		console.log('Connected to in-memory MongoDB');
	} else {
		console.log('Connecting to MongoDB Atlas...');
		await mongoose.connect(MONGO_URI);
		console.log('Connected to MongoDB Atlas successfully!');
	}
	app.listen(PORT, () => console.log(`API listening on :${PORT}`));
}

start().catch((err: any) => {
	console.error('Startup error:', err);
	process.exit(1);
});