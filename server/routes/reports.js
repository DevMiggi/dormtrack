import express from 'express';
import * as reportController from '../controllers/reportController.js';

const router = express.Router();

router.get('/occupancy', reportController.getOccupancyReport);
router.get('/maintenance', reportController.getMaintenanceReport);
// Revenue and outstanding reports are added in CP4.8.

export default router;
