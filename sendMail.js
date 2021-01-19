const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
exports.verificationEmail = async (email, name, URL) => {
  const msg = {
    to: email, // Change to your recipient
    from: "hykukku@gmail.com", // Change to your verified sender
    subject: "Verification To User App",
    text: `Welcome to the family! ${name}.Post a patch request to this url ${URL} to verify.`,
    html: `<strong>Welcome to the family! ${name}.Post a patch request to this url ${URL} to verify.</strong>`,
  };
  await sgMail.send(msg);
};
