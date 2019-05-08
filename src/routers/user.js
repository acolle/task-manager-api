const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const router = new express.Router()

// Create new user
router.post('/users', async (req, res) => {
  const user = new User(req.body)

  // With Async/Await Feature
  try {
    await user.save()
    sendWelcomeEmail(user.email, user.name)
    const token = await user.generateAuthToken()
    res.status(201).send({user, token})
  } catch (e) {
    res.status(400).send(e)
  }

  // Without Async/Await Feature
  // user.save().then(() => {
  //   res.status(201).send(user)
  // }).catch((e) => {
  //   res.status(400).send(e)
  // })
})

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()
    res.send({user, token})
  } catch (e) {
    res.status(400).send()
  }
})

router.post('/users/logout', auth, async (req, res) => {
  try {
    // Remove the last active token
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    // Remove all the Auth Tokens
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

// Read all users - Not to be used in final version
router.get('/users', async (req, res) => {

  // With Async/Await Feature
  try {
    const users = await User.find({})
    res.send(users)
  } catch (e) {
    res.status(500).send()
  }

  // Without Async/Await Feature
  // User.find({}).then((users) => {
  //   res.send(users)
  // }).catch((e) => {
  //   res.status(500).send()
  // })
})

// Read active user
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user)
})

// Read all users - Should not be in final version
router.get('/users/:id', async (req, res) => {
  const _id = req.params.id

  // With Async/Await Feature
  try {
    const user = await User.findById(_id)
    if (!user) {
      return res.status(404).send()
    }
    res.send(user)
  } catch (e) {
    res.status(500).send()
  }

  // Without Async/Await Feature
  // User.findById(_id).then((user) => {
  //   if (!user) {
  //     return res.status(404).send()
  //   }
  //   res.send(user)
  // }).catch((e) => {
  //   res.status(500).send()
  // })
})

// Update logged in user
router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update)
  })

  if (!isValidOperation){
    return res.status(400).send({error: 'Invalid updates'})
  }

  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update]
    })
    await req.user.save()
    res.send(req.user)
  } catch (e) {
    res.status(400).send(e)
  }
})

// Update users by id - Not to be used in final version
router.patch('/users/:id', async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update)
  })

  if (!isValidOperation){
    return res.status(400).send({error: 'Invalid updates'})
  }

  try {
    const user = await User.findById(req.params.id)
    updates.forEach((update) => {
      user[update] = req.body[update]
    })
    await User.save()
    //  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!user) {
      return res.status(404).send()
    }
    res.send(user)
  } catch (e) {
    res.status(400).send(e)
  }
})

// Delete your own account
router.delete('/users/me', auth, async (req, res) => {
  try {
    // const user = await User.findByIdAndDelete(req.user._id)
    // if (!user) {
    //   return res.status(404).send()
    // }
    await req.user.remove()
    sendCancelationEmail(req.user.email, req.user.name)
    res.send(req.user)
  } catch (e) {
    res.status(500).send(e)
  }
})

// Delete users by id - Not to be used in final version
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
      return res.status(404).send()
    }
    res.send(user)
  } catch (e) {
    res.status(500).send(e)
  }
})

// Upload files
const upload = multer({
  limits: {
    fileSize: 1000000 // in bytes (1 MB)
  },
  fileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return callback(new Error('Please upload a word file'))
    }

    callback(undefined, true)

    // Callback options
    // callback(new Error('File must be a pdf')) // Reject the upload
    // callback(undefined, true) // Accept the upload
    // callback(undefined, false) // Silently reject the upload
  }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
  req.user.avatar = buffer
  await req.user.save()
  res.send()
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

// Delete user profile image
router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined
  await req.user.save()
  res.send()
})

// Get the avatar for a user by their id
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error()
    }

    res.set('Content-Type', 'image/png')
    res.send(user.avatar)

  } catch (e) {
    res.status(400).send()
  }
})

module.exports = router
