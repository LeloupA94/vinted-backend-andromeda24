const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    //console.log("on est dedans !");
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = req.headers.authorization.replace("Bearer ", "");
    const user = await User.findOne({ token: token }).select("account");

    if (user === null) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user; //permet de savoir qui fait la requette
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
