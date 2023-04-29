const express = require("express")
const cors = require("cors")
const _ = require("lodash")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const sessions = require("client-sessions")

require("dotenv").config()

const app = express()

// ------ MIDDLEWARE ------
app.use(express.json())
app.use(cors({ origin: "https://www.section.io" }))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static("views")) // serve static files from the "views" directory
app.use(
  sessions({
    cookieName: "session",
    secret: process.env.SESSION_SECRET,
    duration: 30 * 60 * 1000,
  })
)

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

const User = mongoose.model("User", userSchema)

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

app.get("/dashboard", async (req, res) => {
  if (!req.session?.userId) return res.redirect("/login")

  const user = await User.findById(req.session.userId)
  if (!user) return res.redirect("/login")

  //! VULNERABLE CODE AHEAD
  const { amount, receiver } = req.query
  
  if (amount) {
    return res.send(`💰 ${user.username} sent ${amount} to ${receiver}`)
  }

  res.sendFile(`${__dirname}/views/dashboard.html`)
})

// ------ POST ENDPOINTS ------

app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return res.status(400).send("Invalid credentials")
  }

  if (req.body.password !== user.password) {
    return res.send("🚫 Access denied")
  } else {
    req.session.userId = user._id
    res.redirect("/dashboard")
  }
})

app.post("/register", async (req, res) => {
  const user = new User(_.pick(req.body, ["username", "email", "password"]))

  user
    .save()
    .then(() => {
      res.redirect("/dashboard")
    })
    .catch(err => res.status(500).send(err))
})

// ------ SERVER ------

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 server live @ http://localhost:${PORT}`)
})
