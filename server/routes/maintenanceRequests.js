import express from 'express';
import * as maintenanceRequestController from '../controllers/maintenanceRequestController.js';

const router = express.Router();

router.get('/', maintenanceRequestController.listMaintenanceRequests);
router.get('/:id', maintenanceRequestController.getMaintenanceRequest);
router.post('/', maintenanceRequestController.createMaintenanceRequest);
router.put('/:id', maintenanceRequestController.updateMaintenanceRequest);
router.patch('/:id/status', maintenanceRequestController.changeMaintenanceStatus);
router.delete('/:id', maintenanceRequestController.deleteMaintenanceRequest);

export default router;
