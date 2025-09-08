import "./Welcome.css";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LoadingAnimation from "../../Styled-Components/LoadingAnimation";

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="welcome-container">
            <motion.div
                className="title-container"
                initial="hidden"
                animate="visible"
                variants={{
                visible: {
                    transition: {
                    staggerChildren: 0.05,
                    },
                },
                }}
            >
                {"AI Powered SkillSwap Network".split("").map((char, index) => (
                <motion.span
                    key={index}
                    className="char"
                    variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 },
                    }}
                    transition={{ duration: 0.3 }}
                >
                    {char === " " ? "\u00A0" : char}
                </motion.span>
                ))}
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="quote"
            >
                Empowering minds by sharing skills.
            </motion.p>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="motivation"
            >
                <p>Teach what you know. Grow together.</p>
                <p>Join a community that values knowledge over money.</p>
            </motion.div>

            <div className="animations">
                <LoadingAnimation skillsToDisplay={["C", "Java", "HTML"]} />
                <LoadingAnimation skillsToDisplay={["C#", "Py", "CSS"]} />
                <LoadingAnimation skillsToDisplay={["C++", "PHP", "Js"]} />
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="get-started-button"
                onClick={() => navigate("/sign-in")}
            >
                Get Started
            </motion.button>
        </div>
    );
};

export default Welcome;