// Client: SkillSetForm.jsx
import './SkillSetForm.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios.js';
import SkillList from '../SkillList/SkillList.jsx';
import NoProfilePic from '../../assets/No-Profile.webp';
import skillsDataSet from '../../../Data/Skills-Dataset.js';
import { useAlertContext } from '../../context/AlertContext.jsx';
import { useUserProfile } from '../../context/UserProfileProvider.jsx';

const SkillSetForm = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlertContext();
  const { userInfo, setUserInfo } = useUserProfile();

  if(userInfo?.desiredSkills?.length > 0 || userInfo?.offeredSkills?.length > 0) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <h2>Unauthorized way to reach this page.</h2>
      </div>
    )
  }

  const [disable, setDisable] = useState(false);
  
  const [avatar, setAvatar] = useState(userInfo?.profilePicture);
  const [offeredSkill, setOfferedSkill] = useState('');
  const [desiredSkill, setDesiredSkill] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [offeredSkills, setOfferedSkills] = useState(new Set(userInfo?.offeredSkills || []));
  const [desiredSkills, setDesiredSkills] = useState(new Set(userInfo?.desiredSkills || []));

  const handleProfileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const verifySkill = (skill, skills) => {
    return skill.trim() && skillsDataSet.includes(skill) && !skills.has(skill);
  };

  const addOfferedSkill = () => {
    if (verifySkill(offeredSkill, offeredSkills)) {
      setOfferedSkills(new Set([...offeredSkills, offeredSkill]));
      setOfferedSkill('');
    }
  };

  const addDesiredSkill = () => {
    if (verifySkill(desiredSkill, desiredSkills)) {
      setDesiredSkills(new Set([...desiredSkills, desiredSkill]));
      setDesiredSkill('');
    }
  };

  const removeOfferedSkill = (skill) => {
    const updatedSkills = new Set(offeredSkills);
    updatedSkills.delete(skill);
    setOfferedSkills(updatedSkills);
  };

  const removeDesiredSkill = (skill) => {
    const updatedSkills = new Set(desiredSkills);
    updatedSkills.delete(skill);
    setDesiredSkills(updatedSkills);
  };

  const handleSkillSetForm = async (event) => {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('offeredSkills', JSON.stringify(Array.from(offeredSkills)));
    formData.append('desiredSkills', JSON.stringify(Array.from(desiredSkills)));
    formData.append('profilePicture', selectedFile);
    
    setDisable(true);
    
    try {
      await axiosInstance.put('api/user-profile/set-user-skills', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUserInfo(prev => (
        { ...prev, offeredSkills: Array.from(offeredSkills), desiredSkills: Array.from(desiredSkills) }
      ));

      navigate('/dashboard');
    } catch (error) {
      console.log("error", error);
      setDisable(false);
    }
  };

  return (
    <div className='skillset-modal'>
      <form className='initial-user-info' onSubmit={handleSkillSetForm}>
        <div className='profile-section'>
          <img className='user-profile' src={avatar} alt='User Profile' />
          <label className='profile-upload-btn' htmlFor='profile-change-input'>
            <span className="material-symbols-outlined">edit</span>
            <input 
              type='file'
              name="profilePicture"
              // accept='image/*' 
              id='profile-change-input' 
              onChange={handleProfileChange} 
              hidden 
            />
          </label>
        </div>
        <h2 className='user-name'>{userInfo?.username}</h2>
        
        <SkillList 
          title="Offered Skills" 
          skills={Array.from(offeredSkills)} 
          removeSkill={removeOfferedSkill} 
          allowDeletionRights 
        />
        <datalist id="skill-suggestions">
          {skillsDataSet.map((skill, index) => (
            <option key={index} value={skill} />
          ))}
        </datalist>
        <div className='input-box'>
          <input 
            type="text" 
            value={offeredSkill} 
            onChange={(e) => setOfferedSkill(e.target.value)}
            list="skill-suggestions"
          />
          <label>Offered Skill</label>
          <button type="button" onClick={addOfferedSkill}>
            <span className="material-symbols-outlined">add_circle</span>
          </button>
        </div>

        <SkillList 
          title="Desired Skills" 
          skills={Array.from(desiredSkills)} 
          removeSkill={removeDesiredSkill} 
          allowDeletionRights 
        />
        <div className='input-box'>
          <input 
            type="text" 
            value={desiredSkill} 
            onChange={(e) => setDesiredSkill(e.target.value)}
            list="skill-suggestions"
          />
          <label>Desired Skill</label>
          <button type="button" onClick={addDesiredSkill}>
            <span className="material-symbols-outlined">add_circle</span>
          </button>
        </div>
        
        <button type='submit' className='submit-btn' disabled={disable}>
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default SkillSetForm;