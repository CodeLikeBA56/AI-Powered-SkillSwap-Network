import './UpdateProfileForm.css';
import React, { useState } from 'react';
import axiosInstance from '../../api/axios';
import { useAlertContext } from "../../context/AlertContext";
import { useUserProfile } from "../../context/UserProfileProvider.jsx";

const UpdateProfileForm = () => {
  const { showAlert } = useAlertContext();
  const { userInfo, setUserInfo } = useUserProfile();
  
  const [isEditing, setIsEditing] = useState(false);

  const [bio, setBio] = useState(userInfo?.bio || "");
  const [email, setEmail] = useState(userInfo?.email || "");
  const [username, setUsername] = useState(userInfo?.username || "");
  const [gender, setGender] = useState(userInfo?.gender || "male");
  const [dateOfBirth, setDateOfBirth] = useState(
    userInfo?.dateOfBirth ? new Date(userInfo?.dateOfBirth).toISOString().slice(0, 10) : ""
  );
  
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!username || !email || !gender || !dateOfBirth) {
      showAlert("warning", "All fields are required.");
      return;
    }

    if (
      userInfo.username === username && 
      userInfo.gender === gender && 
      userInfo.bio === bio &&
      new Date(userInfo.dateOfBirth).toISOString().split("T")[0] === new Date(dateOfBirth).toISOString().split("T")[0]
    ) {
      showAlert("info", "No changes detected. Your profile information remains the same.");
      setIsEditing(false);
      return;
    }

    try {
      const user = { username, gender, dateOfBirth, bio }

      const response = await axiosInstance.patch(`api/user-profile/update-personal-information`, user);
      if (response.status === 200) {
        const { type, message, user } = response.data;
        showAlert(type, message);
        setIsEditing(false);
        setUserInfo(user);
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  };

  const resetChanges = () => {
    setIsEditing(false);
    setBio(userInfo.bio || "");
    setUsername(userInfo.username || "");
    setGender(userInfo.gender || "male");
    setDateOfBirth(
      userInfo.dateOfBirth ? new Date(userInfo.dateOfBirth).toISOString().slice(0, 10) : ""
    );    
  }
  
    return (
      <form className="update-profile-container" onSubmit={handleUpdateProfile}>
        <div className="two-column-grid">
          <div className="input-container">
            <label className="input-label">Username</label>
            <input
              type="text"
              className="input-field"
              disabled={!isEditing}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
  
          <div className="input-container">
            <label className="input-label">Email</label>
            <input
              type="text"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly
              disabled
            />
            <p className="input-message">
              Email can't be updated right now. In the future, you will be able to
              change it.
            </p>
          </div>
  
          <div className="input-container">
            <label className="input-label">Gender</label>
            <select
              className="input-field"
              disabled={!isEditing}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
  
          <div className="input-container">
            <label className="input-label">Date of Birth</label>
            <input
              type="date"
              className="input-field"
              disabled={!isEditing}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>
        </div>
  
        <div className="single-column-grid">
          <label className="input-label">Bio</label>
          <textarea
            className="textarea-field"
            value={bio}
            disabled={!isEditing}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
  
        <div className="button-container">
          {
            false === isEditing &&
            <button type="button" className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>

          }
          {
            true === isEditing &&
            <>
              <button type="button" className="edit-btn" onClick={resetChanges}>Discard Changes</button>
              <button type="submit" className="save-btn">Save Changes</button>
            </>
          }
        </div>
      </form>
    );
  };

export default UpdateProfileForm;