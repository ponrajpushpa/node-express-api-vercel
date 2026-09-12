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

// Define allowed origins based on environment
const allowedOrigins = NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL ] // Update with your production frontend URL
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

// Ensure the database is connected before handling any request. On Vercel the
// module can start before MongoDB is reachable, so we connect lazily per
// request (using the cached connection) instead of at module load time.
app.use(async (req, res, next) => {
  try {
    await dbConnect();
    next();
  } catch (error) {
    next(error);
  }
});
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

// On Vercel the app runs as a serverless function, so we must NOT call
// app.listen() — Vercel invokes the exported handler directly. Only start a
// long-running server when running locally (e.g. `npm run dev`/`npm start`).
if (!process.env.VERCEL) {
  app.listen(PORT || 3000, () => {
    console.log(`Server is running on port ${PORT || 3000}`);
  });
}

export default app;
