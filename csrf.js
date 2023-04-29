// make a post request to /dashboard with the following body: { amount: 100, receiver: "hacker" }

fetch("http://localhost:3000/dashboard", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ amount: 100, receiver: "hacker" }),
})
  .then(res => res.text())
  .then(text => console.log(text))
  .catch(err => console.log(err))
