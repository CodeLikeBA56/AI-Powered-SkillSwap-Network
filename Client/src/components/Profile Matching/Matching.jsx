import React from 'react';
import './Matching.css';

const ProfileCard = ({ profile }) => {
    // const navigate = useNavigate(); // Navigation hook

    // const handleProfileClick = () => {
    //     navigate(`/profile/${profile.name}`); // Navigate to profile page
    // };

    return (
        // onClick={handleProfileClick}
        <div className="profile" > 
            <img src={profile.image} alt={profile.name} />
            <div className="profile-info">
                <h2>{profile.name}</h2>
                <p>{profile.qualification}</p>

                {/* Offered Skills */}
                <div className="skills-section">
                    <h4>Offered Skills:</h4>
                    <div className="skills">
                        {profile.offered_skill.map((skill, index) => (
                            <span key={index} className="skill">{skill}</span>
                        ))}
                    </div>
                </div>

                {/* Desired Skills */}
                <div className="skills-section">
                    <h4>Desired Skills:</h4>
                    <div className="skills">
                        {profile.desired_skill.map((skill, index) => (
                            <span key={index} className="skill desired">{skill}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Matching = () => {
    const profiles = [
        {
            name: 'Kashif',
            qualification: 'Bachelor of Science',
            offered_skill: ['JavaScript', 'React', 'Node.js'],
            desired_skill: ['Machine Learning', 'Python', 'Data Science'],
            image: '/student.jpeg',
        },
        {
            name: 'Sameer',
            qualification: 'Master of Arts',
            offered_skill: ['Content Writing', 'SEO', 'Marketing'],
            desired_skill: ['Graphic Design', 'Social Media Management'],
            image: '/student.jpeg',
        }
    ];

    return (
        <div className="matching-container">
            <div className="profile-card">
                {/* Render Profiles */}
                {profiles.map((profile, index) => (
                    <ProfileCard key={index} profile={profile} />
                ))}
            </div>

            {/* Buttons Section */}
            <div className="actions">
                <button className="chat-btn">💬 Chat</button>
                <button className="session-btn">📅 Request for Session</button>
            </div>
        </div>
    );
};

export default Matching;
