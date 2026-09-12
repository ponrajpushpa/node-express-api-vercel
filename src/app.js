import  express  from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dbConnect from "./core/db/index.js";
import { PORT, NODE_ENV } from "./core/config/index.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import { errorHandler } from "./middleware/index.js";
import { generateTimedToken, sendEmail } from "./util/index.js";
const app = express();

await dbConnect();

// Define allowed origins based on environment
const allowedOrigins = NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://yourdomain.com'] // Update with your production frontend URL
    : ['http://192.168.1.10:5173', 'http://localhost:5173'];

const corsOptions = {
    // 1. Specify exact domains allowed (NO trailing slashes)
    origin: allowedOrigins,
    
    // 2. HTTP methods your frontend can use
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    
    // 3. Allowed headers
    allowedHeaders: ['Content-Type', 'Authorization'],
    
    // 4. Allow credentials (cookies) to be sent with cross-origin requests
    credentials: true 
};

// Apply CORS configuration
app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
// Temporary request logger to help debug cookies/headers
app.use((req, res, next) => {
  console.log('Incoming request', req.method, req.path, 'cookies:', req.cookies, 'authorization:', req.headers.authorization);
  next();
});
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);

app.use(errorHandler);

// const check = await sendEmail();
// console.log("Email send result:", check);

// const testActiveLink = generateTimedToken('activateAccount', '6a92e7cc5843e2b540094bd4', 60);
// console.log("Test Activation Link:", testActiveLink);

// const startServer = async () => {
//   await 

app.get('/',(req, res)=>{
  res.json({data: "Hello world"});
})
// }
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  }); 

export default app;
// startServer();
