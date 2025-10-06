import { Router } from 'express';
import auth from './auth.js';
import registrar from './registrar.js';
import insurer from './insurer.js';
import claimant from './claimant.js';
import admin from './admin.js';

const router = Router();

router.use('/auth', auth);
router.use('/registrar', registrar);
router.use('/insurer', insurer);
router.use('/claimant', claimant);
router.use('/admin', admin);

export default router;
