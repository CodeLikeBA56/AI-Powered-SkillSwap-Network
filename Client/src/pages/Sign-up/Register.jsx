import '../Login.css';
import { useState } from 'react';
import { auth } from '../../Firebase.js';
import axiosInstance from '../../api/axios.js';
import { useAlertContext } from '../../context/AlertContext.jsx';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

const Register = () => {
    const { showAlert } = useAlertContext()
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
    
        if (!email.endsWith('.edu.pk'))
            return showAlert("error", "Email must end with '.edu.pk'");
    
        if (password.length < 7)
            return showAlert("error", "Password must be at least 7 characters.");

        if (password !== confirmPassword)
            return showAlert("error", "Password and confirm password do not match.");
    
        const newUser = { email, username, password };
    
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await sendEmailVerification(user, {
                url: `${import.meta.env.VITE_CLIENT_SIDE_API_URL}?email=${encodeURIComponent(user.email)}`,
                handleCodeInApp: true,
            });

            const response = await axiosInstance.post('api/register', newUser);
            const { type, message } = response.data;
                
            showAlert("info", "Email verification link has been sent to your mail.");
        } catch (error) {
            if (error.code) {
                switch (error.code) {
                    case "auth/email-already-in-use":
                        showAlert("error", "This email is already in use.");
                        break;
                    case "auth/invalid-email":
                        showAlert("error", "Please provide a valid email.");
                        break;
                    case "auth/weak-password":
                        showAlert("error", "The password must be 7 characters long.");
                        break;
                    case "auth/operation-not-allowed":
                        showAlert("error", "This operation is not allowed.");
                        break;
                    case "auth/network-request-failed":
                        showAlert("error", "Please check your internet connection.");
                        break;
                    case "auth/too-many-requests":
                        showAlert("error", "Too many attempts. Please try again later.");
                        break;
                    default:
                        showAlert("error", "An unexpected error occurred. Please try again later.");
                        break;
                }
            } else {
                console.error("Error signing up:", error.response?.data?.message || error.message);
                showAlert("error", error.response?.data?.message || "An error occurred. Please try again.");
            }
        }
    };    

    const showPassword = () => {
        const showPasswordIcon = document.querySelector('#show-password-icon');
        const passwordInput = document.querySelector('input[name="password"]');
        passwordInput.type = passwordInput.type === 'password'? 'text' : 'password';
        showPasswordIcon.innerText = passwordInput.type === 'password' ? "visibility_off" : "visibility";
    };

    const showConfirmPassword = () => {
        const showPasswordIcon = document.querySelector('#show-confirm-password-icon');
        const confirmPasswordInput = document.querySelector('input[name="confirm-password"]');
        confirmPasswordInput.type = confirmPasswordInput.type === 'password'? 'text' : 'password';
        showPasswordIcon.innerText = confirmPasswordInput.type === 'password' ? "visibility_off" : "visibility";
    };

    return (
        <div className="sign-up-container">
            <header className='title'>Create an account</header>
            <form action="#" onSubmit={handleRegister}>
                <div className="input-box">
                    <input 
                        type="text" 
                        name="username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <label>Username</label>
                </div>
                <div className="input-box">
                    <input 
                        type="email" 
                        name="email-id" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <label>Email</label>
                </div>
                <div className="input-box">
                    <input 
                        type="password" 
                        name="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required
                    />
                    <label>Password</label>
                    <button type='button' className='show-password-btn' onClick={showPassword}>
                        <span id='show-password-icon' className='material-symbols-outlined'>visibility_off</span>
                    </button>
                </div>
                <div className="input-box">
                    <input 
                        type="password" 
                        name="confirm-password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required
                    />
                    <label>Confirm Password</label>
                    <button type='button' className='show-password-btn' onClick={showConfirmPassword}>
                        <span id='show-confirm-password-icon' className='material-symbols-outlined'>visibility_off</span>
                    </button>
                </div>
                <button id="btn" className="btn" type="submit">REGISTER</button>
                <div className="signup-link">
                    {/* <a href="" onClick={handleLogin}>SIGN UP</a> */}
                </div>
            </form>
        </div>
    );
}

export default Register;