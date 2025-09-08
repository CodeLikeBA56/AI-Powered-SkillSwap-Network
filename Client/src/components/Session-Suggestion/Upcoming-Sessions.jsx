import './Upcoming-Sessions.css';
import Image from '../../assets/No-Profile.webp';
import React, { useState, useEffect } from 'react';
import truncateTitle from '../../services/Strings';
import { useUserSessions } from '../../context/UserSessionsProvider';
import { useRecommendation } from '../../context/RecommendationProvider';

const UpcomingSessions = () => {
    const { suggestedSessions } = useRecommendation();
    const { redirectToSession } = useUserSessions();
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);

    const formatToDateAndTime = (dateString) => {
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric', hour12: true };
        return date.toLocaleString('en-US', options).replace(',', '');
    };

    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!suggestedSessions.length) return

    return (
        <div className='sessions-container'>
            <h4 className='suggestion-title'>Suggested Sessions</h4>
            <ul className='sessions-list'>
                {
                    0 !== suggestedSessions.length && suggestedSessions.map((session, index) => (
                        <li className='session-item' key={index}>
                            <div className='session-detail'>   
                                <img 
                                    src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${session?.host?.profilePicture}`}
                                    className="avatar-img"
                                    onError={(e) => (e.target.src = Image)}
                                />
                                <div className='session-info'>
                                    <h4
                                        className='session-title'
                                        title={session.title}
                                    >
                                        {
                                            screenWidth >= 1150
                                                ? session.title
                                                : truncateTitle(session.title, screenWidth >= 1024 ? 16 : 12) // Adjusted truncation
                                        }
                                    </h4>
                                    <p className='session-time'>
                                        {formatToDateAndTime(session.startTime)}
                                    </p>
                                </div>
                            </div>

                            <button type='button' style={{background: 'none'}} onClick={() => redirectToSession(session, "/dashboard", "Dashboard")}>
                                <span className="material-symbols-outlined" id='info-icon'>info</span>
                            </button>
                        </li>
                    ))
                }
            </ul>
        </div>
    );
};

export default UpcomingSessions;