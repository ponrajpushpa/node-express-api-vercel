import User from "../models/User.js";

const getAllUsers = async (req, res) => {
    const users = await User.find({});
    return res.status(200).json({
        status: 'success',
        data: users,
        message: "All users fetched successfully."
    });
}

const me = async (req, res) => {
        const user = req.user; // Assuming the user is attached to the request object by authentication middleware  
        return res.status(200).json({
            status: 'success',
            data: user,
            message: `User details fetched successfully. My role is ${user.role}`
        });
}

export { getAllUsers, me };