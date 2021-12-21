const mongoose = require('mongoose')
const validator = require('validator')

const connectionURL = 'mongodb://127.0.0.1:27017'
const database = 'task-manager'

mongoose.connect(`${connectionURL}/${database}`)

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

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
})

const { authMiddleware } = require('./middleware/auth')

// USER
const userRouter = express.Router()
app.use('/user', userRouter)

userRouter.post('/', async (req, res) => {
    console.log('Post user req ' + JSON.stringify(req.body))
    if (!validator.default.isJSON(JSON.stringify(req.body))) return res.send('Wrong type of request body')

    try {
        const user = new User(req.body)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    }
    catch (error) {
        return res.status(404).send('Error: ' + error)
    }
})

userRouter.post('/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (error) {
        res.status(404).send('Unable to login')
    }

})


userRouter.get('/profile', authMiddleware, async (req, res) => {
    try {
        console.log('Doing profile');
        res.send(req.user)
    } catch (error) {
        res.status(401).send('Please anthenticate')
    }
})

userRouter.get('/:id', authMiddleware, (req, res) => {
    console.log('Getting user by id' + JSON.stringify(req.params));
    const _id = req.params.id
    User.findById(_id).then((user) => {
        if (!user) return res.status(404).send()

        res.send(user)
    }).catch((error) => {
        res.status(404).send('Unable to get user')
    })
})


userRouter.post('/logout', authMiddleware, async (req, res) => {
    try {
        const id = req.user._id
        const user = await User.findById(id)
        user.tokens = user.tokens.filter(token => token.token !== req.token)
        console.log('Loogut ' + user.tokens)
        await user.save()
        res.send('Successfully log out')
    } catch (error) {
        res.status(401).send('Unable to log user out')
    }
})

const taskRouter = express.Router()
app.use('/tasks', taskRouter)
// Users
taskRouter.get('/', authMiddleware, async (req, res) => {
    // console.log('Get params: ' + JSON.stringify(req.params) + ` at path ${req.url}`)
    // Task.find({}, (err, tasks) => {
    //     if (err) return res.status(404).send('Error getting tasks')
    //     res.json(tasks)
    // })
    const user = req.user

    // Populating virtual tasks for a user
    await user.populate(['tasks'])
    res.json(user.tasks)
})


taskRouter.post('/', authMiddleware, async (req, res) => {
    console.log('POST params: ' + JSON.stringify(req.params) + ` at path ${req.url}`)
    try {
        await Task.create({
            ...req.body,
            owner: req.user._id
        })
        res.send('Sucessfully add new task')
    } catch (error) {
        res.status(404).send('Unable to send data - Error: ' + error)
    }
})

taskRouter.delete('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id
        const deletedTask = await Task.findOneAndDelete({ _id: req.body._id, owner: userId })
        res.status(201).send(`Sucessfully delete task title ${deletedTask.title}`)
    } catch (error) {
        res.status(404).send('Unable to delete ' + req.body._id)
    }
})

taskRouter.get('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id
        const task = await Task.findOne({ _id: req.params.id, owner: userId })
        if (!task) return res.status(404).send('Unable to get task')
        res.json(task)
    } catch (error) {
        res.status(404).send('Unable to get ' + req.params.id)
    }
})

taskRouter.patch('/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.body) return res.status(404).send('Empty Body')

        const updates = Object.keys(req.body)
        const allowedUpdates = ['title', 'content', 'completed']
        const isValidOperation = updates.every(update => allowedUpdates.includes(update))

        if (!isValidOperation) return res.status(404).send('Invlalid operation')

        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body)
        res.send('Successfully update ' + req.params.id)
    } catch (error) {
        res.status(404)
    }
})
// User.estimatedDocumentCount().then((value) => {
//     console.log(`Number of users: ${value}`)
// })




