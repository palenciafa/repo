// models/Class.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Use uuid to generate unique codes

const StudentSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Unique email for each student
});

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    default: '',
  },
  code: {
    type: String,
    unique: true, // Ensure the code is unique
    sparse: true, // This ensures only non-null codes are enforced as unique
    default: function () {
      if (this.type === 'private') {
        return uuidv4().slice(0, 8);
      } else if (this.type === 'public') {
        return `public-${uuidv4().slice(0, 8)}`;
      }
      return null; // Set null for other cases
    },
  },
  students: {
    type: [String],
    default: [],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Ensure the index is created properly with sparse
classSchema.index({ code: 1 }, { unique: true, sparse: true, partialFilterExpression: { code: { $type: 'string' } } });

const Class = mongoose.model('Class', classSchema);
module.exports = Class;