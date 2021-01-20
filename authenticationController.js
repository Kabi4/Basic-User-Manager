const User = require("./UserModel");
const jwt = require("jsonwebtoken");
const catchAsync = require("./catchAsync");
const AppError = require("./appError");
exports.verifyToken = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.replace("Bearer ", "");
  }

  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError("You are not logged in please login or Expired token!", 401)
    );
  }
  const decodeData = jwt.verify(token, process.env.JWT_SECRET);
  const ConsumerUser = await User.findById(decodeData._id);

  if (
    !ConsumerUser ||
    ConsumerUser.tokens.findIndex((ele) => ele === token) === -1 ||
    (decodeData.exp - decodeData.iat) / 1000 > 7 * 60 * 60 * 24
  ) {
    return next(
      new AppError("You are not logged in please login or Expired token!", 401)
    );
  }
  req.user = ConsumerUser;
  next();
});
