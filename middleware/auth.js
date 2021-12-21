const User = require('../models/user')
const jwt = require('jsonwebtoken')
const secretKey = "thisistaskmanager"

/**
 * Require header: `Authorization`
 * 
 * 
 * @return userObject 
 */
const authMiddleware = async (req, res, next) => {
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
        res.status(401).send('Please authenticate ' + error)
    }
}

module.exports = { authMiddleware }