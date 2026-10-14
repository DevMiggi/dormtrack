import mongoose from 'mongoose';

async function connectDB() {
  const connection = await mongoose.connect(process.env.MONGO_URI);
  // Log only the database name, never the connection string (it contains the password).
  console.log(`MongoDB connected (database: ${connection.connection.name})`);
}

export default connectDB;
