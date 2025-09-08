import './Notification.css';
import image from '../../assets/Professor.avif';
import React, { useEffect } from 'react';
import { useUserPosts } from '../../context/UserPostsProvider';
import { useUserSessions } from '../../context/UserSessionsProvider';
import { useSettingContext } from '../../context/SettingContext';
import { useNotifications } from '../../context/NotificationsProvider';

const Notification = () => {
  const { redirectToPost } = useUserPosts();
  const { redirectToSession } = useUserSessions();
  const { changeActiveLink } = useSettingContext();
  const { notifications, noOfUnreadNotifications, updateNotificationStatus, markAllNotificationAsRead } = useNotifications();

  useEffect(() => {
    changeActiveLink('Notifications');
  }, []);

  const handleRedirectToNotification = (notification) => {
    if (!notification.isRead)
      updateNotificationStatus(notification);

    const commentId = notification?.comment || undefined;

    if (notification.post)
      redirectToPost(notification.post, "/dashboard/notifications", "Notifications", commentId);

    if (notification.session) {
      redirectToSession(notification.session, "/dashboard/notifications", "Notifications", commentId);
    }
  }

  return (
    <div className="notifications-container">
      <h1>
        Notifications
        { 0 !== noOfUnreadNotifications && <button type='button' onClick={markAllNotificationAsRead}>Mark all as read</button>}
      </h1>

      { 0 !== notifications.length ?
          notifications?.map((notification) => {
            return (
              <div key={notification._id} className={`notification-item ${notification.isRead ? "read" : "unread"}`} onClick={() => handleRedirectToNotification(notification)}>
                <img src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${notification?.sender?.profilePicture}`} 
                      alt={notification?.sender?.username} 
                      onError={(e) => e.target.src = image}
                      className="sender-avatar" />
                <div className='notification-item-content'>
                  <strong>{notification.sender?.username}</strong>
                  <span>
                      {notification.type === "like-post" && " liked a post."}
                      {notification.type === "like-session" && " liked a session."}
                      {notification.type === "comment-on-post" && " added a comment on a post."}
                      {notification.type === "comment-on-session" && " added a comment on a session."}
                      {notification.type === "like-post-comment" && " liked your comment."}
                      {notification.type === "like-session-comment" && " liked your comment."}
                      {notification.type === "follow" && " started following you."}
                      {notification.type === "message" && " sent you a message."}
                      {notification.type === "like_reply" && " liked your reply."}
                      {notification.type === "reply_comment" && " replied to your comment."}
                  </span>
                </div>
                <span className="timestamp">{new Date(notification.createdAt).toLocaleString()}</span>
              </div>
            )
          })
        :
          <p className='no-result'>No notifications yet</p>
      }
    </div>
  );
};

export default Notification;