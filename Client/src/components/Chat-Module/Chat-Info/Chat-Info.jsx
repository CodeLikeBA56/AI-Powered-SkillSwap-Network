import './Chat-Info.css';
import React, { useEffect, useState } from 'react'
import axiosInstance from '../../../api/axios.js';
import { useChat } from '../../../context/ChatProvider';
import { useAlertContext } from '../../../context/AlertContext.jsx';
import SkillsList from '../../Profile-Module/Skills-List/Skills-List.jsx';
import { useUserProfile } from '../../../context/UserProfileProvider.jsx';

const ChatInfo = ({ showChatInfo, setShowChatInfo }) => {
  const { showAlert } = useAlertContext();
  const { getUserProfile } = useUserProfile();
  const { selectedChat, clearChat, deleteChat, updateChatName } = useChat();

  const participant = selectedChat?.participants._id;
  const [nickname, setNickname] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if(selectedChat)
      setNickname(selectedChat?.nicknames[participant]);
  }, [selectedChat]);
  
  useEffect(() => {
    if(showChatInfo)
      setIsEditing(false);
  }, [showChatInfo]);

  const handleSaveChatInfo = async () => {
    try {
      if (!nickname.trim())
        return;

      if (selectedChat?.nicknames[participant] === nickname.trim()) {
        setNickname(prev => prev.trim());
        return;
      }

      const body = { chatId: selectedChat?._id, participant, nickname: nickname.trim() };
      const response = await axiosInstance.patch(`api/chat/`, body);
      const { type, message } = response.data;
      showAlert(type, message);
      updateChatName(body.chatId, body.participant, body.nickname);
    } catch (error) {
      
    } finally {
      setIsEditing(false);
    }
  }

  const profilePicURL = getUserProfile(selectedChat?.participants?.username, selectedChat?.participants?.profilePicture);

  return (
    <div className={`chat-person-info ${showChatInfo === true? "open" : ""}`}>
      <header>
        <button onClick={() => setShowChatInfo(false)}>
          <span className='material-symbols-outlined'>arrow_back_ios</span>
        </button>
        <h2>Chat Info</h2>
        {
          !isEditing && <button className='edit-btn' onClick={() => setIsEditing(true)}>Edit</button>
        }
        {
          isEditing && <button className='edit-btn' onClick={() => handleSaveChatInfo()}>Save</button>
        }
      </header>
        <img
          className='contact-profile' 
          src={profilePicURL}
          alt='User Profile'
        />
        <h2 style={{alignSelf: 'center'}}>{`${selectedChat?.participants.username}`}</h2>
        <p style={{ width: "90%", alignSelf: 'center', textAlign: 'center'}}>{`${selectedChat?.participants?.bio}`}</p>
        {
          <div className='input-container'>
            <label htmlFor='nickname-field' className='input-label'>Nickname</label>
            <input 
              type='text'
              id='nickname-field'
              className='input-field'
              value={nickname} 
              disabled={!isEditing}
              onChange={(e) => setNickname(e.target.value)} 
            />
          </div>
        }
        <SkillsList title="Offered Skills" skills={selectedChat?.participants?.offeredSkills} />
        <SkillsList title="Desired Skills" skills={selectedChat?.participants?.desiredSkills} />

        <div className='button-groups'>
          <button className='clear-chat-btn' onClick={() => clearChat(selectedChat?._id, participant)}>Clear Chat</button>
          <button className='delete-chat-btn' onClick={() => deleteChat(selectedChat._id, participant)}>Delete Chat</button>
        </div>
    </div>
  );
};

export default ChatInfo;