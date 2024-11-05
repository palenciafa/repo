import React from 'react';
import '../../css/quiz_results.css';
import calendarIcon from '../../media/calendar.svg';
import summaryIcon from '../../media/graph.svg';
import correctIcon from '../../media/check.svg';
import incorrectIcon from '../../media/incorrect.svg';
import attemptsIcon from '../../media/retry copy.svg';

function StudentQuizResults() {
  return (
    <div id='student-result' className="container">
      <div className="quiz-wrapper">
        {/* <div className="image-container">
          <img src={quizImage} alt="Quiz" className="quiz-image" />
        </div> */}
        <div className="details-wrapper">
          <h2 className="quiz-title">Calculus Quiz 1</h2>
          <hr />
          <div className="date-wrapper">
            <img src={calendarIcon} alt="Calendar Icon" className="image icon" />
            <p className="due-date">Due Date: Sept 20 1:00 PM</p>
          </div>
          <p className="course-code">Section: BSCH2002</p>
        </div>
      </div>

      {/* Quiz Summary */}
      <div className="quiz-summary">
        <h3>
          <img src={summaryIcon} alt="Summary Icon" /> Quiz Summary
        </h3>

        {/* Progress Bar */}
        <p>Level of Accuracy</p>

        <div className="progress-border">
          <div className="progress-bar">
            <div className="progress" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>

      

      <div className="performance-status">
        <div className="title">Performance Status</div>

        <div className="status-grid">
          <div className="status-box correct-items">
            <img src={correctIcon} alt="Correct Items" className="status-icon" />
            correct items
          </div>
          <div className="status-box incorrect-items">
            <img src={incorrectIcon} alt="Incorrect Items" className="status-icon" />
            incorrect items
          </div>
          <div className="status-box attempts">
            <img src={attemptsIcon} alt="Attempts" className="status-icon" />
            attempts
          </div>
        </div>

        <div className="student-list">
          <table>
            <thead>
              <tr>
                <th>Attempt</th>
                <th>Score</th>
                <th>Submission Date</th>
                <th>Time Spent</th>
                <th>Accuracy</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>First</td>
                <td>85/100</td>
                <td>10/15/2024 11:00 PM</td>
                <td>1 hour</td>
                <td>85%</td>
                <td>Pass</td>
              </tr>
            </tbody>
          </table>
        </div>

      
      </div>
    </div>
  );
};

export default StudentQuizResults;