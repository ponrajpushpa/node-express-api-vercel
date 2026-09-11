import express from "express";
import { 
    login, 
    register, 
    checkEmailAvailability, 
    refreshToken, 
    activateAccount,
    logout,
    forgotPassword,
    checkToken,
    resetPassword
} from "../controllers/Auth.js";
const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/refresh-token", refreshToken);
router.get("/check-email", checkEmailAvailability);
router.get('/check-token', checkToken);
router.get('/activate-account', activateAccount);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
export default router;

