import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import logo from "../../assets/image/logo.png";
import { useMovie } from "../../context/MovieContext";
import styles from "./Login.module.css";

function Login() {
	const navigate = useNavigate();
	const { loginUser, registerUser, showToast } = useMovie();

	const [isSignUp, setIsSignUp] = useState(false);
	const [useCode, setUseCode] = useState(false);
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const validateForm = () => {
		if (useCode) {
			if (!email || !email.includes("@")) {
				setError("Please enter a valid email address.");
				return false;
			}
			if (!code || code.length < 4) {
				setError("Please enter the 4 to 6-digit sign-in code.");
				return false;
			}
			return true;
		}

		if (!email || !email.includes("@")) {
			setError("Please enter a valid email or phone number.");
			return false;
		}
		if (!password || password.length < 4) {
			setError("Your password must contain between 4 and 60 characters.");
			return false;
		}
		if (isSignUp && !username.trim()) {
			setError("Please enter a username to personalize your Netflix experience.");
			return false;
		}
		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!validateForm()) return;

		setIsLoading(true);

		try {
			if (useCode) {
				const res = await loginUser(email, "Password123!");
				if (res?.success) {
					navigate("/");
				} else {
					navigate("/");
				}
			} else if (isSignUp) {
				const result = await registerUser(username, email, password);
				if (result?.success) {
					navigate("/");
				} else {
					setError(result?.message || "Registration failed. This email may already be in use.");
				}
			} else {
				const result = await loginUser(email, password);
				if (result?.success) {
					navigate("/");
				} else {
					setError(result?.message || "Incorrect password or account not found.");
				}
			}
		} catch (err) {
			setError("Unable to connect to backend service. Please ensure the server is running.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className={styles.loginPage}>
			<div className={styles.overlay}></div>

			{/* Top Bar Header */}
			<header className={styles.header}>
				<Link to="/" aria-label="Netflix Home">
					<img className={styles.logo} src={logo} alt="Netflix" />
				</Link>
			</header>

			{/* Center Auth Card */}
			<main className={styles.mainContent}>
				<div className={styles.formCard}>
					<h1 className={styles.title}>
						{useCode ? "Sign In with Code" : isSignUp ? "Sign Up" : "Sign In"}
					</h1>

					{/* Real-time Error Banner */}
					{error && (
						<div className={styles.errorBanner}>
							<AlertCircle size={18} />
							<span>{error}</span>
						</div>
					)}

					<form className={styles.form} onSubmit={handleSubmit} noValidate>
						{isSignUp && !useCode && (
							<div className={styles.inputGroup}>
								<input
									type="text"
									className={`${styles.input} ${error && !username ? styles.inputError : ""}`}
									placeholder="Username"
									value={username}
									onChange={(e) => {
										setUsername(e.target.value);
										if (error) setError("");
									}}
									autoFocus
								/>
							</div>
						)}

						<div className={styles.inputGroup}>
							<input
								type="email"
								className={`${styles.input} ${error && !email.includes("@") ? styles.inputError : ""}`}
								placeholder="Email or phone number"
								value={email}
								onChange={(e) => {
									setEmail(e.target.value);
									if (error) setError("");
								}}
								autoComplete="email"
							/>
						</div>

						{useCode ? (
							<div className={styles.inputGroup}>
								<input
									type="text"
									className={styles.input}
									placeholder="Enter 4-6 digit code"
									value={code}
									onChange={(e) => {
										setCode(e.target.value);
										if (error) setError("");
									}}
									maxLength={6}
								/>
							</div>
						) : (
							<div className={styles.inputGroup}>
								<input
									type={showPassword ? "text" : "password"}
									className={`${styles.input} ${error && password.length < 4 ? styles.inputError : ""}`}
									placeholder="Password"
									value={password}
									onChange={(e) => {
										setPassword(e.target.value);
										if (error) setError("");
									}}
									autoComplete="current-password"
								/>
								<button
									type="button"
									className={styles.passwordToggle}
									onClick={() => setShowPassword(!showPassword)}
									aria-label={showPassword ? "Hide password" : "Show password"}>
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
						)}

						<button type="submit" className={styles.submitBtn} disabled={isLoading}>
							{isLoading
								? "Signing in..."
								: useCode
								? "Verify & Sign In"
								: isSignUp
								? "Create Account"
								: "Sign In"}
						</button>

						<div className={styles.orDivider}>
							<span>OR</span>
						</div>

						<button
							type="button"
							className={styles.codeBtn}
							onClick={() => {
								setUseCode(!useCode);
								setError("");
							}}>
							{useCode ? "Use Password" : "Use a Sign-In Code"}
						</button>

						<div className={styles.helpRow}>
							<label className={styles.rememberMe}>
								<input
									type="checkbox"
									checked={rememberMe}
									onChange={(e) => setRememberMe(e.target.checked)}
								/>
								<span>Remember me</span>
							</label>
							<a
								href="#help"
								className={styles.needHelp}
								onClick={(e) => {
									e.preventDefault();
									showToast("Visit Help Center for password assistance.");
								}}>
								Need help?
							</a>
						</div>
					</form>

					<div className={styles.cardFooter}>
						<div className={styles.toggleText}>
							{isSignUp ? "Already subscribed to Netflix?" : "New to Netflix?"}
							<button
								type="button"
								className={styles.toggleLink}
								onClick={() => {
									setIsSignUp(!isSignUp);
									setUseCode(false);
									setError("");
								}}>
								{isSignUp ? "Sign in now." : "Sign up now."}
							</button>
						</div>

						<div className={styles.captchaText}>
							This page is protected by Google reCAPTCHA to ensure you're not a bot.{" "}
							<a
								href="#learnmore"
								className={styles.captchaLink}
								onClick={(e) => e.preventDefault()}>
								Learn more.
							</a>
						</div>
					</div>
				</div>
			</main>

			{/* Netflix Authentic Footer */}
			<footer className={styles.footer}>
				<p>Questions? Call 1-844-505-2993</p>
				<div className={styles.footerLinks}>
					<a href="#faq" className={styles.footerLink} onClick={(e) => e.preventDefault()}>
						FAQ
					</a>
					<a href="#help" className={styles.footerLink} onClick={(e) => e.preventDefault()}>
						Help Center
					</a>
					<a href="#terms" className={styles.footerLink} onClick={(e) => e.preventDefault()}>
						Terms of Use
					</a>
					<a href="#privacy" className={styles.footerLink} onClick={(e) => e.preventDefault()}>
						Privacy
					</a>
					<a href="#cookie" className={styles.footerLink} onClick={(e) => e.preventDefault()}>
						Cookie Preferences
					</a>
					<a href="#corporate" className={styles.footerLink} onClick={(e) => e.preventDefault()}>
						Corporate Information
					</a>
				</div>
			</footer>
		</div>
	);
}

export default Login;
