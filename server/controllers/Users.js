const Users = require("../models/Users");
const mongoose = require("mongoose");

const createUser = async (req, res) => {
    try {
        const newUser = new Users(req.body);
        await newUser.save();
        return res.status(201).json(newUser);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getUser = async (req, res) => {
    try {
        const user = await Users.findById(new mongoose.Types.ObjectId(req.params.id));
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error finding user:', error);
        return res.status(500).json({
            message: error.message,
            error: error.name,
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await Users.find({});
        console.log('Total users in database:', users.length);
        res.status(200).json({
            count: users.length,
            users: users,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: 'Email and password are required' });
        }

        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Simple password comparison (in production, use bcrypt)
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Return user data (excluding password)
        const { password: _, ...userData } = user.toObject();
        res.status(200).json(userData);
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { createUser, getUser, getAllUsers, loginUser };