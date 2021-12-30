const mongoose = require('mongoose')
const validator = require('validator')


mongoose.connect(`${process.env.MONGODB_URL}/${process.env.MONGODB_TASKDB}`)

const Task = require('./models/task')
const User = require('./models/user')



let systemData = []

const express = require('express')
const app = express()
// Parse JSON in Request body
app.use(express.json())
app.use(function (req, res, next) {
    console.log('First Middle ware is calling')
    next()
})

app.use((req, res, next) => {
    console.log('Performing logging')
    systemData.push('Logging as: ' + req.url)
    console.log('Logs: ' + systemData)
    next()
})

const port = process.env.PORT

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
})

const { authMiddleware } = require('./middleware/auth')
const routes = require('./routes')

app.use('/user', routes.User)
app.use('/tasks', routes.Task)


// User.estimatedDocumentCount().then((value) => {
//     console.log(`Number of users: ${value}`)
// })




