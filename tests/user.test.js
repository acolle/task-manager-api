const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOneId, userOne, setupDatabase } = require('./fixtures/db')

// Setup
beforeEach(setupDatabase)

// Test cases
test('Should signup a new user', async () => {
  const response = await request(app).post('/users').send({
    name: 'Anthony',
    email: 'anthonycolle@example.com',
    password: 'pwdtest777!'
  }).expect(201)

  // Assert that the db was changed correctly
  const user = await User.findById(response.body.user._id)
  expect(user).not.toBeNull()

  // Assertions about the response
  expect(response.body.user.name).toBe('Anthony')
  expect(response.body).toMatchObject({
    user: {
      name: 'Anthony',
      email: 'anthonycolle@example.com'
    },
    token: user.tokens[0].token
  })
  expect(user.password).not.toBe('pwdtest777!')

})

test('Should login existing user', async () => {
  await request(app).post('/users/login').send({
    email: userOne.email,
    password: userOne.password
  }).expect(200)
})

test('Validate new token is saved', async () => {
  const response = await request(app).post('/users/login').send({
    email: userOne.email,
    password: userOne.password
  }).expect(200)

  // Assert that the db was changed correctly
  const user = await User.findById(userOneId)
  expect(user).not.toBeNull()

  // Asset that token in response matces users second token
  expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login nonexisting user', async () => {
  await request(app).post('/users/login').send({
    email: 'wrong' + userOne.email,
    password: userOne.password
  }).expect(400)
})

test('Should get profile for user', async () => {
  await request(app)
  .get('/users/me')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send()
  .expect(200)
})

test('Should not get profile for user', async () => {
  await request(app)
  .get('/users/me')
  .send()
  .expect(401)
})

test('Should delete account for user', async () => {
  await request(app)
  .delete('/users/me')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send()
  .expect(200)

  // Validate user is removed
  const user = await User.findById(userOneId)
  expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async () => {
  await request(app)
  .delete('/users/me')
  .send()
  .expect(401)
})

test('Should upload avatar image', async () => {
  await request(app)
  .post('/users/me/avatar').
  set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .attach('avatar', './tests/fixtures/profile-pic.jpg')
  .expect(200)

  const user = await User.findById(userOneId)
  // In JS, 1 === 1 but {} !=== {} as it checks if it's the exact same obj in memory
  // toBe() uses the triple equality but not toEqual()
  expect(user.avatar).toEqual(expect.any(Buffer)) // check if avatar contains a buffer
})

test('Should update valid user fields', async () => {
  await request(app)
  .patch('/users/me')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send({
    name: 'Peter'
  })
  .expect(200)

  const user = await User.findById(userOneId)
  expect(user.name).toEqual('Peter')

})

test('Should not update invalid user fields', async () => {
  await request(app)
  .patch('/users/me')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send({
    location: 'Quahog'
  })
  .expect(400)
})

// User Test Ideas
//
// Should not signup user with invalid name/email/password
// Should not update user if unauthenticated
// Should not update user with invalid name/email/password
// Should not delete user if unauthenticated
