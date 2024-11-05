const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission'); 
const Quiz = require('../models/Quiz');
const { verifyToken } = require('../middleware/auth'); 


// Function to handle quiz submission
const submitQuiz = async (req, res) => {
    const { userEmail, quizId, answers, score } = req.body;

    try {
        // Validate the data
        if (!userEmail || !quizId || !answers || score === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Create a new submission document
        const newSubmission = new Submission({
            userEmail, // Use email instead of userId
            quizId,
            answers,
            score
        });

        // Save the submission to the database
        await newSubmission.save();

        res.status(201).json({ message: 'Quiz submitted successfully', submission: newSubmission });
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ message: 'Error submitting quiz', error: error.message });
    }
};

// Route to handle quiz submission
router.post('/submit-quiz', submitQuiz);

// Route to get all submissions for a quiz
router.get('/quiz/:quizId/submissions', async (req, res) => {
    const { quizId } = req.params;

    try {
        // Find the quiz by ID
        const quiz = await Quiz.findById(quizId);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Find all submissions for the quiz
        const submissions = await Submission.find({ quizId });

        res.status(200).json({ submissions });
    } catch (error) {
        console.error('Error getting submissions:', error);
        res.status(500).json({ message: 'Error getting submissions', error: error.message });
    }
});

// Route to check if the student has already submitted the quiz
router.get('/quiz/:quizId/check-submission', verifyToken, async (req, res) => {
    const { quizId } = req.params;
    const { userEmail } = req.query;

    if (!userEmail) {
        return res.status(400).json({ error: 'User email is required' });
    }

    try {
        const submission = await Submission.findOne({ quizId, userEmail });
        const attempts = await Submission.countDocuments({ quizId, userEmail });

        if (submission) {
            return res.json({ hasSubmitted: true, attempts });
        } else {
            return res.json({ hasSubmitted: false, attempts });
        }
    } catch (error) {
        console.error('Error checking submission:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to get all submissions of the student
router.get('/submissions', verifyToken, async (req, res) => {
    const { userEmail } = req.query;

    if (!userEmail) {
        return res.status(400).json({ error: 'User email is required' });
    }

    try {
        const submissions = await Submission.find({ userEmail });
        return res.json({ submissions });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});



module.exports = router;