const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true, // used for @username
      trim: true
    },
    fullName: {
      type: String,
      required: true, // display name like "Swapnil JK"
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    profileImage: {
      type: String,
      default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
    },
    bio: {
      type: String,
      default: '',
      maxLength: 150 // like Twitter
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
