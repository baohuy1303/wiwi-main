const express = require("express");
const router = express.Router();
const {
    createUser,
    getUser,
    getAllUsers,
    loginUser,
} = require('../controllers/Users');

router.post('/user/post', createUser);
router.post('/user/login', loginUser);
router.get("/user/get/:id", getUser);
router.get("/user/get-all", getAllUsers);

module.exports = router;