import React, { useState } from 'react';
import PropTypes from 'prop-types';
import QuizQuestions from '../../component/QuizQuestions';
import QuizSettings from '../../component/QuizSettings';
import QuizOverview from '../../component/QuizOverview';
import axios from 'axios';
import questionIcon from './../../media/question.svg';
import settingsIcon from './../../media/settings.svg';
import previewIcon from './../../media/preview.svg';
import editIcon from './../../media/edit.svg';
import backIcon from './../../media/back.svg';

import '../../css/CreateActivity.css';
import '../../css/settings_style.css';

const CreateActivity = ({ onBackClick, selectedClass, onQuizCreate }) => {
  const [activeComponent, setActiveComponent] = useState('questions');
  const [quiz, setQuiz] = useState({
    quiz_title: '',
    quiz_desc: '',
    quiz_instructions: '',
    class_id: selectedClass._id, // Ensure class ID is set
    questions: [
      {
        question: '',
        choices: ['', '', '', ''],
        correct_answer: '',
        points: 0, // Initialize points as a number
      },
    ],
    timeLimit: { hours: 0, minutes: 0, seconds: 0 }, // Initialize as numbers
    deadline: { date: '', time: '' },
    passingScore: 0, // Initialize passingScore as a number
    attemptsAllowed: 0, // Initialize attemptsAllowed as a number
  });

  const handleButtonClick = (component) => {
    setActiveComponent(component);
  };

  const handleSave = async () => {
    try {
      const response = await axios.post('http://localhost:4000/api/quizzes', quiz);
      console.log('Quiz created:', response.data);
      onQuizCreate(response.data); // Call the onQuizCreate function with the created quiz
    } catch (error) {
      console.error('Error creating quiz:', error);
    }
  };

  return (
    <div id="create-activity">
      <h2>{selectedClass.name}</h2> {/* Display the class name */}
      <div className="btn-group">
        <button className="back-btn" onClick={onBackClick}>
          <img src={backIcon} alt="Back Icon" />
        </button>
        <button
          className={`btn-primary ${activeComponent === 'questions' ? 'active' : ''}`}
          onClick={() => handleButtonClick('questions')}
        >
          <img src={questionIcon} alt="Question Icon" className="btn-primary-icon" />
          Questions
        </button>
        <button
          className={`btn-primary ${activeComponent === 'settings' ? 'active' : ''}`}
          onClick={() => handleButtonClick('settings')}
        >
          <img src={settingsIcon} alt="Settings Icon" className="btn-primary-icon" />Settings
        </button>
      </div>
      <div className="icon-group">
        <button
          className={`btn-icon-preview ${activeComponent === 'overview' ? 'active' : ''}`}
          onClick={() => handleButtonClick('overview')}
        >
          <img src={previewIcon} alt="Eye Icon" />
        </button>
        <button
          className={`btn-icon-edit ${activeComponent === 'questions' ? 'active' : ''}`}
          onClick={() => handleButtonClick('questions')}
        >
          <img src={editIcon} alt="Edit Icon" />
        </button>
      </div>
      <div className="main-content">
            {activeComponent === 'questions' && (
                <QuizQuestions quiz={quiz} setQuiz={setQuiz} selectedClass={selectedClass} onQuizCreate={onQuizCreate} />
            )}
            {activeComponent === 'settings' && (
                <QuizSettings quiz={quiz} setQuiz={setQuiz} />
            )}
            {activeComponent === 'overview' && <QuizOverview quiz={quiz} />}
        </div>
        <button onClick={handleSave} className="btn-save">Save</button>
    </div>
  );
};

CreateActivity.propTypes = {
  onBackClick: PropTypes.func.isRequired,
  selectedClass: PropTypes.object.isRequired, // Ensure selectedClass is required
  onQuizCreate: PropTypes.func.isRequired, // Ensure onQuizCreate is required
};

export default CreateActivity;