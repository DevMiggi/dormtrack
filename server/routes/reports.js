import express from 'express';
import * as reportController from '../controllers/reportController.js';

const router = express.Router();

router.get('/revenue', reportController.getRevenueReport);
router.get('/outstanding', reportController.getOutstandingReport);
router.get('/occupancy', reportController.getOccupancyReport);
router.get('/maintenance', reportController.getMaintenanceReport);

export default router;
