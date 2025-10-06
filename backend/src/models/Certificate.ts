import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
	certificateId: { type: String, index: true },
	hash: { type: String, required: true, index: true },
	ipfsCid: { type: String, required: true },
	registrarWallet: { type: String, required: true },
	timestamp: { type: Date, default: Date.now },
	status: { type: String, enum: ['verified', 'pending', 'rejected'], default: 'pending' }
}, { timestamps: true });

export const Certificate = mongoose.model('Certificate', certificateSchema);
