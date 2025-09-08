import './GroupChatInfo.css';
import Modal from '../../Custom/Modal.jsx';
import React, { useEffect, useState } from 'react';
import { useChat } from '../../../context/ChatProvider';
import AddParticipantForm from '../AddParticipantForm/AddParticipantForm.jsx';
import ChangeNicknameForm from '../ChangeNicknameForm/ChangeNicknameForm.jsx';
import { useUserProfile } from '../../../context/UserProfileProvider.jsx';

const GroupChatInfo = ({ showChatInfo, setShowChatInfo }) => {
  const { userInfo } = useUserProfile();
  const { selectedGroupChat, handleLeaveGroup, handleRemoveMemberFromGroup } = useChat();

  const [isEditing, setIsEditing] = useState(false);
  const [memberDetail, setMemberDetail] = useState({});
  const [participantOptionsId, setParticipantOptionsId] = useState(null);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  
  useEffect(() => {
    if(showChatInfo)
      setIsEditing(false);
  }, [showChatInfo]);
  
  const handleSaveChatInfo = async () => {
    try {
      
    } catch (error) {
      
    }
    
    setIsEditing(false);
  }
  
  const handleShowChangeNicknameForm = async (participantInfo) => {
    setMemberDetail(participantInfo);
    setParticipantOptionsId(null);
  }

  const handleCloseChangeNicknameModal = () => {
    document.querySelector('.modal-overlay').classList.remove('show');
    setTimeout(() => {
      setMemberDetail({});
    }, 300);
  }

  const handleCloseAddParticipantModal = () => {
    document.querySelector('.modal-overlay').classList.remove('show');
    setTimeout(() => {
      setShowAddParticipantModal(false);
    }, 300);
  }

  return (
    <div className={`chat-person-info ${showChatInfo === true? "open" : ""}`}>
      <header>
        <button onClick={() => setShowChatInfo(false)}>
          <span className='material-symbols-outlined'>arrow_back_ios</span>
        </button>
        <h2>Group Info</h2>
        {
          !isEditing && <button className='edit-btn' onClick={() => setIsEditing(true)}>Edit</button>
        }
        {
          isEditing && <button className='edit-btn' onClick={() => handleSaveChatInfo()}>Save</button>
        }
      </header>
        <img
          className='contact-profile' 
          src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/group-chat-media/${selectedGroupChat?.profile}`}
          alt='User Profile'
        />
        <h2 style={{alignSelf: 'center'}}>{`${selectedGroupChat?.name}`}</h2>
        <p style={{alignSelf: 'center'}}>{`Group - ${selectedGroupChat?.participants.length} members`}</p>
        <p style={{alignSelf: 'center'}} className='description'>{`${selectedGroupChat?.description}`}</p>

        <div className='participant-header'>
          <span>Participants</span>
          { 
            selectedGroupChat?.admin._id === userInfo?._id &&
            <button type='button' onClick={() => setShowAddParticipantModal(true)}>
              <span className='material-symbols-outlined'>group_add</span>
            </button>
          }
        </div>
        <div className='group-members'>
          {
            selectedGroupChat?.participants.map(member => (
              <div className="group-participant-container" key={member._id}>
                <img
                  src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${member?.profilePicture}`}
                />
                <span
                  className={selectedGroupChat?.admin?._id === member._id? "participant-name admin" : "participant-name"}
                >
                  {member.username}
                </span>
                {
                  selectedGroupChat?.admin?._id === member._id && (
                    <span className="admin-tag">Admin</span>
                  )
                }
                <button type="button" 
                  style={{background: participantOptionsId === member._id ? 'var(--main-color)' : '', color: participantOptionsId === member._id ? 'var(--white-color)' : ''}} 
                  className="action-btn" onClick={() => setParticipantOptionsId(member._id)}
                >...</button>

                {
                  participantOptionsId === member?._id && (
                    <div className='participant-options-backdrop' onClick={() => setParticipantOptionsId(null)}>
                        <div className='pop-up-options' onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleShowChangeNicknameForm(member)}>
                                <span className='btn-text'>Edit nickname</span>
                                <span className='material-symbols-outlined btn-icon'>edit</span>
                            </button>
                            {
                              selectedGroupChat?.admin?._id === userInfo?._id && (
                                <button className='delete-chat-btn' onClick={() => {
                                  setParticipantOptionsId(null);
                                  handleRemoveMemberFromGroup(selectedGroupChat._id, member._id);
                                }}>
                                    <span className='btn-text'>Kick participant</span>
                                    <span className='material-symbols-outlined btn-icon'>delete</span>
                                </button>
                              )
                            }
                        </div>
                    </div>
                  )
                }
              </div>
            ))
          }
        </div>

        <div className='hashtags-container'>
          <h3>Hashtags</h3>
          <ul>
            {
              selectedGroupChat.hashtags.map(hashtag => {
                return <li>{hashtag}</li>
              })
            }
          </ul>
        </div>


        <div className='button-groups'>
          {/* <button className='clear-chat-btn' onClick={() => clearChat(selectedGroupChat?._id)}>Clear Chat</button> */}
          {
            selectedGroupChat?.admin?._id !== userInfo?._id && (
              <button className='delete-chat-btn' onClick={() => handleLeaveGroup(selectedGroupChat?._id)}>Leave Group</button>
            )
          }
        </div>

        <Modal
          title={`Edit nickname`}
          isOpen={!!memberDetail._id}
          modalType="center"
          onClose={() => setMemberDetail({})}
        >
          <ChangeNicknameForm groupId={selectedGroupChat._id} member={memberDetail} closeModal={handleCloseChangeNicknameModal} />
        </Modal>

        <Modal
          modalType="center"
          title={`Add Participants`}
          isOpen={showAddParticipantModal}
          onClose={() => setShowAddParticipantModal(false)}
        >
          <AddParticipantForm closeModal={handleCloseAddParticipantModal} groupId={selectedGroupChat._id} />
        </Modal>
    </div>
  );
};

export default GroupChatInfo;