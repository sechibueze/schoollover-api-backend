const mongoose = require('mongoose');
const crypto = require('crypto');
const Project = require("./Project");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstname: {
    type: String,
    required: true,
    trim: true
  },
  lastname: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  profileImage: {
    type: String,
    trim: true
  },
  auth: {
    type: Array,
    default: [
      'user'
    ]
  }, 
  active: {
    type: Boolean,
    default: false,
    required: true
  },
  confirmation: {
    type: Boolean,
    default: false,
    required: true
  },
  confirmationToken: {
    type: String,
    default: ''
  },
  passwordResetToken: {
    type: String,
    default: ''
  },
  resetPasswordValidity: {
    type: Date
  },
}, { timestamps: true });

// { query: true, document: false }
UserSchema.pre('remove', async function (next) {
  console.log('cleaning project by removing', this)
  await Project.deleteMany({ owner: this._id})
  console.log('project cleaneed', this)
  return next()
})

UserSchema.methods.generatePasswordResetToken = function() {
    this.passwordResetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordValidity = Date.now() + 3600000; //expires in an hour
};
module.exports = User = mongoose.model('user', UserSchema);