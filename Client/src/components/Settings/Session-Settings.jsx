import './Session-Settings.css';
import { useSettingContext } from '../../context/SettingContext';
import { useUserProfile } from '../../context/UserProfileProvider';

const SessionSettings = () => {
    const { userInfo } = useUserProfile();
    const { saveUserPreferences } = useSettingContext();

    const handleToggleMuteOnJoin = () => {
        const payload = { 'muteOnJoin': !userInfo.preferences.muteOnJoin };
        saveUserPreferences(payload);
    }
    
    const handleToggleExitConfirmation = () => {
        const payload = { 'exitConfirmation': !userInfo.preferences.exitConfirmation };
        saveUserPreferences(payload);
    }

    const handleToggleStartWithCameraOff = () => {
        const payload = { 'startWithCameraOff': !userInfo.preferences.startWithCameraOff };
        saveUserPreferences(payload);
    }

    const handleToggleChatNotifications = () => {
        const payload = { 'chatNotifications': !userInfo.preferences.chatNotifications };
        saveUserPreferences(payload);
    }

    const handleToggleAutoTurnOffCameraOnRecord = () => {
        const payload = { 'autoTurnOffCameraOnRecord': !userInfo.preferences.autoTurnOffCameraOnRecord };
        saveUserPreferences(payload);
    }

    return (
        <div className="session-setting-container">
            <div className="two-column-grid">
                <div className="setting-option-wrapper">
                    <div className="setting-option">
                        <span className="option-title">Privacy During Screen Recording</span>
                        <input 
                            type="checkbox"
                            hidden
                            id='autoTurnOffCameraOnRecord'
                            checked={userInfo?.preferences?.autoTurnOffCameraOnRecord} 
                            onChange={handleToggleAutoTurnOffCameraOnRecord}
                        />
                        <label htmlFor='autoTurnOffCameraOnRecord'></label>
                    </div>
                    <span className="option-description">Automatically turn off camera when host starts recording</span>
                </div>

                <div className="setting-option-wrapper">
                    <div className="setting-option">
                        <span className="option-title">In-Session Chat Notifications</span>
                        <input 
                            type="checkbox" 
                            hidden
                            id='chatNotifications'
                            checked={userInfo?.preferences?.chatNotifications} 
                            onChange={handleToggleChatNotifications} 
                        />
                        <label htmlFor='chatNotifications'></label>
                    </div>
                    <span className="option-description">Receive notifications for chat messages during a session</span>
                </div>

                <div className="setting-option-wrapper">
                    <div className="setting-option">
                        <span className="option-title">Mute on session join</span>
                        <input 
                            type="checkbox"
                            hidden
                            id='muteOnJoin'
                            checked={userInfo?.preferences?.muteOnJoin} 
                            onChange={handleToggleMuteOnJoin} 
                        />
                        <label htmlFor='muteOnJoin'></label>
                    </div>
                    <span className="option-description">Mute microphone when joining a session</span>
                </div>
                
                <div className="setting-option-wrapper">
                    <div className="setting-option">
                        <span className="option-title">Start with Camera Off</span>
                        <input 
                            type="checkbox" 
                            hidden
                            id='startWithCameraOff'
                            checked={userInfo?.preferences?.startWithCameraOff} 
                            onChange={handleToggleStartWithCameraOff} 
                        />
                        <label htmlFor='startWithCameraOff'></label>
                    </div>
                    <span className="option-description">Automatically turn off the camera when joining a session</span>
                </div>

                <div className="setting-option-wrapper">
                    <div className="setting-option">
                        <span className="option-title">Exit Confirmation</span>
                        <input 
                            type="checkbox" 
                            hidden
                            id='exitConfirmation'
                            checked={userInfo?.preferences?.exitConfirmation} 
                            onChange={handleToggleExitConfirmation} 
                        />
                        <label htmlFor='exitConfirmation'></label>
                    </div>
                    <span className="option-description">Show a pop-up before leaving the session</span>
                </div>
            </div>
        </div>
    );
};

export default SessionSettings;