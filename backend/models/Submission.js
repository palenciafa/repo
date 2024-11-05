const mongoose = require('mongoose');

// Define the schema for quiz submissions
const submissionSchema = new mongoose.Schema({
    userEmail: { type: String, required: true }, // Use email instead of userId
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    answers: { type: Map, of: String, required: true },
    score: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now }
});

// Create the model for quiz submissions
const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;