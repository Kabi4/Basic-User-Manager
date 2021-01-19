const catchAsync = require("./catchAsync");
const AppError = require("./appError");
const User = require("./UserModel");
const Emails = require("./sendMail");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const sharp = require("sharp");
const slugify = require("slugify");
const fs = require("fs");
const util = require("util");

const unlink = util.promisify(fs.unlink);

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Please Choose a image to upload!", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.processProfilePhoto = upload.single("profilePhoto");

exports.resizeAndSaveProfilePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No Photo to upload!", 400));
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError("No user found to update id!", 404));
  }
  const ext = req.file.mimetype.split("/")[1];
  req.file.filename = `${slugify(user.name, { lower: true })}-${
    user.id
  }-${Date.now()}.${ext}`;
  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`${__dirname}/Assets/UserProfile/${req.file.filename}`);
  user.profilePhoto = req.file.filename;
  await user.save();
  res.json({
    status: "success",
    message: "Your Profile photo has been updated!",
    data: {
      user,
    },
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  const validParams = ["password", "confirmPassword", "email", "name"];
  const user = {};
  let error = false;
  validParams.forEach((ele) => {
    if (!req.body[ele]) {
      error = true;
      return next(new AppError(`The ${ele} property is missing!`, 400));
    }
    if (ele === "confirmPassword") {
      if (req.body["confirmPassword"] !== req.body["password"]) {
        error = true;
        return next(new AppError("Password do not match"), 401);
      }
    } else {
      user[ele] = req.body[ele];
    }
  });
  if (!error) {
    const newUser = await new User({
      ...user,
    }).save();

    res.status(201).json({
      status: "success",
      data: {
        newUser: newUser,
      },
    });
  }
});

exports.signinUser = catchAsync(async (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return next(new AppError("Invalid Credentials provided!", 400));
  }
  const user = await User.findAndAuthenticate(
    req.body.email,
    req.body.password
  );
  res.json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword) {
    return next(new AppError("Credentials Not sent by user!", 400));
  }
  const id = req.params.id;
  if (password !== confirmPassword) {
    return next(new AppError("Password do not match", 400));
  }
  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("No user found!", 400));
  }
  user.password = password;
  await user.save();
  res.status(203).json({ status: "success", data: { user } });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const validUpdates = ["name"];
  const updates = {};
  validUpdates.forEach((ele) => {
    updates[ele] = req.body[ele];
  });
  const user = await User.findByIdAndUpdate(req.params.id, updates);
  if (!user) {
    return next(new AppError("No user found!", 400));
  }
  res.json({ status: "success", data: { user } });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    next(new AppError(`No User find for id ${req.params.id}`, 404));
  }
  await unlink(`${__dirname}/Assets/UserProfile/${user.profilePhoto}`);
  res.status(204).json({
    status: "Success",
    message: "Deletion Successful",
  });
});

exports.sendVerificationEmail = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("No User Found!", 404));
  }
  const verifiationToken = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );
  user.verifyToken = verifiationToken;
  await user.save();
  await Emails.verificationEmail(
    user.email,
    user.name,
    `/api/v1/users/verifyemail/${user.id}?token=${verifiationToken}`
  );
  res.json({
    status: "success",
    message: "Token Mailed Please verify!",
  });
});

exports.verifyAccount = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const user = await User.findById(id);
  if (user.verified) {
    res.json({
      status: "success",
      message: "Account is already verified!",
      data: {
        user,
      },
    });
  }
  const validToken = jwt.verify(req.query.token, process.env.JWT_SECRET);

  if (validToken.exp - validToken.iat > 24 * 60 * 60 * 1000) {
    return next(new AppError("Verification Token expired!", 404));
  }

  if (!user) {
    return next(new AppError("No User Found!", 404));
  }
  if (
    user.verifyToken !== req.query.token ||
    user._id.toString() !== validToken._id
  ) {
    return next(
      new AppError("We warning you no invalid token for verification!", 400)
    );
  }
  user.verified = true;
  await user.save();
  res.json({
    status: "success",
    message: "Account has been verified!",
    data: {
      user,
    },
  });
});

exports.updateEmail = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  user.email = req.body.email;
  user.verified = false;
  user.verifyToken = "";
  await user.save();
  res.json({
    status: "success",
    message: "Email Updated please verify!",
    data: { user },
  });
});
