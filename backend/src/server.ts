import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import router from './routes/index.js';

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
		await mongoose.connect(MONGO_URI);
	}
	app.listen(PORT, () => console.log(`API listening on :${PORT}`));
}

start().catch((err: any) => {
	console.error('Startup error:', err);
	process.exit(1);
});
