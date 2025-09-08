import './UpdateSkillsForm.css';
import axiosInstance from '../../../api/axios';
import React, { useEffect, useState } from 'react';
import SkillsList from "../../../../Data/Skills-Dataset";
import { useAlertContext } from '../../../context/AlertContext';
import { useUserProfile } from '../../../context/UserProfileProvider';

const UpdateSkillsForm = ({ title, skills, apiPath, fieldToUpdate }) => {
    const { setUserInfo } = useUserProfile();
    const { showAlert } = useAlertContext();

    const [isEditing, setIsEditing] = useState(false);
    const [filterByWord, setFilterByWord] = useState("");
    const [updatedSkills, setUpdatedSkills] = useState([...skills]);

    useEffect(() => {
        if (!isEditing) {
            setUpdatedSkills([...skills]);
        }
    }, [isEditing, skills]);

    const handleAddSkill = (skill) => {
        if (!updatedSkills.includes(skill)) {
            setUpdatedSkills([...updatedSkills, skill]);
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setUpdatedSkills(prev => prev.filter(skill => skill !== skillToRemove));
    };

    const handleSaveChanges = async () => {
        const original = [...skills].sort().join(',');
        const updated = [...updatedSkills].sort().join(',');

        if (original === updated) {
            showAlert("info", "No changes detected in skills.");
            setIsEditing(false);
            return;
        }

        try {
            const response = await axiosInstance.put(apiPath, { [fieldToUpdate]: updatedSkills, });

            if (response.status === 200) {
                const { type, message } = response.data;
                setUserInfo(prev => ({ ...prev, [fieldToUpdate]: updatedSkills }));
                showAlert(type, message);
                setIsEditing(false);
            } else {
                console.error("Failed to update skills");
            }
        } catch (err) {
            setIsEditing(false);
        }
    };

    const filteredSkills = SkillsList.filter(skill => {
        const lower = filterByWord.toLowerCase();
        return skill.toLowerCase().includes(lower) && !updatedSkills.includes(skill);
    });

    return (
        <div className='skills-update-form-container'>
            <header>{title}</header>
            <ul className='skills-list'>
                {
                    updatedSkills.map((skill, index) => (
                        <li key={index}>
                            <span className='skill-name'>{skill}</span>
                            {
                                isEditing &&
                                <button type='button' onClick={() => handleRemoveSkill(skill)}>
                                    <span className='material-symbols-outlined'>close</span>
                                </button>
                            }
                        </li>
                    ))
                }
            </ul>

            {
                isEditing && (
                    <>
                        <input 
                            required
                            type='text' 
                            value={filterByWord}
                            className='skills-input'
                            placeholder='Type to search skills...'
                            onChange={(e) => setFilterByWord(e.target.value)}
                        />
                        <ul className='skills-suggestion-list'>
                            {
                                filteredSkills.map((skill, index) => (
                                    <li key={index} onClick={() => handleAddSkill(skill)}>
                                        <span className='skill-name'>{skill}</span>
                                        <input type='checkbox' checked={updatedSkills.includes(skill)} readOnly />
                                    </li>
                                ))
                            }
                        </ul>
                    </>
                )
            }

            <div className="button-container">
                {
                    isEditing ? (
                        <>
                            <button type="button" onClick={() => setIsEditing(false)}>Reset Skills</button>
                            <button type="button" onClick={handleSaveChanges}>Save Changes</button>
                        </>
                    ) : (
                        <button type="button" onClick={() => setIsEditing(true)}>Edit {title}</button>
                    )
                }
            </div>
        </div>
    );
};

export default UpdateSkillsForm;