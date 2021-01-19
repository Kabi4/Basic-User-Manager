const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: 4,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw Error("Invalid Email provided");
        }
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      validate(value) {
        if (
          value.includes("password") ||
          value.includes("Password") ||
          value.includes("PASSWORD")
        ) {
          throw Error("Such a pathetic password try something else!");
        }
      },
    },
    lastPassupdate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifyToken: String,
    profilePhoto: {
      type: String,
      default: "default.png",
    },
    tokens: {
      type: [
        {
          token: {
            type: String,
          },
        },
      ],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  user = this;
  if (user.isNew || user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
    user.lastPassupdate = Date.now();
  }
  next();
});

userSchema.statics.findAndAuthenticate = async (email, password) => {
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new Error("Invalid credentials Provided!");
  }
  const auth = await bcrypt.compare(password, user.password);

  if (!auth) {
    throw new Error("Invalid credentials Provided!");
  }
  return user;
};

const User = mongoose.model("users", userSchema);

module.exports = User;
