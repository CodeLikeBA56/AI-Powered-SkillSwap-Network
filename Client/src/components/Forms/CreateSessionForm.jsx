import './Form.css';
import { useState } from 'react';
import axiosInstance from '../../api/axios.js';
import { useAlertContext } from '../../context/AlertContext';
import { useUserSessions } from '../../context/UserSessionsProvider.jsx';

const CreateSessionForm = ({ closeModal }) => {
    const { showAlert } = useAlertContext();
    const { pushCreatedSession } = useUserSessions();

    const [sessionTitle, setSessionTitle] = useState('');
    const [sessionDescription, setSessionDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [startNow, setStartNow] = useState(false);
    const [sessionDuration, setSessionDuration] = useState('');
    const [hashtags, setHashtags] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formattedHashtags = hashtags.match(/#[A-Za-z0-9_]+/g) || [];

        const sessionData = {
            title: sessionTitle,
            description: sessionDescription,
            startTime: startNow ? new Date().toISOString() : startTime,
            duration: sessionDuration,
            isLive: startNow,
            hashtags: formattedHashtags,
            visibility: 'public',
        };

        try {
            const response = await axiosInstance.post('api/session/', sessionData);
            const { type, message, session } = response.data;
            showAlert(type, message);
            
            pushCreatedSession(session);

            setSessionTitle('');
            setSessionDescription('');
            setStartTime('');
            setSessionDuration('');
            setStartNow(false);
            setHashtags('');
        } catch (error) {
            showAlert('error', "An error occurred while uploading the session.");
        }
    };

    return (
        <div className="form-container">
            <header className='form-header'>
                <button className="modal-close-btn" onClick={() => {
                    document.querySelector('.modal-overlay').classList.remove('show');
                    setTimeout(() => closeModal(), 300);
                }}>
                    <span className='material-symbols-outlined'>close</span>
                </button>
                <h2 className="form-title">Create Session</h2>
                <button type='button' onClick={handleSubmit}>Create</button>
            </header>
            <h2 className='form-title'>Create Session</h2>
            <form onSubmit={handleSubmit}>
                <div className="input-box">
                    <input
                        type="text"
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        required
                    />
                    <label>Session Title</label>
                </div>

                <div className="input-box">
                    <textarea
                        value={sessionDescription}
                        onChange={(e) => setSessionDescription(e.target.value)}
                        // onInput={(e) => {
                        //     e.target.style.height = "auto"
                        //     e.target.style.height = e.target.scrollHeight + "px";
                        // }}
                        required
                    ></textarea>
                    <label>Session Description</label>
                </div>

                <div className='session-input-box'>
                    <input
                        type="checkbox"
                        id='start-now'
                        checked={startNow}
                        onChange={(e) => setStartNow(e.target.checked)}
                    />
                    <label htmlFor='start-now'>Start Now</label>
                    
                    <select
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(e.target.value)}
                        required
                    >
                        <option value="" disabled>Select Duration</option>
                        <option value="15">15 mins</option>
                        <option value="30">30 mins</option>
                        <option value="45">45 mins</option>
                        <option value="60">1 hour</option>
                    </select>
                </div>

                <div className={`start-time-container ${startNow ? 'hidden' : 'visible'}`}>
                    <div className="input-box">
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required={!startNow}
                        />
                        <label>Start Time</label>
                    </div>
                </div>

                <div className="input-box">
                    <input
                        type="text"
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        required
                    />
                    <label>Hashtags</label>
                </div>

                <button type="submit" className="btn session-btn">Create Session</button>
            </form>
        </div>
    );
};

export default CreateSessionForm;