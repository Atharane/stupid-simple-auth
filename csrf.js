const express = require("express")
const app = express()

// ------ MIDDLEWARE ------
app.use(express.static("views")) // serve static files from the "views" directory

// ------ GET ENDPOINTS ------
app.get("/csrf", (req, res) => {
  res.sendFile(`${__dirname}/views/csrf.html`)
})

// ------ SERVER ------

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🐛 server live @ http://localhost:${PORT}`)
})
