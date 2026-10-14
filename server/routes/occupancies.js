import express from 'express';
import * as occupancyController from '../controllers/occupancyController.js';

const router = express.Router();

router.get('/', occupancyController.listOccupancies);
router.get('/:id', occupancyController.getOccupancy);
router.post('/', occupancyController.createOccupancy);
router.put('/:id', occupancyController.updateOccupancy);
router.patch('/:id/complete', occupancyController.completeOccupancy);
router.patch('/:id/cancel', occupancyController.cancelOccupancy);
router.delete('/:id', occupancyController.deleteOccupancy);

export default router;
