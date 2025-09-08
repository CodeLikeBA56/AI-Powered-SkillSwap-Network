import './Session-Settings.css';
import { useSettingContext } from '../../context/SettingContext';
import { useUserProfile } from '../../context/UserProfileProvider';

const AccountSettings = () => {
    const { userInfo } = useUserProfile();
    const { isDarkMode, toggleTheme } = useSettingContext();

    return (
        <div className="session-setting-container">
            <div className="two-column-grid">
                <div className="setting-option-wrapper">
                    <div className="setting-option">
                        <span className="option-title">Dark Mode</span>
                        <input 
                            type="checkbox"
                            hidden
                            id='isDarkMode'
                            checked={isDarkMode} 
                            onChange={toggleTheme} 
                        />
                        <label htmlFor='isDarkMode'></label>
                    </div>
                    {/* <span className="option-description">Automatically turn off camera when host starts recording</span> */}
                </div>

                {/* <div className="setting-option-wrapper">
                    <div className="setting-option">
                        <span className="option-title">Push Notifications</span>
                        <input 
                            type="checkbox"
                            hidden
                            id='sendNotifications'
                            checked={false}
                            onChange={() => 1} 
                        />
                        <label htmlFor='sendNotifications'></label>
                    </div>
                    <span className="option-description">Receive notifications for chat messages during a session</span>
                </div> */}
            </div>
        </div>
    );
};

export default AccountSettings;