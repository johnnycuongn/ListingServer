const express = require('express')
const authMiddleware = require('../middleware/auth').authMiddleware

const Task = require('../models/task')

const validator = require('validator')

const taskRouter = express.Router()


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

module.exports = taskRouter