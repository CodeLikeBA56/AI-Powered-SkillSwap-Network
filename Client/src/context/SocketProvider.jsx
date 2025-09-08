import { io } from 'socket.io-client';
import { createContext, useContext, useMemo, useEffect } from "react";

export const SocketContext = createContext();

const SocketProvider = ({ children }) => {

  const socket = useMemo(() => {
    const socket = io(import.meta.env.VITE_SERVER_SIDE_API_URL);
    return socket;
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  return useContext(SocketContext);
};

export default SocketProvider;