const router = require("express").Router();

const userController = require("./userController");
const authenticate = require("./authenticationController");

router.route("/signup").post(userController.createUser);

router.route("/login").get(userController.signinUser);

router.use(authenticate.verifyToken);

router.route("/updatePassword/:id").patch(userController.updatePassword);

router.route("/updateUser/:id").patch(userController.updateUser);

router.route("/updateEmail/:id").patch(userController.updateEmail);

router.route("/deleteUser/:id").delete(userController.deleteUser);

router
  .route("/verifyemail/:id")
  .post(userController.sendVerificationEmail)
  .patch(userController.verifyAccount);

router
  .route("/updateProfilePhoto/:id")
  .patch(
    userController.processProfilePhoto,
    userController.resizeAndSaveProfilePhoto
  );

module.exports = router;
