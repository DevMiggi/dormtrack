import express from 'express';
import * as roomController from '../controllers/roomController.js';

const router = express.Router();

// Fixed paths (/availability) must come before /:id, or Express would read "availability" as an id.
router.get('/', roomController.listRooms);
router.get('/availability', roomController.getAvailability);
router.get('/:id/availability', roomController.getRoomAvailability);
router.get('/:id', roomController.getRoom);
router.post('/', roomController.createRoom);
router.put('/:id', roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);

export default router;
