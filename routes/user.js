const express = require('express')
const authMiddleware = require('../middleware/auth').authMiddleware

const User = require('../models/user')

const validator = require('validator')

const userRouter = express.Router()

userRouter.post('/', async (req, res) => {
    console.log('Post user req ' + JSON.stringify(req.body))
    if (!validator.default.isJSON(JSON.stringify(req.body))) return res.send('Wrong type of request body')

    try {
        const user = new User(req.body)
        await user.save()
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


userRouter.get('/profile', authMiddleware, async function (req, res) {
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

module.exports = userRouter