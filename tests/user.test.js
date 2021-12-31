const request = require('supertest')
const app = require('../app')

const User = require('../models/user')

const testUserOne = {
    username: "duccuong0810",
    email: "duccuong0810@gmail.com",
    password: "duccuong0810"
}

beforeEach(async () => {
    await User.deleteMany()
})

test('should valid user sign up', async () => {
    await request(app).post('/user').send({
        username: "duccuong0810",
        email: "duccuong0810@gmail.com",
        password: "duccuong0810"
    }).expect(200)

    const user = await User.findOne({ username: "duccuong0810" })
    expect(user).toBeTruthy()
})

test('should not invalid user body sign up', async () => {
    await request(app).post('/user').send({
        username: "duccuong0801",
        email: "duccuong0810@gmail.com",
        assword: "duccuong0810"
    }).expect(404)
})
