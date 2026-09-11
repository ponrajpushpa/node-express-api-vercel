import crypto from 'crypto';
import jwt from "jsonwebtoken";
import { MailtrapClient } from "mailtrap";
import { JWT_ACCESS_EXPIRES_IN, 
    JWT_ACCESS_SECRET, 
    JWT_REFRESH_EXPIRES_IN, 
    JWT_REFRESH_SECRET,
    GENERATE_LINK_KEY,
    SANDBOX_CLIENT_ID
} from "../core/config/index.js";

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}


export const validateTimedToken = async(token) => {
  const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [userId, expiresAtStr, type, providedSignature] = decoded.split(':');
    const expiresAt = parseInt(expiresAtStr, 10);
    //  console.log('Decoded:', { userId, expiresAtStr, type, providedSignature, expiresAt });   
    // Recreate signature to verify authenticity
    const data = `${userId}:${expiresAt}:${type}`;
    // console.log('Data for signature verification:', userId);
    const expectedSignature = crypto
      .createHmac('sha256', GENERATE_LINK_KEY)
      .update(data)
      .digest('hex');


    if (providedSignature !== expectedSignature) {

      throw new AppError('Invalid or tampered link.', 400);
    }
    // console.log('Date.now():', Date.now(), 'expiresAt:', expiresAt, userId);
    // Check if the link has expired
    if (Date.now() > expiresAt) {
      throw new AppError('This link has expired.', 400);
      // throw new Error('This link has expired.');
    }
    return {userId, type};
}

// Step 1: Generate the link
export const generateTimedToken = (type,userId, expiresInMinutes) => {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  const data = `${userId}:${expiresAt}:${type}`;
  // console.log('Data expiresInMinutes:', data, expiresInMinutes, expiresAt);
  // Create an HMAC signature

  const signature = crypto
    .createHmac('sha256', GENERATE_LINK_KEY)
    .update(data)
    .digest('hex');
    
  // Combine data and signature into a token
  const token = Buffer.from(`${data}:${signature}`).toString('base64url');
  return token;
}

export const generateToken = (type = 'accessToken', user) => {

    if(type === 'accessToken') {
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role
        };
        return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
    }

    const payload = {
        id: user._id,
        email: user.email,
        role: user.role
    };
    return jwt.sign(
        payload,
        JWT_REFRESH_SECRET,
        { 
            expiresIn: JWT_REFRESH_EXPIRES_IN 
        }
    );
}

export const parseExpiryToMs = (exp) => {
        if (!exp || typeof exp !== 'string') return undefined;
        const num = parseInt(exp.slice(0, -1), 10);
        const unit = exp.slice(-1);
        if (Number.isNaN(num)) return undefined;
        switch (unit) {
            case 's': return num * 1000;
            case 'm': return num * 60 * 1000;
            case 'h': return num * 60 * 60 * 1000;
            case 'd': return num * 24 * 60 * 60 * 1000;
            default: return undefined;
        }
    };

export const sendEmail = async (to, subject, text) => {

  const client = new MailtrapClient({
  token: SANDBOX_CLIENT_ID,
  sandbox: true,
  testInboxId: 1366701,
});

  const sender = {
  email: "c.ponraaj@gmail.com",
  name: "Mailtrap Test",
};
const recipients = [
  {
    email: "c.ponraaj@gmail.com",
  }
];

const result = client
  .send({
    from: sender,
    to: recipients,
    subject: "You are awesome!",
    text: "Congrats for sending test email with Mailtrap!",
    category: "Integration Test",
  })
  
return result;

  
}