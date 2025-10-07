import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('MONGO_URI:', process.env.MONGO_URI);

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('Connected successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Connection error:', err);
      process.exit(1);
    });
} else {
  console.log('No MONGO_URI provided');
  process.exit(1);
}