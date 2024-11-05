        import React, { useState, useEffect } from 'react';
        import PropTypes from 'prop-types';
        import '../../css/InstructorQuizzes.css';
        import { FaFilter } from 'react-icons/fa'; 
        import calendarIcon from '../../media/calendar.svg';
        import StudentQuizOverview from '../../component/StudentQuizOverview'; 
        import StudentQuizResults from './StudentQuizResults'; 
        import 'react-toastify/dist/ReactToastify.css';
        import backIcon from '../../media/back.svg';
        
        const ClassQuizzes = ({ selectedClass, onBack, onQuizUpdateSuccess }) => {
            const [quizzes, setQuizzes] = useState([]);
            const [dropdownVisible, setDropdownVisible] = useState(false);
            const [selectedQuiz, setSelectedQuiz] = useState(null);
            const [filter, setFilter] = useState('Upcoming'); 
            const [showQuizResults, setShowQuizResults] = useState(false); 
            const [quizResultsData, setQuizResultsData] = useState(null); 
            const [allSubmissions, setAllSubmissions] = useState([]); 
            const [selectedQuizData, setSelectedQuizData] = useState(null);
            const [data, setData] = useState(null); // New state for data
        
            const fetchQuizzes = async () => {
                try {
                    const response = await fetch(`http://localhost:4000/api/quizzes?class_id=${selectedClass._id}`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    });
                    const data = await response.json();
                    if (response.ok) {
                        const quizzesWithSubmissionStatus = await Promise.all(data.map(async (quiz) => {
                            const submissionResponse = await fetch(`http://localhost:4000/api/submissions/quiz/${quiz._id}/check-submission?userEmail=${localStorage.getItem('userEmail')}`, {
                                headers: {
                                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                                },
                            });
                            const submissionData = await submissionResponse.json();
                            return {
                                ...quiz,
                                hasSubmitted: submissionData.hasSubmitted,
                                attempts: submissionData.attempts,
                                attemptsAllowed: quiz.attemptsAllowed, 
                            };
                        }));
                        setQuizzes(quizzesWithSubmissionStatus);
                    } else {
                        console.error('Error fetching quizzes:', data.error);
                    }
                } catch (error) {
                    console.error('Error fetching quizzes:', error);
                }
            };
        
            useEffect(() => {
                fetchQuizzes();
                const intervalId = setInterval(fetchQuizzes, 60000); 
        
                return () => clearInterval(intervalId); 
            }, [selectedClass]);
        
            const toggleDropdown = () => {
                setDropdownVisible(!dropdownVisible);
            };  
        
            const handleQuizClick = async (quiz) => {
                const userEmail = localStorage.getItem('userEmail');
                if (!userEmail) {
                    alert('User email not found. Please log in again.');
                    return;
                }
            
                try {
                    const response = await fetch(`http://localhost:4000/api/submissions/quiz/${quiz._id}/check-submission?userEmail=${userEmail}`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    });
                    const data = await response.json();
                    setData(data); // Set data state
                    if (response.ok) {
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
            
                        if (data.hasSubmitted) {
                            setQuizResultsData(quizData); // Set quizResultsData to quizData
                            setShowQuizResults(true); 
                        } else {
                            setSelectedQuiz(quiz);
                        }
                    } else {
                        console.error('Error checking submission:', data.error);
                    }
                } catch (error) {
                    console.error('Error checking submission:', error);
                }
            };
        
            const handleRetakeQuiz = () => {
                setShowQuizResults(false);
                setSelectedQuiz(selectedQuizData);
            };
        
            const handleQuizUpdate = (updatedQuiz) => {
                setQuizzes((prevQuizzes) =>
                    prevQuizzes.map((quiz) => (quiz._id === updatedQuiz._id ? updatedQuiz : quiz))
                );
                setSelectedQuiz(null);
                fetchQuizzes();
                if (onQuizUpdateSuccess) {
                    onQuizUpdateSuccess(updatedQuiz); 
                }
            };
        
            const handleBackToQuizList = () => {
                setShowQuizResults(false);
                setSelectedQuiz(null);
            };
        
            const handleStartQuiz = () => {
                setShowQuizResults(false);
                setSelectedQuiz(selectedQuizData);
            };
        
            const filteredQuizzes = quizzes.filter((quiz) => {
                const now = new Date();
                const deadline = new Date(`${quiz.deadline.date}T${quiz.deadline.time}`);
                if (filter === 'Upcoming') {
                    return deadline > now && !quiz.hasSubmitted;
                } else if (filter === 'Past Due') {
                    return deadline < now && !quiz.hasSubmitted;
                } else if (filter === 'Completed') {
                    return quiz.hasSubmitted;
                }
                return true;
            });
        
            useEffect(() => {
                const completedQuizzes = quizzes.filter(quiz => quiz.hasSubmitted);
                completedQuizzes.forEach(quiz => {
                    // console.log(`Quiz: ${quiz.quiz_title}, Attempts: ${quiz.attempts}`);
                });
            }, [quizzes]);
        
            if (showQuizResults && quizResultsData) {
                return (
                    <StudentQuizResults
                        quizData={quizResultsData}
                        allSubmissions={allSubmissions}
                        data={data}
                        userEmail={localStorage.getItem('userEmail')}
                        onRetakeQuiz={handleRetakeQuiz}
                        onBack={handleBackToQuizList}
                        onStartQuiz={handleStartQuiz}
                    />
                );
            }
        
            if (selectedQuiz && selectedQuiz._id) {
                return (
                    <StudentQuizOverview 
                        quiz={selectedQuiz} 
                        onBackClick={() => setSelectedQuiz(null)} 
                        onQuizUpdate={handleQuizUpdate}
                    />
                );
            }
        
            return (
                <div id='instructor-quiz'>
                    <header className="header">
                        <button className="back-btn" onClick={onBack}>          
                            <img src={backIcon} alt="Back Icon" />
                        </button>
                        <button className="button" onClick={() => setFilter('Upcoming')}>Upcoming</button>
                        <button className="button" onClick={() => setFilter('Past Due')}>Past Due</button>
                        <button className="button" onClick={() => setFilter('Completed')}>Complete</button>
                    </header>
        
                    <hr className="divider" />
        
                    <div className="quiz-list">
                        {filteredQuizzes.map((quiz, index) => (
                            <button className="student-quiz-card" key={index} onClick={() => handleQuizClick(quiz)}>
                                <div className="class-initials-card">
                                    {selectedClass.name.split(' ').map(word => word[0]).join('')}
                                </div>
                                <div className="quiz-wrapper">
                                    <div className="details-wrapper">
                                        <h2 className="quiz-title">{quiz.quiz_title}</h2>
                                        <div className="student-card-divider" />
                                        {quiz.deadline && (
                                            <div className="date-wrapper">
                                                <img src={calendarIcon} alt="Calendar Icon" className="calendar-image icon" />
                                                <p className="due-date">
                                                    Due Date: {new Date(`${quiz.deadline.date}T${quiz.deadline.time}`).toLocaleString('en-US', {
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: 'numeric',
                                                        minute: 'numeric',
                                                        hour12: true
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                        <p className="course-code">Description: {selectedClass.description}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            );
        };
        
        ClassQuizzes.propTypes = {
            selectedClass: PropTypes.object.isRequired,
            onBack: PropTypes.func.isRequired,
            onQuizUpdateSuccess: PropTypes.func,
        };
        
        export default ClassQuizzes;