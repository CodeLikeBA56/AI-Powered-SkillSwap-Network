import '../User-Profile/User-Profile.css';
import React, { useState, useEffect } from 'react';
import image from '../../assets/No-Profile.webp';
import Modal from '../../components/Custom/Modal';
import PostSection from '../../components/Post-Section/Post-Section';

import { useUserPosts } from '../../context/UserPostsProvider.jsx';
import { useSettingContext } from '../../context/SettingContext.jsx';
import { useUserProfile } from '../../context/UserProfileProvider.jsx';
import { useUserSessions } from '../../context/UserSessionsProvider.jsx';

import SessionSection from '../../components/Session-Section/Session-Section';
import ProfileSection from '../../components/Profile-Section/Profile-Section';
import FollowersList from '../../components/Profile-Module/Followers-List/Followers-List'
import FollowingList from '../../components/Profile-Module/Following-List/Following-List'
import ChangeProfileForm from '../../components/Profile-Module/ChangeProfileForm/ChangeProfileForm.jsx';


const MyProfile = () => {
  const [showList, setShowList] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Personal-Informations");
  const [showChangeProfileModal, setShowChangeProfileModal] = useState(false);
  
  const { userInfo, userProgress } = useUserProfile();
  const { userPosts, setUserPosts } = useUserPosts();
  const { userSessions, setUserSessions } = useUserSessions();

  const showFollowersList = () => {
    setShowList("Followers");
    setShowModal(true);
  }

  const showFollowingList = () => {
    setShowList("Followings");
    setShowModal(true);
  }

  const { changeActiveLink } = useSettingContext();

  useEffect(() => {
    changeActiveLink('Profile');
  }, []);

  return (
    <section className="user-profile-container" style={{overflowY: 'scroll'}}>
      <div className='user-profile-detail'>
        <div className='user-detail'>
          <img
            src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${userInfo?.profilePicture}` || image}
            alt="user-profile" 
            onError={(e) => e.target.src = image}
            onClick={() => setShowChangeProfileModal(true)}
          />
          <h2 className='user-name'>{userInfo?.username}</h2>
        </div>

        <div className='profile-detail'>
            <div className="profile-stats">
                <button type='button' onClick={() => setActiveTab("Posts")}>{userPosts?.length} Posts</button>
                <button type='button' onClick={showFollowersList}>{userInfo?.followers?.length} Followers</button>
                <button type='button' onClick={showFollowingList}>{userInfo?.following?.length} Following</button>
            </div>

            <span className='user-email'>{userInfo?.email.split("@")[0]}</span>
            <p className='user-bio'>{userInfo?.bio || ""}</p>
        </div>
      </div>

      <div className='post-tabs'>
        <button className={`link ${activeTab === "Personal-Informations" ? 'active' : ''}`} 
          onClick={() => setActiveTab("Personal-Informations")}>
          <span className='material-symbols-outlined link-icon'>identity_platform</span>
          <span className='link-name'>Portfolio</span>
        </button>
        <button className={`link ${activeTab === "Posts" ? 'active' : ''}`} 
          onClick={() => setActiveTab("Posts")}>
          <span className='material-symbols-outlined link-icon'>grid_on</span>
          <span className='link-name'>Posts</span>
        </button>
        <button className={`link ${activeTab === "Sessions" ? 'active' : ''}`} 
          onClick={() => setActiveTab("Sessions")}>
          <span className='material-symbols-outlined link-icon'>duo</span>
          <span className='link-name'>Sessions</span>
        </button>
      </div>

      <main className='post-section'>
        { activeTab === "Posts" ? (
          <PostSection posts={userPosts} setPosts={setUserPosts} />
        ) : activeTab === "Sessions" ? (
          <SessionSection sessions={userSessions} setSessions={setUserSessions} />
        ) : activeTab === "Personal-Informations" ? (
          <ProfileSection userInfo={userInfo} userProgress={userProgress} />
        ) : null }
      </main>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} modalType={"bottomHalf"}>
          {
            showList === "Followers" ? (
              <FollowersList followers={userInfo?.followers}/>
            ) : showList === "Followings" ? (
              <FollowingList following={userInfo?.following} />
            ) : null
          }
      </Modal>

      <Modal isOpen={showChangeProfileModal} onClose={() => setShowChangeProfileModal(false)} modalType={"center"}>
        <ChangeProfileForm />
      </Modal>
    </section>
  );
};

export default MyProfile;