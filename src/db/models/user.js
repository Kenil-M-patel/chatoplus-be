const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  user_name: String,
  email: { type: String, unique: true },
  password: String,
  image_url: String,
  is_online: { type: Boolean, default: false },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
