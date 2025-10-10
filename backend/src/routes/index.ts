import { Router } from 'express';
import auth from './auth.js';
import registrar from './registrar.js';
import insurer from './insurer.js';

const router = Router();

console.log('=== ROUTES INDEX LOADED ==='); // Debug log
console.log('Registering auth routes'); // Debug log
router.use('/auth', auth);
console.log('Registering registrar routes'); // Debug log
router.use('/registrar', registrar);
console.log('Registering insurer routes'); // Debug log
router.use('/insurer', insurer);
// Claimant and admin routes are registered in server.ts with authentication middleware

export default router;