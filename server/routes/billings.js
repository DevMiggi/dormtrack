import express from 'express';
import * as billingController from '../controllers/billingController.js';

const router = express.Router();

// Fixed paths (/overdue) must come before /:id, or Express would read "overdue" as an id.
router.get('/', billingController.listBillings);
router.get('/overdue', billingController.getOverdueBillings);
router.get('/:id', billingController.getBilling);
router.post('/', billingController.createBilling);
router.put('/:id', billingController.updateBilling);
router.delete('/:id', billingController.deleteBilling);

export default router;
