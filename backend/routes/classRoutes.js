const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Class = require('../models/Class');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid'); // Use UUID for unique code generation

const router = express.Router();

// Route to create a new class
router.post('/create-class', authMiddleware, async (req, res) => {
  const { name, description, type, students } = req.body;

  try {
    const newClass = await Class.create({
      name,
      description,
      type,
      students,
      createdBy: req.user._id,
      code: type === 'public' ? `public-${uuidv4().slice(0, 8)}` : uuidv4().slice(0, 8)
    });

    // Update the registered classes for each student
    await User.updateMany(
      { email: { $in: students } },
      { $addToSet: { registeredClasses: newClass._id } }
    );

    res.status(201).json({ success: true, message: 'Class created successfully!', class: newClass });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(400).json({ error: 'Error creating class: ' + error.message });
  }
});


// Route to get all classes for the logged-in user
router.get('/classes', authMiddleware, async (req, res) => {
  try {
    const classes = await Class.find({ createdBy: req.user._id });
    res.status(200).json({ success: true, classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to get class details by ID
router.get('/class/:id', authMiddleware, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    // Find students based on emails stored in additionalInfo
    const students = await User.find({ email: { $in: classData.students } });
    
    res.json({ success: true, class: { ...classData._doc, students } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST route to add multiple students to a class
router.post('/class/:id/add-students', authMiddleware, async (req, res) => {
  const classId = req.params.id;
  const { emails } = req.body;

  if (!Array.isArray(emails)) {
    return res.status(400).json({ success: false, error: 'Invalid input. Emails must be an array.' });
  }

  try {
    const classToUpdate = await Class.findById(classId);
    if (!classToUpdate) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    // Update the Class model
    await Class.updateOne(
      { _id: classId },
      { $addToSet: { students: { $each: emails } } }
    );

    // Update the User model for each student
    await User.updateMany(
      { email: { $in: emails } },
      { $addToSet: { registeredClasses: classId } }
    );

    const updatedClass = await Class.findById(classId).populate('students');
    return res.json({ success: true, class: updatedClass });
  } catch (error) {
    console.error('Error adding students:', error);
    return res.status(500).json({ success: false, error: 'An error occurred while adding students' });
  }
});

// Route to remove a student from a class
router.post('/class/:id/remove-student', authMiddleware, async (req, res) => {
  const classId = req.params.id;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  try {
    const classToUpdate = await Class.findById(classId);
    if (!classToUpdate) {
      return res.status(404).json({ success: false, error: 'Class not found.' });
    }

    // Remove the student by filtering out the email
    classToUpdate.students = classToUpdate.students.filter(studentEmail => studentEmail !== email);

    // Save the updated class
    await classToUpdate.save();

    // Remove the class from the student's registeredClasses
    await User.updateOne(
      { email },
      { $pull: { registeredClasses: classId } }
    );

    // Fetch the updated class to return
    const updatedClass = await Class.findById(classId);
    
    return res.json({ success: true, class: updatedClass });
  } catch (error) {
    console.error('Error removing student:', error);
    return res.status(500).json({ success: false, error: 'An error occurred while removing the student.' });
  }
});




// Route to leave a class
router.post('/class/:id/leave', authMiddleware, async (req, res) => {
  const classId = req.params.id;
  const userId = req.user._id;
  const userEmail = req.user.email;

  try {
    const classToLeave = await Class.findById(classId);
    if (!classToLeave) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    // Remove the student's email from the class's students array
    classToLeave.students = classToLeave.students.filter(email => email !== userEmail);
    await classToLeave.save();

    // Remove the class ID from the user's registeredClasses array
    await User.updateOne(
      { _id: userId },
      { $pull: { registeredClasses: classId } }
    );

    res.status(200).json({ success: true, message: 'Successfully left the class' });
  } catch (error) {
    console.error('Error leaving the class:', error);
    res.status(500).json({ success: false, error: 'An error occurred while leaving the class' });
  }
});









// Route to delete a class by ID
router.delete('/class/:id', authMiddleware, async (req, res) => {
  const classId = req.params.id;

  try {
    const classToDelete = await Class.findById(classId);
    if (!classToDelete) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    // Ensure the user is authorized to delete the class
    if (classToDelete.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Remove the class from the registeredClasses array of all users
    await User.updateMany(
      { registeredClasses: classId },
      { $pull: { registeredClasses: classId } }
    );

    await Class.findByIdAndDelete(classId);
    res.status(200).json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ success: false, error: 'An error occurred while deleting the class' });
  }
});



// Route to get public classes that the logged-in student is not registered for
router.get('/public-classes/unregistered', authMiddleware, async (req, res) => {
  try {
    // Fetch all public classes and populate the createdBy field with fname and lname
    const publicClasses = await Class.find({ type: 'public' }).populate('createdBy', 'fname lname');

    // Fetch the logged-in user's registered classes
    const user = await User.findById(req.user._id).select('registeredClasses');
    const registeredClassIds = user.registeredClasses.map(classId => classId.toString());

    // Filter out the classes the user is already registered for
    const unregisteredClasses = publicClasses.filter(
      classItem => !registeredClassIds.includes(classItem._id.toString())
    );

    res.status(200).json({ success: true, classes: unregisteredClasses });
  } catch (error) {
    console.error('Error fetching unregistered public classes:', error);
    res.status(500).json({ success: false, error: 'Error fetching unregistered public classes' });
  }
});


// Route to join a public class
router.post('/join-public-class/:id', authMiddleware, async (req, res) => {
  const classId = req.params.id;
  const userId = req.user._id;

  try {
    // Find the class by ID and ensure it is a public class
    const classToJoin = await Class.findById(classId);
    if (!classToJoin || classToJoin.type !== 'public') {
      return res.status(404).json({ success: false, error: 'Public class not found' });
    }

    // Add the student's email to the class's students array if not already added
    if (!classToJoin.students.includes(req.user.email)) {
      classToJoin.students.push(req.user.email);
      await classToJoin.save();
    }

    // Add the class ID to the user's registeredClasses array if not already added
    const user = await User.findById(userId);
    if (!user.registeredClasses.includes(classId)) {
      user.registeredClasses.push(classId);
      await user.save();
    }

    res.status(200).json({ success: true, class: classToJoin });
  } catch (error) {
    console.error('Error joining public class:', error);
    res.status(500).json({ success: false, error: 'An error occurred while joining the class' });
  }
});

module.exports = router;