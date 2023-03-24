import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "sixPackProgrammerTut",
  })
  .then(() => {
    console.log("database is connected!!");
  })
  .catch((e) => {
    console.log(e);
  });
const app = express();

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  password: { type: String },
});

const momom = mongoose.model("Users", userSchema);

// const users = [];

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", async (req, res) => {
  // res.render("index.ejs", { name: "Umar Khan" });
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "secretKey");
    req.user = await momom.findById(decoded.id);
    res.render("index.ejs", { name: req.user.name });
    res.status(200);
  } else {
    res.render("login.ejs");
    res.status(200);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await momom.findOne({ email });

  const isMatch = bcrypt.compare(password, user.password);

  if (!user) {
    return res.redirect("/register");
  } else if (!isMatch) {
    return res.render("login.ejs", { email, message: "incorrect password" });
  } else {
    const token = jwt.sign({ id: user._id }, "secretKey");
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/");
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", async (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  let user = await momom.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  user = await momom.create({ name, email, password: hashedPassword });
  const token = jwt.sign({ id: user._id }, "secretKey");
  res.cookie("token", token, { httpOnly: true });
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  // res.cookie("name", null, { expires: new Date(Date.now()) });
  res.clearCookie("token");
  res.redirect("/");
});

app.listen(8000, () => {
  console.log("Server is running on http://localhost:8000");
});
