import mongoose from 'mongoose';

const claimantDataSchema = new mongoose.Schema({
  claimantName: { type: String, required: true },
  deceasedName: { type: String, required: true },
  verificationStatus: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  certificateHash: { type: String, required: true },
  ipfsCid: { type: String },
  verifiedAt: { type: Date },
  verifiedBy: { type: String }, // Insurance company wallet address
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const ClaimantData = mongoose.model('ClaimantData', claimantDataSchema);