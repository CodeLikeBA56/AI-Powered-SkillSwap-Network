import React from 'react'
import './SetOfferedAndDesiredSkills.css';
import { useUserProfile } from '../../context/UserProfileProvider';
import UpdateSkillsForm from '../../components/Profile-Module/UpdateSkillsForm/UpdateSkillsForm';

const SetOfferedAndDesiredSkills = () => {
    const { userInfo } = useUserProfile();

    return (
        <div className='skills-set-form'>
            <UpdateSkillsForm title={"Offered Skills"} skills={userInfo?.offeredSkills} fieldToUpdate="offeredSkills" apiPath={"api/user-profile/update-offered-skills"} />
            <UpdateSkillsForm title={"Desired Skills"} skills={userInfo?.desiredSkills} fieldToUpdate="desiredSkills" apiPath={"api/user-profile/update-desired-skills"} />
        </div>
    );
}

export default SetOfferedAndDesiredSkills;