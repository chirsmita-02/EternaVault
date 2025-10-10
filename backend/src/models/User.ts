import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true }, // Changed from passwordHash to password
	role: { type: String, enum: ['admin', 'insurer', 'claimant', 'registrar'], required: true },
	walletAddress: { type: String },
	approved: { type: Boolean, default: false },
	// Add status field
	status: { type: String, enum: ['active', 'removed'], default: 'active' },
	// Role-specific fields
	registrarInfo: {
		departmentName: { type: String },
		employeeId: { type: String },
		phoneNumber: { type: String }
	},
	insurerInfo: {
		companyName: { type: String },
		licenseNumber: { type: String },
		contactPerson: { type: String },
		companyAddress: { type: String }
	},
	claimantInfo: {
		relationshipToDeceased: { type: String },
		phoneNumber: { type: String },
		address: { type: String }
	},
	adminInfo: {
		department: { type: String },
		employeeId: { type: String },
		permissions: [{ type: String }]
	}
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);