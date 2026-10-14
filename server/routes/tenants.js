import express from 'express';
import * as tenantController from '../controllers/tenantController.js';

const router = express.Router();

router.get('/', tenantController.listTenants);
router.get('/:id', tenantController.getTenant);
router.post('/', tenantController.createTenant);
router.put('/:id', tenantController.updateTenant);
router.delete('/:id', tenantController.deleteTenant);

export default router;
