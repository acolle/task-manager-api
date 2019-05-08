const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

// Create new task
router.post('/tasks', auth, async (req, res) => {

  const task = new Task({
    ...req.body, // ES6 Spear Operator
    owner: req.user._id // associate a new task with the owner
  })

  // With Async/Await Feature
  try {
    await task.save()
    res.status(201).send(task)
  } catch (e) {
    res.status(400).send(e)
  }

  // Without Async/Await Feature
  // task.save().then(() => {
  //   res.status(201).send(task)
  // }).catch((e) => {
  //   res.status(400).send(e)
  // })
})

// Read all tasks
router.get('/tasks', auth, async (req, res) => {
  // With Async/Await Feature
  try {
    // 1st option
    // const tasks = await Task.find({
    //   owner: req.user._id
    // })

    // 2nd option
    const match = {}
    const sort = {}

    if (req.query.completed) {
      match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
      const parts = req.query.sortBy.split('_')
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 // Desc: -1 / Asc: 1
      console.log(sort)
    }

    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate()

    // res.send(tasks) // With 1st option
    res.send(req.user.tasks) // With 2nd option
  } catch (e) {
    res.status(500).send()
  }

  // Without Async/Await Feature
  // Task.find({}).then((task) => {
  //   res.send(task)
  // }).catch((e) => {
  //   res.status(500).send()
  // })
})

// Read a given task
router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id

  // With Async/Await Feature
  try {
    //const task = await Task.findById(_id)
    const task = await Task.findOne({
      _id,
      owner: req.user._id
    })
    if (!task) {
      return res.status(404).send()
    }
    res.send(task)
  } catch (e) {
    res.status(500).send()
  }

  // Without Async/Await Feature
  // Task.findById(_id).then((task) => {
  //   if (!task) {
  //     return res.status(404).send()
  //   }
  //   res.send(task)
  // }).catch((e) => {
  //   res.status(500).send()
  // })
})

router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['description', 'completed']
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update)
  })

  if (!isValidOperation){
    return res.status(400).send({error: 'Invalid updates'})
  }

  try {
    // 1st option - All tasks
    // const task = await Task.findById(req.params.id)
    // update.forEach((update) => {
    //   task[update] = req.body[update]
    // })
    // 2nd option - All tasks
    //const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    console.log('Task ID: ', req.params.id)
    console.log('Owner ID: ', req.user._id)

    // For owned tasks only
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    })

    if (!task) {
      return res.status(404).send()
    }

    updates.forEach((update) => {
      task[update] = req.body[update]
    })
    await task.save()
    res.send(task)
  } catch (e) {
    res.status(400).send(e)
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    })
    if (!task) {
      return res.status(404).send()
    }
    res.send(task)
  } catch (e) {
    res.status(500).send(e)
  }
})

module.exports = router
