const { model, Schema } = require("mongoose");

const userSchema = new Schema({
  username: String,
  password: String,
  email: String,
  createdAt: String,
  strikes: Number,
});

module.exports = model("User", userSchema);
