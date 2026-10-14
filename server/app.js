import express from 'express';
import cors from 'cors';
import logger from './middleware/logger.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// 1. Only the React client may call this API from a browser.
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));

// 2. Read JSON request bodies into req.body.
app.use(express.json());

// 3. Log method, path, status and time for every request.
app.use(logger);

// 4. Routes (mounted in CP1.2).

// 5. Any request that did not match a route gets a JSON 404.
app.use(notFound);

// 6. Error handler must be last.
app.use(errorHandler);

export default app;
