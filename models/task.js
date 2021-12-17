const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: true
    },
    content: {
        type: String,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    }
    // updatedDate: {
    //     type: Date,
    //     required: false
    // }
})

module.exports = mongoose.model('Task', taskSchema)