    import React, { useState, useEffect, useContext } from 'react';
    import PropTypes from 'prop-types';
    import { FaClock } from 'react-icons/fa';
    import { Modal, Button } from 'react-bootstrap';
    import { useNavigate } from 'react-router-dom';
    import axios from 'axios';
    import backIcon from '../media/back.svg';
    import { TimerContext } from '../component/TimerContext';
    import StudentQuizResults from '../pages/student/StudentQuizResults';
    
    const StudentQuizOverview = ({ quiz, onBackClick }) => {
      const navigate = useNavigate();
      const quizId = quiz._id;
      const [quizStarted, setQuizStarted] = useState(false);
      const [userName, setUserName] = useState('');
      const [userEmail, setUserEmail] = useState('');
      const [loading, setLoading] = useState(true);
      const [showModal, setShowModal] = useState(false);
      const [answers, setAnswers] = useState({});
      const [score, setScore] = useState(0);
    
      // FOR REDIRECTING TO RESULTS PAGE
      const [showResults, setShowResults] = useState(false); // State to manage showing results
      const [submissions, setSubmissions] = useState([]); // State to store submissions
      const [data, setData] = useState(null); // State to store data
      const [allSubmissions, setAllSubmissions] = useState([]); // State to store all submissions
      const [selectedQuizData, setSelectedQuizData] = useState(null); // State to store selected quiz data
      const [quizResultsData, setQuizResultsData] = useState(null); // State to store quiz results data
      const [selectedQuiz, setSelectedQuiz] = useState(null); // State to store selected quiz
      const { timers, startTimer, stopTimer } = useContext(TimerContext); // Use TimerContext
    
      // New states for retake quiz functionality
      const [hasRetakenQuiz, setHasRetakenQuiz] = useState(false);
      const [unfinishedAttempt, setUnfinishedAttempt] = useState(false);
    
      useEffect(() => {
        const fetchUserName = async () => {
          try {
            const response = await fetch('http://localhost:4000/api/user', {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            });
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            const data = await response.json();
            // console.log('Fetched User Data:', data)
            setUserName(data.user.fname);
            setUserEmail(data.user.email);
            const uniqueKey = `quizStarted_${data.user.email}_${quizId}`;
            const uniqueTimeKey = `remainingTime_${data.user.email}_${quizId}`;
            const storedQuizStarted = JSON.parse(localStorage.getItem(uniqueKey)) || false;
            const storedRemainingTime = JSON.parse(localStorage.getItem(uniqueTimeKey));
            setQuizStarted(storedQuizStarted);
            if (storedQuizStarted) {
              startTimer(quizId, storedRemainingTime !== null ? storedRemainingTime : quiz.timeLimit.hours * 3600 + quiz.timeLimit.minutes * 60 + quiz.timeLimit.seconds);
            }
          } catch (error) {
            console.error('Error fetching the student name:', error);
          } finally {
            setLoading(false);
          }
        };
    
        fetchUserName();
      }, [quizId, quiz.timeLimit, startTimer]);
    
      useEffect(() => {
        if (userEmail) {
          const uniqueKey = `quizStarted_${userEmail}_${quizId}`;
          localStorage.setItem(uniqueKey, JSON.stringify(quizStarted));
        }
      }, [quizStarted, quizId, userEmail]);
    
      const handleStartQuiz = () => {
        setShowModal(true);
      };
    
      const handleConfirmStart = () => {
        setQuizStarted(true);
        const initialTime = quiz.timeLimit.hours * 3600 + quiz.timeLimit.minutes * 60 + quiz.timeLimit.seconds;
        startTimer(quizId, initialTime);
        const uniqueTimeKey = `remainingTime_${userEmail}_${quizId}`;
        localStorage.setItem(uniqueTimeKey, JSON.stringify(initialTime));
        setShowModal(false);
      };
    
      const handleCloseModal = () => {
        setShowModal(false);
      };
    
      const handleChange = (questionIndex, choice) => {
        setAnswers({
          ...answers,
          [questionIndex]: choice,
        });
      };
    
      const handleBack = () => {
        onBackClick();
      };
    
      const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
      };
    
      const handleSubmit = async (event) => {
        event.preventDefault();
    
        // Validate responses
        const unansweredQuestions = quiz.questions.filter((_, index) => !answers.hasOwnProperty(index));
        if (unansweredQuestions.length > 0) {
          alert('Please answer all questions before submitting.');
          return;
        }
    
        // Calculate score
        let calculatedScore = 0;
        quiz.questions.forEach((question, index) => {
          if (answers[index] === question.correct_answer) {
            calculatedScore += question.points;
          }
        });
        setScore(calculatedScore);
    
        // Log the userEmail to ensure it is set correctly for debugging purposes
        console.log('Submitting quiz with userEmail:', userEmail);
    
        // Store or submit responses
        try {
          const response = await axios.post('http://localhost:4000/api/submissions/submit-quiz', {
            userEmail,
            quizId,
            answers,
            score: calculatedScore,
          });
          console.log('Quiz submitted successfully:', response.data);
          setSubmissions(response.data.submissions || []);
          setShowResults(true); // Show results after submission
    
          // Additional logic from handleQuizClick
          if (!userEmail) {
            alert('User email not found. Please log in again.');
            return;
          }
    
          const checkSubmissionResponse = await fetch(`http://localhost:4000/api/submissions/quiz/${quiz._id}/check-submission?userEmail=${userEmail}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          const checkSubmissionData = await checkSubmissionResponse.json();
          setData(checkSubmissionData);
    
          if (checkSubmissionResponse.ok) {
            const submissionsResponse = await fetch(`http://localhost:4000/api/submissions/quiz/${quiz._id}/submissions`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            });
            const submissionsData = await submissionsResponse.json();
            setAllSubmissions(submissionsData.submissions);
    
            const quizResponse = await fetch(`http://localhost:4000/api/quizzes/${quiz._id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            });
            const quizData = await quizResponse.json();
            setSelectedQuizData(quizData);
    
            if (checkSubmissionData.hasSubmitted) {
              setQuizResultsData(quizData);
              setShowResults(true);
            } else {
              setSelectedQuiz(quiz);
            }
          } else {
            console.error('Error checking submission:', checkSubmissionData.error);
          }
        } catch (error) {
          console.error('Error submitting quiz:', error.response ? error.response.data : error.message);
        }
      };
    
      const handleRetakeQuiz = () => {
        console.log('handleRetakeQuiz called');
        console.log('hasRetakenQuiz:', hasRetakenQuiz);
        if (hasRetakenQuiz) {
          console.log('Opening modal for unfinished attempt');
          setUnfinishedAttempt(true);
          setShowModal(true);
        } else {
          console.log('Opening modal');
          setShowModal(true);
        }
      };
    
      const handleStartQuizFromResults = () => {
        setShowResults(false);
        setQuizStarted(true);
      };
    
      if (showResults && quizResultsData) {
        return (
          <StudentQuizResults
            quizData={quizResultsData}
            allSubmissions={allSubmissions}
            data={{ attempts: allSubmissions.length }}
            userEmail={userEmail}
            onRetakeQuiz={handleRetakeQuiz}
            onBack={handleBack}
            onStartQuiz={handleStartQuizFromResults}
          />
        );
      }
    
      return (
        <div id="quiz-overview" className="container">
          {!quizStarted ? (
            <div className="start-section">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <>
                  <button onClick={handleBack} className="back-btn">
                    <img src={backIcon} alt="Back" />
                  </button>
                  <div className="title-container">
                    <div className="quiz-title-container">
                      <h2 className="quiz-title">{quiz.quiz_title}</h2>
                    </div>
                  </div>
                  <div className="content-container">
                    <p className="time-limit">
                      <FaClock />
                      {`${quiz.timeLimit.hours}h ${quiz.timeLimit.minutes}m ${quiz.timeLimit.seconds}`}
                    </p>
                    <p className="greeting">Hi {userName}, welcome to the quiz!</p>
                    <p className="reminder">
                      Reminder: This is a timed quiz. Once you start, you cannot pause the
                      timer. Your answers will be automatically submitted when the time is
                      up, so please make sure to submit your answers on time.
                    </p>
                    <button onClick={handleStartQuiz} className="start-btn">
                      Start Quiz
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <button onClick={handleBack} className="back-btn">
                <img src={backIcon} alt="Back" />
              </button>
              <div className="quiz-section">
                <h2>{quiz.quiz_title}</h2>
                <p className="time-remaining">
                  <FaClock style={{ marginRight: '5px' }} />
                  {formatTime(timers[quizId] || 0)}
                </p>
                <hr />
                <h3>{quiz.quiz_desc}</h3>
                <p>{quiz.quiz_instructions}</p>
              </div>
              <form onSubmit={handleSubmit}>
                {quiz.questions.map((question, index) => (
                  <div key={index} className="question-card">
                    <h3>{question.question}</h3>
                    <div className="options">
                      {question.choices.map((choice, choiceIndex) => (
                        <label key={choiceIndex} className="radio-label">
                          <input
                            type="radio"
                            name={`question${index}`}
                            value={choice}
                            onChange={() => handleChange(index, choice)}
                          />
                          <span>{choice}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button type="submit" className="submit-btn">
                  Submit
                </button>
              </form>
            </>
          )}
          <Modal show={showModal} onHide={handleCloseModal} className="retake-quiz-modal">
            <Modal.Header closeButton>
              <Modal.Title>Start Quiz</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Are you sure you want to start the quiz? Once started, the timer cannot be paused.
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmStart}>
                Start Quiz
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      );
    };
    
    StudentQuizOverview.propTypes = {
      quiz: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        quiz_title: PropTypes.string.isRequired,
        quiz_desc: PropTypes.string.isRequired,
        quiz_instructions: PropTypes.string.isRequired,
        timeLimit: PropTypes.shape({
          hours: PropTypes.number,
          minutes: PropTypes.number,
          seconds: PropTypes.number,
        }).isRequired,
        questions: PropTypes.arrayOf(
          PropTypes.shape({
            _id: PropTypes.string.isRequired,
            question: PropTypes.string.isRequired,
            choices: PropTypes.arrayOf(PropTypes.string).isRequired,
            correct_answer: PropTypes.string.isRequired,
            points: PropTypes.number.isRequired,
          })
        ).isRequired,
      }).isRequired,
      onBackClick: PropTypes.func.isRequired,
    };
    
    export default StudentQuizOverview;