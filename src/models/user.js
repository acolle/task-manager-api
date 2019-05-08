const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema =  new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    validate(value){
      if (!validator.isEmail(value)){
        throw new Error('Email is invalid')
      }
    }
  },
  age: {
    type: Number,
    default: 0,
    validate(value){
      if (value < 0){
        throw new Error('Age must be a positive number')
      }
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    trim: true,
    validate(value){
      if (value.toLowerCase().includes('password')){
        throw new Error('Password cannot contain "password"')
      }
    }
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  avatar: {
    type: Buffer
  }
}, {
  timestamps: true
})

userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id', // where local data is stored
  foreignField: 'owner' // field on the ref model that is creating the relationship
})

// This static function is available on all users
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({
    email: email
  })

  if (!user) {
    throw new Error('Unable to login')
  }
  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    throw new Error('Unable to login')
  }

  return user
}

// This method is available on a given instance of Users
userSchema.methods.generateAuthToken = async function () {
  const user = this
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
  user.tokens = user.tokens.concat({ token })
  await user.save() // make sure the token is added to the db
  return token
}

userSchema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()

  // Hide / do not return password and tokens to client
  delete userObject.password
  delete userObject.tokens
  delete userObject.avatar

  return userObject
}

// Hash the plain text password
userSchema.pre('save', async function (next) {
  const user = this

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }
  next() // to finish the function
})

// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
  const user = this

  await Task.deleteMany({
    owner: user._id
  })

  next()
})

// Define the model for Users
const User = mongoose.model('User', userSchema)

module.exports = User
