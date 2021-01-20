require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const mongoose = require("mongoose");
const userRouter = require("./userRouter");
const cookieParser = require("cookie-parser");

const CONNECTION_URL = process.env.DB_URL.replace(
  "<username>",
  process.env.DB_USERNAME
).replace("<password>", process.env.DB_PASSWORD);

mongoose.connect(
  CONNECTION_URL,
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  },
  (error, client) => {
    if (error) {
      console.log(error);
      return console.log("Database Connection Failed");
    }
    console.log("Database Conection Successful!");
  }
);

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/users", userRouter);

module.exports = app;
