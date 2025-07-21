const express = require("express");
const router = express.Router();
const authMiddleware = require('../../../middlewares/auth');
const { getAllUsers, login, register } = require("./authController");


// Routes
router.get("/", authMiddleware ,  getAllUsers);
router.post("/register", register);
router.post("/login", login);

router.post("/verify", async (req, res) => {
  res.status(200).json({ status: "success", data: "Token is valid" });
});

module.exports = router;
