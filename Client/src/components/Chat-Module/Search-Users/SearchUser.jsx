import './SearchUser.css';
import axiosInstance from '../../../api/axios.js';
import React, { useState, useEffect } from 'react';
import { useChat } from '../../../context/ChatProvider.jsx';
import UserTag from '../../Profile-Module/User-Tag/UserTag.jsx';
import { useUserProfile } from '../../../context/UserProfileProvider.jsx';

const SearchUser = () => {
  const { userInfo } = useUserProfile();
  const { initiateChat, selectedUsers, setSelectedUsers, handleCloseModal, setShowCreateGroupChatForm } = useChat();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchedUserByName, setSearchedUserByName] = useState([]);

  const handleOptionClick = (user) => {
    setSelectedUsers((prev) => {
        const isExisted = prev.some(u => u._id === user._id);
        if (isExisted)
          return prev.filter(u => u._id !== user._id);
        else
          return [...prev, user];
    });
  };

  const handleRemoveUser = (index) => {
    setSelectedUsers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInitiateChat = () => {
    const { _id, username, profilePicture } = selectedUsers[0];
    initiateChat(_id, username, profilePicture);
    setSelectedUsers([]);
    document.querySelector('.modal-overlay').classList.remove('show');
    setTimeout(() => handleCloseModal(), 300);
  }

  useEffect(() => {
    const controller = new AbortController(); // For aborting fetch
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim() === "") {
        setSearchedUserByName([]);
        return;
      }
  
      axiosInstance.get(`/api/recommendations/fetch-users-by-name-or-email/${searchQuery}`, {
        signal: controller.signal,
      }).then((res) => {
        if (res.data?.users)
          setSearchedUserByName(res.data.users);
      }).catch((err) => {
        if (err.name !== 'CanceledError') {
          console.error('Search failed:', err.message);
        }
      });
    }, 600); // 600ms debounce delay
  
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
          value={searchQuery}
          placeholder='Search...'
          id='search-user-by-name'
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </header>

      {
        searchQuery.trim().length === 0 && (
          <main className='recommended-users'>
            <h4>Suggested</h4>
            { userInfo?.following?.length === 0 ? (
              <p className="no-user-match">Search user by name or email to initiate chat.</p>
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
        
      { selectedUsers.length < 2 && (
        <button
          type='button'
          style={{background: `${selectedUsers.length > 0 ? '' : 'var(--secondary-color)'}`}}
          disabled={selectedUsers.length === 0}
          onClick={handleInitiateChat}
        >Chat</button>
      )}

      { selectedUsers.length > 1 && (
        <button type='button' onClick={() => setShowCreateGroupChatForm(true)}>Create Group</button>
      )}
    </div>
  )
};

export default SearchUser;