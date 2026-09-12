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

// Normalize an origin string by trimming whitespace and removing any trailing
// slash, so "https://example.com/" and "https://example.com" are treated the
// same and small config mistakes don't silently break CORS.
const normalizeOrigin = (value) => (value || "").trim().replace(/\/+$/, "");

// FRONTEND_URL may contain a single origin or a comma-separated list.
const productionOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

const devOrigins = ['http://192.168.1.10:5173', 'http://localhost:5173'];

// Define allowed origins based on environment
const allowedOrigins = NODE_ENV === 'production' ? productionOrigins : devOrigins;

const corsOptions = {
    // 1. Reflect the request origin only when it is on the allow-list. Using a
    //    function (instead of a static array) lets us normalize trailing
    //    slashes and allow same-origin / server-to-server requests that send
    //    no Origin header (e.g. curl, health checks).
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const requestOrigin = normalizeOrigin(origin);
        if (allowedOrigins.includes(requestOrigin)) {
            return callback(null, true);
        }

        console.log('[v0] CORS blocked origin:', origin, 'allowed:', allowedOrigins);
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },

    // 2. HTTP methods your frontend can use (OPTIONS is required for preflight)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

    // 3. Allowed headers
    allowedHeaders: ['Content-Type', 'Authorization'],

    // 4. Allow credentials (cookies) to be sent with cross-origin requests
    credentials: true,

    // 5. Cache preflight response for 24h to cut down on OPTIONS round-trips
    maxAge: 86400,
};

// Apply CORS configuration (also handles OPTIONS preflight requests)
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
