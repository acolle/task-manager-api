const app = require('./app')

const port = process.env.PORT // Port in production is managed by Heroku

app.listen(port, () => {
  console.log('Server is up on port ' + port)
})
