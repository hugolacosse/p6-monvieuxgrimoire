const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

exports.signup = (req, res, next) => {
  let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!req?.body?.email || !req?.body?.password) {
    return res.status(400).json({ message: "INVALID FORM." });
  }
  if (!req.body.email.match(regex)) {
    return res.status(400).json({ message: "INVALID EMAIL ADDRESS." });
  }

  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      const user = new User({ email: req.body.email, password: hash });
      user
        .save()
        .then(() => {
          res.status(201).json({ message: "SIGNUP SUCCESS." });
        })
        .catch((error) => {
          if (error?.name && error.name === "ValidationError") {
            return res.status(400).json({ message: "INVALID FORM." });
          }
          // console.log("ERROR /api/auth/signup");
          res.status(500).json({ message: "INTERNAL SERVER ERROR." });
        });
    })
    .catch((error) => {
      // console.log("ERROR /api/auth/signup");
      res.status(500).json({ message: "INTERNAL SERVER ERROR." });
    });
};

exports.login = (req, res, next) => {
  if (!req?.body?.email || !req?.body?.password) {
    return res.status(400).json({ message: "INVALID FORM." });
  }

  User.findOne({ email: req.body.email })
    .then((user) => {
      if (user === null) {
        return res.status(400).json({ message: "INVALID EMAIL OR PASSWORD." });
      } else {
        bcrypt
          .compare(req.body.password, user.password)
          .then((valid) => {
            if (!valid) {
              return res
                .status(400)
                .json({ message: "INVALID EMAIL OR PASSWORD." });
            }
            res.status(200).json({
              userId: user._id,
              token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
                expiresIn: "24h",
              }),
            });
          })
          .catch((error) => {
            // console.log("ERROR /api/auth/login");
            res.status(500).json({ message: "INTERNAL SERVER ERROR." });
          });
      }
    })
    .catch((error) => {
      // console.log("ERROR /api/auth/login");
      res.status(500).json({ message: "INTERNAL SERVER ERROR." });
    });
};
