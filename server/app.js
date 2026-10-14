import express from 'express';
import cors from 'cors';
import logger from './middleware/logger.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import roomRoutes from './routes/rooms.js';
import tenantRoutes from './routes/tenants.js';
import occupancyRoutes from './routes/occupancies.js';
import billingRoutes from './routes/billings.js';
import paymentRoutes from './routes/payments.js';
import maintenanceRequestRoutes from './routes/maintenanceRequests.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';

const app = express();

// 1. Only the React client may call this API from a browser.
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));

// 2. Read JSON request bodies into req.body.
app.use(express.json());

// 3. Log method, path, status and time for every request.
app.use(logger);

// 4. Routes, one router per resource.
app.use('/api/rooms', roomRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/occupancies', occupancyRoutes);
app.use('/api/billings', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/maintenance-requests', maintenanceRequestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// 5. Any request that did not match a route gets a JSON 404.
app.use(notFound);

// 6. Error handler must be last.
app.use(errorHandler);

export default app;
