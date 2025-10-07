import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
	deceasedName: { type: String, required: true },
	fileHash: { type: String, required: true },
	verified: { type: Boolean, default: false },
	verificationDate: { type: Date },
	onchainData: {
		exists: { type: Boolean },
		ipfsCid: { type: String },
		registrar: { type: String },
		timestamp: { type: Number }
	}
}, { timestamps: true });

export const Claim = mongoose.model('Claim', claimSchema);