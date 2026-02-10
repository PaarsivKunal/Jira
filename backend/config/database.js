import mongoose from 'mongoose';

const connectDB = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      if (process.env.NODE_ENV !== 'production') {
        console.log(`MongoDB Connected: ${conn.connection.host}`);
      }
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('MongoDB connection error:', err);
        }
      });

      mongoose.connection.on('disconnected', () => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('MongoDB disconnected');
        }
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        if (process.env.NODE_ENV !== 'production') {
          console.log('MongoDB connection closed through app termination');
        }
        process.exit(0);
      });

      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${i + 1}/${retries} failed:`, error.message);
      
      if (i === retries - 1) {
        console.error('Failed to connect to MongoDB after all retries');
        process.exit(1);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export default connectDB;

