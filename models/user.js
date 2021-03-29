const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({  
  email: String,
  password:String,
  username: String,
  birthday: Date,
  gender: String,
  locale: String,
  isActive: Boolean,
  isVerified: Boolean,  
  roles: [],  
});
const User = mongoose.model("User", UserSchema);

module.exports = User;
