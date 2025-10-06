import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	passwordHash: { type: String, required: true },
	role: { type: String, enum: ['admin', 'insurer', 'claimant', 'registrar'], required: true },
	walletAddress: { type: String },
	approved: { type: Boolean, default: false }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
