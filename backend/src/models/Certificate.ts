import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
	certificateId: { type: String, index: true },
	fullName: { type: String, required: true },
	hash: { type: String, required: true, index: true },
	ipfsCid: { type: String, required: true },
	registrarWallet: { type: String, required: true },
	timestamp: { type: Date, default: Date.now },
	status: { 
		type: String, 
		enum: ['uploaded_to_ipfs', 'ready_for_blockchain', 'registered_on_chain', 'rejected'], 
		default: 'uploaded_to_ipfs' 
	}
}, { timestamps: true });

export const Certificate = mongoose.model('Certificate', certificateSchema);