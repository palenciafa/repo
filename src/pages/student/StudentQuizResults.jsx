import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../css/quiz_results.css';
import calendarIcon from '../../media/calendar.svg';
import summaryIcon from '../../media/graph.svg';
import correctIcon from '../../media/check.svg';
import incorrectIcon from '../../media/incorrect.svg';
import attemptsIcon from '../../media/retry copy.svg';
import backIcon from '../../media/back.svg';

function StudentQuizResults({ quizData, allSubmissions, data, userEmail, onRetakeQuiz, onBack }) {
  const [selectedAttempt, setSelectedAttempt] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [hasRetakenQuiz, setHasRetakenQuiz] = useState(false);
  const [unfinishedAttempt, setUnfinishedAttempt] = useState(false);

  useEffect(() => {
    const retakenQuiz = localStorage.getItem('hasRetakenQuiz') === 'true';
    setHasRetakenQuiz(retakenQuiz);
  }, []);

  if (!quizData) {
    return <div>Loading...</div>;
  }

  const dueDate = quizData.deadline ? new Date(quizData.deadline.date + 'T' + quizData.deadline.time).toLocaleString() : 'N/A';
  const description = quizData.quiz_desc || 'No description available';

  const userSubmissions = allSubmissions.filter(submission => submission.userEmail === userEmail);
  const attempts = userSubmissions.length || 1;
  const totalScore = quizData.questions.reduce((sum, question) => sum + question.points, 0);
  const passingPoints = (quizData.passingScore / 100) * totalScore;

  const submissionsWithAttempts = userSubmissions.map((submission, index) => ({
    ...submission,
    attempt: submission.attempt || index + 1,
  }));

  const filteredSubmissions = selectedAttempt === 'all'
    ? submissionsWithAttempts
    : submissionsWithAttempts.filter(submission => submission.attempt === parseInt(selectedAttempt));

  const canRetakeQuiz = quizData.attemptsAllowed > attempts;

  const handleRetakeQuiz = () => {
    console.log('handleRetakeQuiz called');
    console.log('hasRetakenQuiz:', hasRetakenQuiz);
    if (hasRetakenQuiz && canRetakeQuiz) {
      console.log('Opening modal for retake confirmation');
      setUnfinishedAttempt(false);
      setShowModal(true);
    } else if (hasRetakenQuiz) {
      console.log('Opening modal for unfinished attempt');
      setUnfinishedAttempt(true);
      setShowModal(true);
    } else {
      console.log('Opening modal');
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    console.log('handleCloseModal called');
    setShowModal(false);
  };

  const handleConfirmRetake = () => {
    console.log('handleConfirmRetake called');
    setShowModal(false);
    setHasRetakenQuiz(true);
    localStorage.setItem('hasRetakenQuiz', 'true');
    console.log('hasRetakenQuiz set to true');
    onRetakeQuiz();
  };

  const handleContinueQuiz = () => {
    console.log('handleContinueQuiz called');
    setShowModal(false);
    onRetakeQuiz();
  };

  return (
    <>
      <header className="header-back">
        <button className="back-btn" onClick={onBack}>
          <img src={backIcon} alt="Back Icon" />
        </button>
      </header>
      <div id='student-result' className="result-container">
        <div className="quiz-wrapper">
          <div className="details-wrapper">
            <h2 className="quiz-title">{quizData.quiz_title}</h2>
            <hr />
            <div className="date-wrapper">
              <img src={calendarIcon} alt="Calendar Icon" className="image icon" />
              <p className="due-date">Due Date - {dueDate}</p>
            </div>
            <p className="course-code">Description - {description}</p>
            <p className="attempts-info">
              Attempts Done - {attempts} 
            </p>
            <p  className="attempts-info"> Attempts Allowed - {quizData.attemptsAllowed}</p>
          </div>
        </div>

        <div className="quiz-summary">
          <h3 className='acurracy-text'>
            <img src={summaryIcon} alt="Summary Icon" className='summary-icon'/> Quiz Summary
          </h3>
          <p className='acurracy-text'>Level of Accuracy</p>
          {filteredSubmissions.map((submission, index) => {
            const correctAnswers = Object.entries(submission.answers).filter(([questionIndex, answer]) => {
              const question = quizData.questions[questionIndex];
              return question && question.correct_answer === answer;
            }).length;
            const totalQuestions = quizData.questions.length;
            const accuracy = (correctAnswers / totalQuestions) * 100;

            return (
              <div key={index} className="progress-border">
                <div className="progress-bar">
                  <div className="progress" style={{ width: `${accuracy}%`, backgroundColor: '#DA88F9' }}>
                    <span className="progress-text">Attempt {submission.attempt}: {accuracy.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <h3 className='title'>Performance Status</h3>
        <div className="attempt-selector">
          <label htmlFor="attempt-select">Select Attempt:</label>
          <select
            id="attempt-select"
            value={selectedAttempt}
            onChange={(e) => setSelectedAttempt(e.target.value)}
          >
            <option value="all">All</option>
            {[...Array(attempts)].map((_, index) => (
              <option key={index} value={index + 1}>
                Attempt {index + 1}
              </option>
            ))}
          </select>
        </div>

        {filteredSubmissions.map((submission, index) => {
          const correctAnswers = Object.entries(submission.answers).filter(([questionIndex, answer]) => {
            const question = quizData.questions[questionIndex];
            return question && question.correct_answer === answer;
          }).length;
          const totalQuestions = quizData.questions.length;
          const incorrectAnswers = totalQuestions - correctAnswers;
          const accuracy = (correctAnswers / totalQuestions) * 100;
          const feedback = submission.score >= passingPoints ? 'Passed' : 'Failed';

          return (
            <div className='performance-status' key={index}>
              <div className="status-grid">
                <div className="status-box correct-items">
                  <img src={correctIcon} alt="Correct Items" className="status-icon" />
                  <p>Correct items: {correctAnswers}</p>
                </div>
                <div className="status-box incorrect-items">
                  <img src={incorrectIcon} alt="Incorrect Items" className="status-icon" />
                  <p>Incorrect items: {incorrectAnswers}</p>
                </div>
                <div className="status-box attempts">
                  <p>Attempt {submission.attempt}</p>
                  <img src={attemptsIcon} alt="Attempts" className="status-icon" />
                </div>
              </div>

              <div className="student-list">
                <table>
                  <thead>
                    <tr>
                      <th>Attempt</th>
                      <th>Score</th>
                      <th>Submission Date</th>
                      <th>Accuracy</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{submission.attempt}</td>
                      <td>{submission.score}</td>
                      <td>{new Date(submission.submittedAt).toLocaleString()}</td>
                      <td>{accuracy.toFixed(2)}%</td>
                      <td>{feedback}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {canRetakeQuiz && (
          <button className="retake-quiz-btn" onClick={handleRetakeQuiz}>
            Retake Quiz
          </button>
        )}

        <Modal show={showModal} onHide={handleCloseModal} className="retake-quiz-modal">
          <Modal.Header closeButton>
            <Modal.Title>Retake Quiz</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Note: Once started, the timer cannot be paused.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmRetake}>
              Retake Quiz
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}

StudentQuizResults.propTypes = {
  quizData: PropTypes.object.isRequired,
  allSubmissions: PropTypes.array.isRequired,
  data: PropTypes.object.isRequired,
  userEmail: PropTypes.string.isRequired,
  onRetakeQuiz: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default StudentQuizResults;