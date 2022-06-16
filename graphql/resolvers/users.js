const User = require("../../models/User");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../../config");

const { UserInputError } = require("apollo-server");
const {
  validateRegisterInput,
  validateLoginInput,
} = require("../../util/validators");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user?.id,
      email: user?.email,
      username: user?.username,
    },
    SECRET_KEY,
    {
      expiresIn: "1h",
    }
  );
};

module.exports = {
  Mutation: {
    async login(_, { username, password }) {
      // Validate User Data

      const { valid, errors } = validateLoginInput(username, password);

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      // Make sure user does exist

      const user = await User.findOne({ username });

      if (!user) {
        errors.general = "User not Found";
        throw new UserInputError("User not Found", {
          errors,
        });
      }

      if (user?.strikes >= 3) {
        errors.general = "You are banned for inappropriate behavior";
        throw new UserInputError("You are banned for inappropriate ", {
          errors,
        });
      }

      // Compare passwords

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        errors.general = "Wrong Credentials";
        throw new UserInputError("Wrong Credentials", {
          errors,
        });
      }

      // Create auth tokens

      const token = generateToken(user);

      return {
        ...user._doc,
        id: user.id,
        token,
      };
    },

    async register(
      _,
      { registerInput: { username, email, password, confirmPassword } }
    ) {
      // Validate User Data

      const { valid, errors } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword
      );

      if (!valid) {
        throw new UserInputError("Errors!", {
          errors,
        });
      }

      // Make sure user doesnot exist

      const user = await User.findOne({ username, email });
      if (user) {
        throw new UserInputError("Username Taken!", {
          errors: {
            username: "This username is taken",
          },
        });
      }
      // hash pass and create an auth token

      password = await bcrypt.hash(password.toString(), 12);

      const newUser = new User({
        email,
        username,
        password,
        strikes: 0,
        createdAt: new Date().toISOString(),
      });

      const res = await newUser.save();

      const token = generateToken(res);

      return {
        ...res._doc,
        id: res.id,
        token,
      };
    },
  },
};
