import mongoose from "mongoose";


// Track connection state
let isConnected = false;

/**
 * Connect to MongoDB using environment variables
 * - Uses MONGODB_URI for connection string
 * - Uses MONGODB_DB_NAME for database name
 * - Supports both development and production environments
 */
export async function connectToDB() {
  // Return early if already connected
  if (isConnected) {
    console.log("✅ MongoDB already connected");
    return mongoose.connection;
  }

  // Check for required environment variables
  if (!process.env.MONGODB_URI) {
    throw new Error("❌ MONGODB_URI is not defined in environment variables");
  }

  if (!process.env.MONGODB_DB_NAME) {
    throw new Error("❌ MONGODB_DB_NAME is not defined in environment variables");
  }

  try {
    const environment = process.env.NODE_ENV || "development";
    const dbName = process.env.MONGODB_DB_NAME;

    console.log(`🔄 Connecting to MongoDB...`);
    console.log(`   Environment: ${environment}`);
    console.log(`   Database: ${dbName}`);

    // Connect with recommended options
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: dbName,
      maxPoolSize: 10, // Maximum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Timeout for socket inactivity
    });

    isConnected = true;
    console.log(`✅ MongoDB connected successfully to ${dbName}`);

    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB disconnected");
      isConnected = false;
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
      isConnected = false;
    });

    return mongoose.connection;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    isConnected = false;
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 * Useful for cleanup in serverless environments
 */
export async function disconnectFromDB() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("✅ MongoDB disconnected successfully");
  } catch (error) {
    console.error("❌ MongoDB disconnect failed:", error.message);
    throw error;
  }
}

/**
 * Get the current connection status
 */
export function getConnectionStatus() {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  };
}
