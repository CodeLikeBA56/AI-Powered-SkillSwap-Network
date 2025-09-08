import './ChangeNicknameForm.css';
import React, { useState } from 'react'
import { useChat } from '../../../context/ChatProvider';

const ChangeNicknameForm = ({ groupId, member, closeModal }) => {
    const { hanldeUpdateGroupMemberNickname } = useChat();
    const [newNickname, setNewNickname] = useState("");

    const handleUpdateNickname = async () => {
        const payload = {
            newNickname,
            participantId: member._id,
            groupId
        }

        await hanldeUpdateGroupMemberNickname(payload);
        closeModal();
    }

    return (
        <form className='change-nickname-form'>
            <img
                src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${member?.profilePicture}`}
            />
            <label className='input-label'>Nickname</label>
            <input 
                type='text'
                value={newNickname}
                className='input-field'
                onChange={(e) => setNewNickname(e.target.value)}
                minLength={2}
                maxLength={32}
                autoFocus
                required
            />
            <p className='input-message'>Everyone in the chat will see this nickname.</p>

            <button type='button' className='save-btn' onClick={() => handleUpdateNickname(member)}>Save nickname</button>
        </form>
    );
};

export default ChangeNicknameForm;