import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUserProfile } from './UserProfileProvider';
import { useAlertContext } from './AlertContext';
import { useSocket } from './SocketProvider';
import axiosInstance from '../api/axios';

export const NotificationContext = createContext();

const NotificationProvider = ({ children }) => {
    const { socket } = useSocket();
    const { userInfo } = useUserProfile();
    const { showAlert } = useAlertContext();

    const [notifications, setNotifications] = useState([]);
    const [noOfUnreadNotifications, setNoOfUnreadNotifications] = useState(0);
    
    useEffect(() => {
        if (userInfo === null)
            setNotifications([]);
    }, [userInfo]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await axiosInstance.get('api/notifications/');
                
                if (response.status === 200) {
                    const { notifications } = response.data;
                    setNotifications(notifications);
                }
            } catch (error) {
                const { type, message } = error.response.data;
                showAlert(type, message);
            }
        }

        if (notifications.length === 0 && userInfo) {
            fetchNotifications();    
        }
    }, [userInfo?._id]);

    useEffect(() => {
        if (notifications) {
            const totalUnreadNotifications = notifications.reduce((totalUnreadNotifications, notification) => {
                if (!notification.isRead) {
                    totalUnreadNotifications += 1;
                }

                return totalUnreadNotifications;
            }, 0);

            setNoOfUnreadNotifications(totalUnreadNotifications);
        }
    }, [notifications]);

    const updateNotificationStatus = async (notification) => {
        setNotifications(prev => prev.map(n => {
            if(n._id == notification._id) {
                try {
                    axiosInstance.patch(`api/notifications/mark-as-read/${notification._id}`);
                    return { ...notification, isRead: true };
                } catch (error) { }
            } 

            return n;
        }));
    }

    const markAllNotificationAsRead = async () => {
        setNotifications(prev => prev.map(notification => {
            axiosInstance.patch(`api/notifications/mark-as-read/${notification._id}`);
            return { ...notification, isRead: true };
        }));
    }

    const handleReceiveNewNotification = useCallback(async ({ notification }) => {
        console.log(notification)
        const isExisted = notifications.some((item) => item._id == notification._id);
        if (!isExisted)
            setNotifications(prev => [notification, ...prev]);
    });

    const handleRemoveNotification = useCallback(async ({ notificationID }) => {
        setNotifications(prev => prev.filter(notification => notification._id !== notificationID));
    });

    useEffect(() => {
        socket.on('new-notification', handleReceiveNewNotification);
        socket.on('remove-notification', handleRemoveNotification);

        return () => {
            socket.off('new-notification', handleReceiveNewNotification);
            socket.off('remove-notification', handleRemoveNotification);
        }
    }, [socket, handleReceiveNewNotification, handleRemoveNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, noOfUnreadNotifications, markAllNotificationAsRead, updateNotificationStatus }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  return useContext(NotificationContext);
};

export default NotificationProvider;