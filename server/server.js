// Must be the first import: it loads .env before app.js reads process.env.CLIENT_ORIGIN.
import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`DormTrack API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Could not connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

startServer();
