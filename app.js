const mongoose = require('mongoose')
const validator = require('validator')

const connectionURL = 'mongodb://127.0.0.1:27017'
const database = 'task-manager'

mongoose.connect(`${connectionURL}/${database}`)

const Task = require('./models/task')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                return validator.default.isEmail(v)
            },
            message: props => `${props.value} is not a valid email`
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) { throw new Error('Your password is weak. Please change to another password') }
        }
    },
    age: {
        type: Number,
        min: [10, 'Age below 10 is unaccepted. Your age is {VALUE}']
        // validate: {
        //     validator: function (v) {
        //         return v > 10;
        //     },
        //     message: props => `Age below 10 is unaccepted`
        // }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})


// Validating credentials
const bcrypt = require('bcrypt')
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) throw new Error('Unable to find user')

    const isMatch = bcrypt.compare(password, user.password)
    if (!isMatch) throw new Error('Unable to login')

    return user
}

// Hash password before save user
userSchema.pre('save', async function (next) {

    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8)
    }

    next()
})

const jwt = require('jsonwebtoken')
const secretKey = "thisistaskmanager"
// Generate token for user
/** Use to generate token */
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, secretKey)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

const User = mongoose.model('User', userSchema)


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

app.get('/', (req, res) => {
    console.log('Get params: ' + JSON.stringify(req.params) + ` at path ${req.url}`)
    res.send('Heeloo')
})

// USER
app.post('/user', async (req, res) => {
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

app.post('/user/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (error) {
        res.status(404).send(error)
    }

})

const auth = async (req, res, next) => {
    try {
        const tokenHeader = req.header('Authorization').split(' ')[1]

        const decoded = jwt.verify(tokenHeader, secretKey)

        const user = await User.findById(decoded._id)

        if (!user) return res.statusCode(401).send('Cant find user')
        if (user.tokens.filter(token => token.token === tokenHeader).length === 0) throw new Error()

        req.token = tokenHeader
        req.user = user
        next()
    }
    catch (error) {
        res.status(401).send('Please authenticate')
    }
}

app.get('/user/profile', auth, async (req, res) => {
    try {
        res.send(req.user)
    } catch (error) {
        res.status(401).send('Please anthenticate')
    }
})

app.get('/user/:id', auth, (req, res) => {
    console.log('Getting user by id' + JSON.stringify(req.params));
    const _id = req.params.id
    User.findById(_id).then((user) => {
        if (!user) return res.status(404).send()

        res.send(user)
    }).catch((error) => {
        res.status(404).send('Unable to get user')
    })
})

app.post('/user/logout', auth, async (req, res) => {
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
taskRouter.get('/', (req, res) => {
    console.log('Get params: ' + JSON.stringify(req.params) + ` at path ${req.url}`)
    Task.find({}, (err, tasks) => {
        if (err) return res.status(404).send('Error getting tasks')
        res.json(tasks)
    })
})


taskRouter.post('/', async (req, res) => {
    console.log('POST params: ' + JSON.stringify(req.params) + ` at path ${req.url}`)
    try {
        await Task.create(req.body)
        res.send('Sucessfully add new task')
    } catch (error) {
        res.status(404).send('Unable to send data - Error: ' + error)
    }
})

taskRouter.delete('/', async (req, res) => {
    try {
        const deletedTask = await Task.findOneAndDelete({ _id: req.body._id })
        res.status(201).send(`Sucessfully delete task title ${deletedTask.title}`)
    } catch (error) {
        res.status(404).send('Unable to delete ' + req.body._id)
    }
})

taskRouter.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
        res.json(task)
    } catch (error) {
        res.status(404).send('Unable to get ' + req.params.id)
    }
})

taskRouter.patch('/:id', async (req, res) => {
    try {
        if (!req.body) return res.status(404).send('Empty Body')

        // const updates = Object.keys(req.body)
        // const allowedUpdates = ['username', 'email', 'password', 'age']
        // const isValidOperation = updates.every(update => allowedUpdates.includes(update))

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