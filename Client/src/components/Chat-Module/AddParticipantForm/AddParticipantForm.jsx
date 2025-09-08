import '../Search-Users/SearchUser.css';
import React, { useState, useEffect } from 'react';
import { useChat } from '../../../context/ChatProvider.jsx';
import UserTag from '../../Profile-Module/User-Tag/UserTag.jsx';
import { useAlertContext } from '../../../context/AlertContext.jsx';
import { useUserProfile } from '../../../context/UserProfileProvider.jsx';
import { useRecommendation } from '../../../context/RecommendationProvider.jsx';

const AddParticipantForm = ({ groupId, closeModal }) => {
  const { userInfo } = useUserProfile();
  const { showAlert } = useAlertContext();
  const { handleAddMemberToGroup } = useChat();
  const { searchedUserByName, fetchUsersBySearch } = useRecommendation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleOptionClick = (user) => {
    setSelectedUsers((prev) => {
      const isExisted = prev.some(u => u._id === user._id);
      return isExisted ? prev.filter(u => u._id !== user._id) : [...prev, user];
    });
  };

  const handleRemoveUser = (index) => {
    setSelectedUsers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddParticpants = () => {
    try {
      if(0 === selectedUsers.length) return showAlert('info', 'Please select at least one member first');

      selectedUsers.forEach(member => {
        handleAddMemberToGroup(groupId, member);
      });

      showAlert("info", `${selectedUsers.length} participants added successfully.`);
    } catch (error) {
      console.log(error)
    }
    closeModal();
  }

  useEffect(() => {
    const controller = new AbortController(); // For aborting fetch
    const delayDebounce = setTimeout(() => fetchUsersBySearch(searchQuery, controller), 600); // 600ms debounce delay

    return () => { // Cleanup: abort previous call and clear timeout
      controller.abort();
      clearTimeout(delayDebounce);
    };
  }, [searchQuery]);  

  return (
    <div className='search-user-container'>
      <header>
        <span className='to-heading'>To: </span>

        {
          selectedUsers?.map((user, index) => (
            <div className='user-tag'>
              <span className='user-name'>{user.username}</span>
              <button type='button' className='delete-user-btn' onClick={() => handleRemoveUser(index)}>
                <span className='material-symbols-outlined delete-user-btn-icon'>close</span>
              </button>
            </div>
          ))
        }

        <input
          type='search'
          id='search-user-by-name'
          placeholder='Search...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </header>

      {
        searchQuery.trim().length === 0 && (
          <main className='recommended-users'>
            <h4>Suggested</h4>
            { userInfo?.following?.length === 0 ? (
              <p className="no-user-match">Search user by name or emial.</p>
            ) : (
              <ul className='users-list'>
                {userInfo?.following?.map((following) => (
                  <li key={following._id} className='user-option' onClick={() => handleOptionClick(following)}>
                    <UserTag username={following.username} profilePicture={following.profilePicture} />
                    <input type='checkbox' id={`user-${following._id}`} checked={selectedUsers.some(u => u._id === following._id)} hidden readOnly />
                    <label htmlFor={`user-${following._id}`}></label>
                  </li>
                ))}
              </ul>
            )}
          </main>
        )
      }
      {
        searchQuery.trim().length !== 0 && (
          <main className='recommended-users'>
            { searchedUserByName?.length === 0 ? (
              <p className="no-user-match">No users found. Try a different name or email.</p>
            ) : (
              <ul className='users-list'>
                {searchedUserByName?.map((user) => (
                  <li key={user._id} className='user-option' onClick={() => handleOptionClick(user)}>
                    <UserTag username={user.username} profilePicture={user.profilePicture} />
                    <input type='checkbox' id={`user-${user._id}`} checked={selectedUsers.some(u => u._id === user._id)} hidden readOnly />
                    <label htmlFor={`user-${user._id}`}></label>
                  </li>
                ))}
              </ul>
            )}
          </main>
        )
      }

      { selectedUsers.length >= 1 && (
        <button type='button' onClick={handleAddParticpants}>Add Members</button>
      )}
    </div>
  )
};

export default AddParticipantForm;