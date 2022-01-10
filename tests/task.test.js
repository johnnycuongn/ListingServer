const request = require('supertest')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const app = require('../app')

const User = require('../models/user')
const Task = require('../models/task')
const { authMiddleware } = require('../middleware/auth')

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

test('should not task created unauthorized', async () => {
    await request(app).post('/tasks')
        .send()
        .expect(401)
})

test('should task created', async () => {
    await request(app).post('/tasks')
        .set(
            'Authorization', `Bearer ${testUserOne.tokens[0].token}`
        )
        .send({
            title: 'test title',
            content: 'test content'
        })
        .expect(201)

    const taskCreated = await Task.findOne({ owner: testUserOne._id })
    expect(taskCreated).toBeTruthy()
    expect(taskCreated.title).toBe('test title')
    expect(taskCreated.content).toBe('test content')
})