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

module.exports = mongoose.model('User', userSchema)