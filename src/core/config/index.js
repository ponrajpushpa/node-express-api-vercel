import dotenv from "dotenv";
dotenv.config();

export const { 
    PORT, 
    MONGO_URI, 
    JWT_ACCESS_SECRET, 
    JWT_ACCESS_EXPIRES_IN, 
    JWT_REFRESH_SECRET, 
    JWT_REFRESH_EXPIRES_IN, 
    NODE_ENV,
    GENERATE_LINK_KEY,
    SANDBOX_CLIENT_ID 
} = process.env;