import express from 'express';
import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

// No PUT on purpose (§5): a wrong payment is deleted and recorded again.
router.get('/', paymentController.listPayments);
router.get('/:id', paymentController.getPayment);
router.post('/', paymentController.createPayment);
router.delete('/:id', paymentController.deletePayment);

export default router;
