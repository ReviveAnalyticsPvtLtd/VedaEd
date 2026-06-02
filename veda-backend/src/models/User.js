const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function requiredPassword() {
      return this.authProvider !== 'google';
    },
  },
  googleId: { type: String, sparse: true, unique: true },
  profilePicture: { type: String },
  authProvider: {
    type: String,
    enum: ['email', 'local', 'google'],
    default: 'email',
  },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  refId: { type: mongoose.Schema.Types.ObjectId }, // Link to Student, Parent, or Staff _id
  schoolId: { type: mongoose.Schema.Types.ObjectId },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (this.authProvider === 'google' && !this.isModified('password')) return next();
  if (!this.password) return next();
  if (!this.isModified('password') || this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
