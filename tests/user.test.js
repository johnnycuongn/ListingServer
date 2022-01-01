const request = require('supertest')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const app = require('../app')

const User = require('../models/user')

const testUserOneId = new mongoose.Types.ObjectId()
const testUserOne = {
    _id: testUserOneId,
    username: "duccuong2169",
    email: "duccuong2169@gmail.com",
    password: "duccuong2169",
    tokens: [
        { token: jwt.sign({ _id: testUserOneId }, process.env.JWT_SECRET) }
    ]
}



beforeEach(async () => {
    await User.deleteMany()
    await new User(testUserOne).save()
})

test('should valid user sign up', async () => {
    const response = await request(app).post('/user').send({
        username: "duccuong0810",
        email: "duccuong0810@gmail.com",
        password: "duccuong0810"
    }).expect(200)

    const user = await User.findOne({ username: "duccuong0810" })
    expect(user).toBeTruthy()


    expect(response.body).toMatchObject({
        user: {
            username: "duccuong0810",
            email: "duccuong0810@gmail.com"
        },
        token: user.tokens[0].token
    })
})

test('should not invalid user body sign up', async () => {
    await request(app).post('/user').send({
        username: "duccuong080sss1",
        ail: "duccuong0810@gmail.com",
        assword: "duccuong0810"
    }).expect(404)
})

test('should log in existing user', async () => {
    const response = await request(app).post('/user/login').send({
        email: testUserOne.email,
        password: testUserOne.password
    }).expect(200)

    expect(response.body.token).toBe(testUserOne.tokens[0].token)
})

test('should log in invalid user', async () => {
    await request(app).post('/user/login').send({
        email: 'okoko@gmail.com',
        password: 'usaname'
    }).expect(404)
})

test('should get profile for user', async () => {
    await request(app).get('/user/profile')
        .set('Authorization', `Bearer ${testUserOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('should not get profile for invalid user', async () => {
    await request(app).get('/user/profile')
        .send()
        .expect(401)
})
