import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
	claimantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	certificateHash: { type: String, required: true },
	policyId: { type: String, required: true },
	status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
	notes: { type: String }
}, { timestamps: true });

export const Claim = mongoose.model('Claim', claimSchema);
