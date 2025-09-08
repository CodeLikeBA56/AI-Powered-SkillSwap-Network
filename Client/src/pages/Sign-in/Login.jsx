import '../Login.css';
import axiosInstance from '../../api/axios';
import { useState, useEffect } from 'react';
import { useAlertContext } from '../../context/AlertContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserProfile } from '../../context/UserProfileProvider.jsx';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlertContext();
  const { setUserInfo } = useUserProfile();

  const [email, setEmail] = useState('');
  const [password,setPassword]  = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const userEmail = queryParams.get('email');
    if (userEmail)
        setEmail(userEmail);
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      localStorage.clear();
      const response = await axiosInstance.post('api/authenticate', { email, password });
      const { type, message, user } = response.data;
      showAlert(type, message);
      setUserInfo(user);
      
      if(response.status === 200) {
        if (response.data.user.offeredSkills?.length === 0 || response.data.user.desiredSkills?.length === 0)
          navigate('/skill-set-form');
        else
          navigate('/dashboard');
      }
    } catch (error) {
      const { type, message } = error.response.data
      showAlert(type, message);
    }
  };
    
  const showPassword = () => {
    const showPasswordIcon = document.querySelector('#show-password-icon');
    const passwordInput = document.querySelector('input[name="password"]');
    passwordInput.type = passwordInput.type === 'password'? 'text' : 'password';
    showPasswordIcon.innerText = passwordInput.type === 'password' ? "visibility_off" : "visibility";
  };

  return (
    <div className="sign-in-container">
      <header className='title'>LOGIN</header>
      <form action="#" onSubmit={handleLogin}>
        <div className="input-box">
          <input type="email" name="email-id" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <label>Email</label>
        </div>
        <div className="input-box">
          <input 
            type="password" 
            name="password" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)} 
            required 
          />
          <label>Password</label>
          <button type='button' className='show-password-btn' onClick={showPassword}>
            <span id='show-password-icon' className='material-symbols-outlined'>visibility_off</span>
          </button>
        </div>
        <div className="forgot-password">
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
        <button id="btn" className="btn" type="submit">Login</button>
        <div className="signup-link">
          <Link to="/sign-up">Don't have an account?</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;