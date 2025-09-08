import "../Login.css";
import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useAlertContext } from "../../context/AlertContext.jsx";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const { showAlert } = useAlertContext();

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const auth = getAuth();

        try {
            await sendPasswordResetEmail(auth, email, {
                url: `${import.meta.env.VITE_CLIENT_SIDE_API_URL}sign-in?email=${encodeURIComponent(email)}`,
                handleCodeInApp: true,
            });
            showAlert("success", "A password reset link has been sent to your email.");
        } catch (err) {
            showAlert("error", "Unable to send reset email. Please check the email address and try again.");
        }
    };

    return (
        <div className="forgot-password-container">
            <header className="title">Forgot Password</header>
            <form onSubmit={handleResetPassword}>
                <div className="input-box">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <label>Email</label>
                </div>
                <button type="submit" id="btn">Send Link</button>
            </form>
        </div>
    );
};

export default ForgotPassword;