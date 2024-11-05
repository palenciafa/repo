import React, { useState, useEffect } from "react";
import { Modal, Button } from 'react-bootstrap';
import '../../css/Classes.css';
import personIcon from '../../media/person-icon.svg';
import '../../css/JoinClasses.css';

const JoinClass = () => {
    const [registeredClasses, setRegisteredClasses] = useState([]); // Registered private classes
    const [error, setError] = useState('');
    const [classCode, setClassCode] = useState(''); // State for class code input
    const [unregisteredClasses, setUnregisteredClasses] = useState([]); // Unregistered public classes
    const [hoveredClass, setHoveredClass] = useState(null); // State for hovered class
    const [showModal, setShowModal] = useState(false); // State for modal visibility
    const [classToJoin, setClassToJoin] = useState(null); // State for class to join

    // Fetch unregistered public classes
    const fetchUnregisteredClasses = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/public-classes/unregistered', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                setUnregisteredClasses(data.classes);
            } else {
                setError(data.error || 'Error fetching unregistered public classes');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('An error occurred while fetching unregistered public classes.');
        }
    };

    useEffect(() => {
        fetchUnregisteredClasses();
    }, []);

    const handleRegisterClass = async () => {
        if (!classCode) {
            setError('Please enter a class code.');
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/api/register-private-class', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ classCode }),
            });

            const data = await response.json();
            if (data.success) {
                // Check if the class is already registered
                const isAlreadyRegistered = registeredClasses.some(
                    (registeredClass) => registeredClass.id === data.class.id
                );

                if (!isAlreadyRegistered) {
                    setRegisteredClasses((prev) => [...prev, data.class]); // Add the newly registered class
                }

                setClassCode(''); // Clear the input field
                setError(''); // Clear any previous errors
                fetchUnregisteredClasses(); // Refresh the list of unregistered classes
            } else {
                setError(data.error || 'Error registering for the class');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('An error occurred while registering for the class.');
        }
    };

    const handleJoinClass = (classItem) => {
        console.log('Class to join:', classItem); // Debugging line
        setClassToJoin(classItem);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setClassToJoin(null);
    };

    const handleConfirmJoin = async () => {
        if (!classToJoin) {
            setError('No class selected to join.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/api/join-public-class/${classToJoin._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                setRegisteredClasses((prev) => [...prev, data.class]); // Add the newly joined class
                fetchUnregisteredClasses(); // Refresh the list of unregistered classes
                handleCloseModal(); // Close the modal after joining the class
            } else {
                setError(data.error || 'Error joining the class');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('An error occurred while joining the class.');
        }
    };

    const handleCardClick = (classItem) => {
        // Handle card click logic here
        console.log('Class clicked:', classItem);
    };

    const getInitials = (name) => {
        return name.split(' ').map(word => word[0]).join('');
    };

    const displayedClasses = unregisteredClasses;

    return (
        <div id="classes" className="main-content">
            <div className="join-class">
                <h2 className="colored regtext">Enter Class Code to Join for Private Class</h2>
                <div className="input-group">
                    <input
                        type="text"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value)}
                        placeholder="Enter class code"
                    />
                    <button onClick={handleRegisterClass}>Join</button>
                </div>
            </div>

            <div className="section">
                <h2 className="colored">Public Classes Available</h2>
                {displayedClasses.length === 0 && <p className='no'>No classes available.</p>}
                <div className="grid">
                    {displayedClasses.map((classItem, index) => (
                        <div
                            className="card"
                            key={index}
                            onMouseEnter={() => setHoveredClass(classItem.id)}
                            onMouseLeave={() => setHoveredClass(null)}
                            onClick={() => handleCardClick(classItem)}
                        >
                            <div className="card-image-container">
                                {getInitials(classItem.name)}
                            </div>
                            <div className="card-content">
                                <h3 className="card-title">{classItem.name}</h3>
                                <hr />
                                <p className='card-description'>{classItem.createdBy.fname} {classItem.createdBy.lname}</p>
                                <p className="card-text">
                                    <img
                                        src={personIcon}
                                        alt="Students Icon"
                                        className={`icon-image ${hoveredClass === classItem.id ? 'hidden' : ''}`}
                                    />
                                    {hoveredClass === classItem.id ? (
                                        <button className="join-class-button" onClick={() => handleJoinClass(classItem)}>Join Class</button>
                                    ) : (
                                        `${classItem.students.length} Students Enrolled`
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Join Class</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to join the class {classToJoin?.name}?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleConfirmJoin}>
                        Join
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default JoinClass;