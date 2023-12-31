const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Add express.json() middleware
router.use(express.json());

router.get('/', async (req, res) => {
  const userList = await User.find().select('-passwordHash');
  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash');
  if (!user) {
    return res.status(500).json({ message: 'The user with the given ID could not be found' });
  }
  res.send(user);
});

// Add user
router.post('/', async (req, res) => {
  let user = new User({
    name: req.body.name,
    surname: req.body.surname,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    street: req.body.street,
    apartment: req.body.apartment,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    isAdmin: req.body.isAdmin,
    isInvestor: req.body.isInvestor,
  });
  user = await user.save();
  if (!user) {
    res.status(500).send('The user cannot be created');
  }
  res.send(user);
});

// Edit user
router.put(`/:id`, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send('Invalid user ID');
  }

  const userExist = await User.findById(req.params.id);
  let newPassword;

  if (req.body.password) {
    newPassword = bcrypt.hashSync(req.body.password ,10);
  } else {
    newPassword = userExist.passwordHash;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      surname: req.body.surname,
      email: req.body.email,
      passwordHash: newPassword,
      phone: req.body.phone,
      street: req.body.street,
      apartment: req.body.apartment,
      city: req.body.city,
      zip: req.body.zip,
      country: req.body.country,
      isAdmin: req.body.isAdmin,
      isInvestor: req.body.isInvestor,
    },
    { new: true }
  )

  if (!user) {
    return res.status(400).send('The user could not be edited');
  }

  res.send(user);
});

router.delete('/:id', (req, res) => {
  User.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (user) {
        return res.status(200).json({ success: true, message: 'The user has been deleted' });
      } else {
        return res.status(404).json({ success: false, message: 'The user has not been deleted' });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get('/get/count', async (req, res) => {
  const userCount = await User.countDocuments();
  if (!userCount) {
    res.status(500).json({ success: false });
  }
  res.send({ userCount: userCount });
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const secret = process.env.secret;
  
  if (!user) {
    return res.status(400).send('The user could not be found');
  }



  if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
    const token = jwt.sign(
      {
        userID: user.id,
        isAdmin: user.isAdmin,
        isInvestor: user.isInvestor,
      },
      secret,
      { expiresIn: '1d' }
    );

    res.status(200).send({ user: user.email, token: token, user });
  } else {
    res.status(400).send('The user email and password are incorrect!');
  }
});

module.exports = router;
