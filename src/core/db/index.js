import mongoose from "mongoose";
import { MONGO_URI } from "../config/index.js";

// On Vercel, serverless functions are invoked repeatedly and may reuse the
// same execution context. Cache the connection promise across invocations so
// we don't open a new MongoDB connection on every request (which exhausts the
// connection pool) and don't reconnect while one is already in flight.
let cached = globalThis._mongoose;
if (!cached) {
    cached = globalThis._mongoose = { conn: null, promise: null };
}

const dbConnect = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!MONGO_URI) {
        throw new Error("MONGO_URI environment variable is not set");
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(MONGO_URI, { bufferCommands: false })
            .then((mongooseInstance) => {
                console.log("MongoDB connected successfully");
                return mongooseInstance;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        // Reset the promise so the next request can retry instead of failing
        // forever, and surface the error instead of killing the process.
        cached.promise = null;
        console.error("MongoDB connection error:", error);
        throw error;
    }

    return cached.conn;
};

export default dbConnect;
