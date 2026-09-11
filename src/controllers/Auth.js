import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import { 
    NODE_ENV, 
    JWT_REFRESH_SECRET, 
    JWT_ACCESS_EXPIRES_IN, 
    JWT_REFRESH_EXPIRES_IN,
    GENERATE_LINK_KEY
} from "../core/config/index.js";
import { 
    generateToken, 
    parseExpiryToMs, 
    generateTimedToken,
    validateTimedToken
} from "../util/index.js";

const register = async (req, res) => {
    
    const { name, email, password, role } = req.body;

    const user = new User({ name, email, password, role });
    const savedUser = await user.save();
    delete savedUser.password; // Remove password from the response

    const activateLink = generateTimedToken('activateAccount', user._id, 60);

    res.status(201).json({ 
        status: 'success',
        data: savedUser,
        activateLink,
        message: "User registered successfully." });
    // Implementation for user registration
};

const checkEmailAvailability = async (req, res) => {
    const { email } = req.query;
    const user = await User.findOne({ email });

    if (user) {
        return res.status(409).json({
            status: 'fail',
            message: 'Email is already in use.'
        });
    }

    res.status(200).json({
        status: 'success',
        message: 'Email is available.'
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    console.log("User found for login:", user);
    if(!user || user === null) {
        return res.status(401).json({
            status: 'fail',
            message: 'Invalid email or password'
        });
    }
    
    user = await User.findOne({ email }).select('+password'); // Explicitly select the password field   

    if(!user.isActive) {
        return res.status(401).json({
            status: 'fail',
            message: 'Account is not activated. Please check your email for the activation link.'
        });
    }
    
    console.log("User found for login:", user);

    const isMatch = await user.comparePassword(password);
    console.log("User isMatch:", isMatch);
    if(!isMatch) {
        return res.status(401).json({
            status: 'fail',
            message: 'Invalid email or password'
        });
    }

    const accessToken = generateToken('accessToken', user);
    const refreshToken = generateToken('refreshToken', user);

    // Helper to convert expiry strings like '1h', '15m', '7d' to milliseconds
    

    const accessMaxAge = parseExpiryToMs(JWT_ACCESS_EXPIRES_IN) || (15 * 60 * 1000);
    const refreshMaxAge = parseExpiryToMs(JWT_REFRESH_EXPIRES_IN) || (7 * 24 * 60 * 60 * 1000);

    
    // Set cookie options depending on environment to allow cross-site cookies in production
    const isProd = process.env.NODE_ENV === 'production';
    const cookieSameSite = isProd ? 'none' : 'lax';
    const cookieSecure = isProd; // only Secure in production (HTTPS required)

    // Set access and refresh tokens as HTTP-only cookies
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: accessMaxAge,
        path: '/' // send to all routes (adjust as needed)
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: refreshMaxAge,
        path: '/' // ensure cookie is sent to the refresh endpoint
    });

    // Log the Set-Cookie header(s) we just set for debugging
    console.log('Set-Cookie header:', res.getHeader('Set-Cookie'));


    res.status(200).json({ 
        status: 'success',
        message: "User logged in successfully." });
    // Implementation for user login
};


const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies || {};
        if (!refreshToken) {
            return res.status(401).json({
                status: 'fail',
                message: 'Refresh token missing'
            });
        }

        if (!JWT_REFRESH_SECRET) {
            return res.status(500).json({ status: 'error', message: 'JWT refresh secret not configured' });
        }

        jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ status: 'fail', message: 'Invalid or expired refresh token' });
            }

            // Issue a new access token
            const accessToken = generateToken('accessToken', decoded);
            const accessMaxAge = parseExpiryToMs(JWT_ACCESS_EXPIRES_IN) || (15 * 60 * 1000);

        // Set cookie options depending on environment to allow cross-site cookies in production
            const isProd = NODE_ENV === 'production';
            const cookieSameSite = isProd ? 'none' : 'lax';
            const cookieSecure = isProd; // only Secure in production (HTTPS required)

            // Set access and refresh tokens as HTTP-only cookies
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: cookieSecure,
                sameSite: cookieSameSite,
                maxAge: accessMaxAge,
                path: '/' // send to all routes (adjust as needed)
            });
            return res.status(200).json({ accessToken, status: 'success' });
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

const activateAccount = async (req, res) => {
    const { token } = req.query;
    console.log("TOKEN:", token);
    if (!token) {
        return res.status(400).send('Missing token.');
    }

    const { userId, type } = await validateTimedToken(token);
    
    if(!userId) {
        return res.status(400).send('Invalid or expired token.');
    }
    
    // Access granted
    res.json({
        status: 'success',
        message: 'Account activated successfully.',
        userId,
        type
    }); 
  
};

const logout = async (req, res) => {
    // Clear the access and refresh token cookies
    res.clearCookie('accessToken', {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Match setCookie configuration
  sameSite: 'lax' // or 'strict' / 'none' depending on your setup
});

res.clearCookie('refreshToken', {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
});
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
}

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log("Forgot password request for email:", email);
    if(!email) {
        return res.status(400).json({ status: 'fail', message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if(!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    const resetLink = generateTimedToken('resetPassword', user._id, 60); // 60 minutes expiry
    res
    .status(200)
    .json({ 
        status: 'success', 
        message: 'Password reset link generated', 
        resetLink 
    });
}

const checkToken = async (req, res) => {
    const { token } = req.query;
    // console.log("Check token request for token:", token);   
    if(!token) {
        return res.status(400).json({ status: 'fail', message: 'Token is required' });
    }

    const { userId, type } = await validateTimedToken(token);
    
    if(!userId) {
        return res.status(400).send('Invalid or expired token.');
    }   

    if(type == 'activateAccount') {

        const user = await User.findOne({ _id: userId });
        if(!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        if(user.isActive) {
            return res.status(400).json({ status: 'fail', message: 'Account is already activated' });
        }

        await User.findByIdAndUpdate(userId, { isActive: true });
    }

    res.status(200)
       .json({
            status: 'success',
            message: 'Token is valid',
            userId,
            type
        });

}

const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    console.log("Reset password request for token:", token);    

    if(!token || !password) {
        return res.status(400).json({ status: 'fail', message: 'Token and new password are required' });
    }

    const userId = await validateTimedToken(token);
    
    if(!userId) {
        return res.status(400).send('Invalid or expired token.');
    }   

    const user = await User.findById(userId);
    if(!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    user.password = password;
    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Password has been reset successfully'
    });
}


export { 
    activateAccount, 
    register, 
    login, 
    checkEmailAvailability, 
    refreshToken, 
    logout, 
    forgotPassword,
    checkToken,
    resetPassword
};
