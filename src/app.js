const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()

// Automatically parse json data
app.use(express.json())

// Use routers
app.use(userRouter)
app.use(taskRouter)

module.exports = app
