const mongoose = require('mongoose')
const validator = require('validator')

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

// When you `populate()` the `task` virtual, Mongoose will find the
// first document in the Task model whose 'foreignField - owner (defined in task schema)' 
// matches this document's `localField - _id` property.
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})


const bcrypt = require('bcrypt')

/** Validate user credentials through email and password  */
userSchema.statics.findByCredentials = async function (email, password) {
    try {
        const user = await User.findOne({ email })
        if (!user) throw new Error('Unable to find user')

        const isMatch = bcrypt.compare(password, user.password)
        if (!isMatch) throw new Error('Unable to login')

        return user
    } catch (error) {
        throw error
    }

}

// Hash password before save user
userSchema.pre('save', async function (next) {

    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8)
    }

    next()
})

// METHODS

const jwt = require('jsonwebtoken')
const secretKey = "thisistaskmanager"

/** Use to generate token for user */
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, secretKey)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

const User = mongoose.model('User', userSchema)
module.exports = User