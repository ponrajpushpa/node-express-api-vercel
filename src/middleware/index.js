import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET } from "../core/config/index.js";

export const validateToken = (req, res, next) => {
    console.log("Validating token for request; cookies:", req.cookies, "authorization:", req.headers.authorization);

    // Try Authorization header first
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // Fallback to `accessToken` cookie (useful when tokens are stored in cookies)
    if (!token && req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({
            status: "fail",
            message: "Not authorized to access this route - token missing"
        });
    }

    if (!JWT_ACCESS_SECRET) {
        return res.status(500).json({
            status: "error",
            message: "JWT secret is not configured"
        });
    }

    jwt.verify(token, JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                status: "fail",
                message: "Invalid or expired token"
            });
        }

        req.user = decoded;
        next();
    });
};

export const validateRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {   
            return res.status(403).json({
                status: 'fail',
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    }
}

export const errorHandler = (err, req, res, next) => {

    // console.log("Error Name:", err, err.name); // Log the error name
    
    if (err.name === 'MongoServerError' && err.code === 11000) {

        const field = Object.keys(err.keyValue)[0];
  
        // Create your custom message
        const message = `The ${field} you entered is already exist.`;

        return res.status(400).json({
            status: 'fail', 
            message: message,
            error: err.keyValue // Include the duplicate field value in the response
        });
    }

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(el => el.message);
        return res.status(400).json({
            status: 'fail',
            message: 'Validation failed',
            errors: errors
        });
    }

    if(err instanceof SyntaxError && err.status === 400 && 'body' in err){
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid payload provided',
        });
    } 

    if (err.name === 'AppError') {
        console.error("AppError:", err.message, "Status Code:", err.statusCode);    
        // const errors = Object.values(err.errors).map(el => el.message);
        return res.status(400).json({
            status: 'fail',
            message: err.message,
            statusCode: err.statusCode
        });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
}

