import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import router from './routes/index.js';

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');
console.log('RPC_URL:', process.env.RPC_URL ? 'SET' : 'NOT SET');
console.log('REGISTRY_ADDRESS:', process.env.REGISTRY_ADDRESS ? 'SET' : 'NOT SET');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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