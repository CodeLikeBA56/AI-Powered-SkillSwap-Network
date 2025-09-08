import './User-Profile.css';
import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { useLocation } from 'react-router-dom';
import image from '../../assets/No-Profile.webp';
import Modal from '../../components/Custom/Modal';
import { useChat } from '../../context/ChatProvider';
import { useUserProfile } from '../../context/UserProfileProvider';
import PostSection from '../../components/Post-Section/Post-Section';
import SessionSection from '../../components/Session-Section/Session-Section';
import ProfileSection from '../../components/Profile-Section/Profile-Section';
import FollowersList from '../../components/Profile-Module/Followers-List/Followers-List';
import FollowingList from '../../components/Profile-Module/Following-List/Following-List';

const UserProfile = () => {
  const location = useLocation();
  const{ initiateChat } = useChat();
  const { userInfo: myInfo, followUser, unfollowUser } = useUserProfile();

  const userInfo = location.state?.user;
  const newFollowedUser = { _id: userInfo?._id, username: userInfo?.username, profilePicture: userInfo?.profilePicture };

  const [posts, setPosts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [showList, setShowList] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Personal-Informations");

  const [followedByMe, setFollowedByMe] = useState(false);

  useEffect(() => {
    if (myInfo?.following?.length) {
      setFollowedByMe(myInfo?.following.some(f => f._id === userInfo?._id));
    }
  }, [myInfo?.following]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axiosInstance.get(`api/post/get-user-posts/${userInfo._id}`);
        setPosts(response.data.posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
  
    if (userInfo?._id) fetchPosts();
  }, [userInfo?._id]);
  
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axiosInstance.get(`api/session/get-user-sessions/${userInfo._id}`);
        setSessions(response.data.sessions);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
  
    if (userInfo?._id) fetchSessions();
  }, [userInfo?._id]);
  
  useEffect(() => {
    const fetchUserProgress = async () => {
      try {
        const response = await axiosInstance.get(`api/user-progress/${userInfo._id}`);
        setUserProgress(response.data.userProgress);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
  
    if (userInfo?._id) fetchUserProgress();
  }, [userInfo?._id]);

  const showFollowersList = () => {
    setShowList("Followers");
    setShowModal(true);
  }

  const showFollowingList = () => {
    setShowList("Followings");
    setShowModal(true);
  }

  const handleToggleFollow = async () => {
    const targetedUserId = userInfo?._id;
    if (followedByMe) {
      await unfollowUser(targetedUserId);
    } else {
      const followerInfo = await followUser(targetedUserId, newFollowedUser);
    }

    setFollowedByMe(prev => !prev);
  }

  return (
    <section className="user-profile-container">
      <div className='user-profile-detail'>
        <div className='user-detail'>
          <img
            src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${userInfo.profilePicture}` || image}
            alt="user-profile" 
            onError={(e) => e.target.src = image}
          />
          <h2 className='user-name'>{userInfo.username}</h2>
        </div>

        <div className='profile-detail'>
          <div className="profile-stats">
              <button type='button' onClick={() => setActiveTab("Posts")}>{posts?.length} Posts</button>
              <button type='button' onClick={showFollowersList}>{userInfo?.followers?.length} Followers</button>
              <button type='button' onClick={showFollowingList}>{userInfo?.following?.length} Following</button>
          </div>

            <span className='user-email'>{userInfo.email.split("@")[0]}</span>
            <p className='user-bio'>{userInfo.bio || ""}</p>
            <div className='button-wrapper'>
              <button className='redirect-to-chat-btn' onClick={() => {
                initiateChat(userInfo?._id, userInfo?.username, userInfo?.profilePicture);
              }}>Message</button>
              <button className="follow-btn" onClick={handleToggleFollow}
                style={{background: followedByMe ? "var(--secondary-color)" : "var(--main-color)"}}
              >{followedByMe ? "Unfollow" : "Follow"}</button>
            </div>
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
          <PostSection posts={posts} setPosts={setPosts} />
        ) : activeTab === "Sessions" ? (
          <SessionSection sessions={sessions} setSessions={setSessions} />
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
    </section>
  );
};

export default UserProfile;