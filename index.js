const express = require("express")
const cors = require("cors")
const bcrypt = require("bcrypt")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const sessions = require("client-sessions")
const _ = require("lodash")

require("dotenv").config()

const app = express()

// ------ MIDDLEWARE ------
app.use(express.json())
app.use(cors({ origin: "*" }))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static("views")) // serve static files from the "views" directory
app.use(
  sessions({
    cookieName: "session",
    secret: process.env.SESSION_SECRET,
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    httpOnly: true, // don't let JS code access cookies
    // secure: true, // only set cookies over https
    ephemeral: true, // destroy cookies when the browser closes
  })
)

// set req.user if user is logged in
app.use((req, res, next) => {
  if (!req.session?.userId) {
    return next()
  }

  User.findById(req.session.userId)
    .then(user => {
      user.password = undefined
      req.user = user
      res.locals.user = user
    })
    .catch(err => console.log(err))
    .finally(() => next())
})

const requireLogin = (req, res, next) => {
  if (!req.user) return res.redirect("/login")
  next()
}

// ------ DATABASE CONNECTION ------
const connection_url = "mongodb://0.0.0.0:27017/playground"
mongoose
  .connect(connection_url)
  .then(() => console.log("🎉 Connected to MongoDB"))
  .catch(err => console.log(err))

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
})

const User = mongoose.model("stupid_user", userSchema)

// ------ GET ENDPOINTS ------

app.get("/", (req, res) => {
  res.sendFile(`${__dirname}/views/index.html`)
})

app.get("/login", (req, res) => {
  res.sendFile(`${__dirname}/views/login.html`)
})

app.get("/register", (req, res) => {
  res.sendFile(`${__dirname}/views/register.html`)
})

app.get("/dashboard", requireLogin, async (req, res) => {
  const user = await User.findById(req.session.userId)
  if (!user) return res.redirect("/login")

  res.sendFile(`${__dirname}/views/dashboard.html`)
})

// ------ POST ENDPOINTS ------

app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) return res.status(400).send("Invalid credentials")

  const isValidUser = await bcrypt.compare(req.body.password, user.password)

  if (!isValidUser) return res.send("🚫 Access denied")
  req.session.userId = user._id
  res.redirect("/dashboard")
})

app.post("/register", async (req, res) => {
  const user = new User(_.pick(req.body, ["username", "email", "password"]))

  const salt = await bcrypt.genSalt(10)
  user.password = await bcrypt.hash(user.password, salt)

  user
    .save()
    .then(() => {
      res.redirect("/dashboard")
    })
    .catch(err => res.status(500).send(err))
})

app.post("/dashboard", async (req, res) => {
  const user = await User.findById(req.session.userId)
  if (!user) return res.redirect("/login")

  res.send(`🎉 Logged in as ${user.username}`)
})

// ------ SERVER ------

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 server live @ http://localhost:${PORT}`)
})
