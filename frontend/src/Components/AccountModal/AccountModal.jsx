import React, { useState, useEffect, useRef } from "react";
import {
	X,
	User,
	Mail,
	Lock,
	Check,
	Eye,
	EyeOff,
	ShieldCheck,
	Sparkles,
	Camera,
	Upload,
	Trash2,
} from "lucide-react";
import { useMovie } from "../../context/MovieContext";
import styles from "./AccountModal.module.css";

const AVATAR_COLORS = [
	{ name: "Netflix Red", hex: "#e50914" },
	{ name: "Ocean Blue", hex: "#3b82f6" },
	{ name: "Emerald Green", hex: "#10b981" },
	{ name: "Vibrant Amber", hex: "#f59e0b" },
	{ name: "Royal Purple", hex: "#8b5cf6" },
	{ name: "Neon Pink", hex: "#ec4899" },
	{ name: "Cyan Teal", hex: "#06b6d4" },
	{ name: "Slate Dark", hex: "#4b5563" },
];

function AccountModal() {
	const {
		currentUser,
		isAccountModalOpen,
		closeAccountModal,
		updateUserProfile,
		showToast,
	} = useMovie();

	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [avatarColor, setAvatarColor] = useState("#e50914");
	const [avatarImage, setAvatarImage] = useState(null);
	const [showPasswordChange, setShowPasswordChange] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [showCurrentPass, setShowCurrentPass] = useState(false);
	const [showNewPass, setShowNewPass] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const fileInputRef = useRef(null);

	// Sync fields when modal opens or currentUser changes
	useEffect(() => {
		if (currentUser) {
			setUsername(currentUser.username || "");
			setEmail(currentUser.email || "");
			setAvatarColor(currentUser.avatar_color || currentUser.avatarColor || "#e50914");
			setAvatarImage(currentUser.avatar_image || currentUser.avatarImage || null);
			setShowPasswordChange(false);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setError("");
		}
	}, [currentUser, isAccountModalOpen]);

	// Escape key to close modal
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape" && isAccountModalOpen) {
				closeAccountModal();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isAccountModalOpen, closeAccountModal]);

	if (!isAccountModalOpen || !currentUser) return null;

	// Handle custom image upload with center crop & lightweight compression
	const handleImageUpload = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setError("Please upload a valid image file (PNG, JPG, WEBP, GIF).");
			return;
		}

		if (file.size > 8 * 1024 * 1024) {
			setError("Image file size is too large. Please choose an image under 8MB.");
			return;
		}

		setError("");
		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				const size = 180;
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext("2d");

				// Center crop
				const minDim = Math.min(img.width, img.height);
				const sx = (img.width - minDim) / 2;
				const sy = (img.height - minDim) / 2;

				ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
				const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
				setAvatarImage(dataUrl);
				showToast("Profile image loaded. Click 'Save Changes' to apply.");
			};
			img.src = event.target.result;
		};
		reader.readAsDataURL(file);
	};

	const handleRemoveImage = () => {
		setAvatarImage(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
		showToast("Custom photo removed. Avatar color restored.");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!username.trim()) {
			setError("Profile name cannot be empty.");
			return;
		}

		if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
			setError("Please enter a valid email address.");
			return;
		}

		if (showPasswordChange) {
			if (!newPassword) {
				setError("Please enter your new password.");
				return;
			}
			if (newPassword.length < 6) {
				setError("New password must be at least 6 characters.");
				return;
			}
			if (newPassword !== confirmPassword) {
				setError("New passwords do not match.");
				return;
			}
		}

		setIsSubmitting(true);
		try {
			const res = await updateUserProfile({
				username: username.trim(),
				email: email.trim().toLowerCase(),
				avatarColor,
				avatarImage,
				currentPassword: showPasswordChange ? currentPassword : undefined,
				newPassword: showPasswordChange ? newPassword : undefined,
			});

			if (res.success) {
				closeAccountModal();
			} else {
				setError(res.message || "Failed to update profile.");
			}
		} catch (err) {
			setError(err.message || "An unexpected error occurred.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div
			className={styles.modalOverlay}
			onClick={closeAccountModal}
			role="dialog"
			aria-modal="true"
			aria-labelledby="account-modal-title">
			<div
				className={styles.modalContent}
				onClick={(e) => e.stopPropagation()}>
				{/* Close Button */}
				<button
					type="button"
					className={styles.closeButton}
					onClick={closeAccountModal}
					aria-label="Close modal">
					<X size={22} />
				</button>

				{/* Modal Header */}
				<div className={styles.header}>
					<div className={styles.headerIcon}>
						<User size={26} />
					</div>
					<div>
						<h2 id="account-modal-title">Account & Profile Settings</h2>
						<p>Manage your Netflix profile photo, details, and preferences</p>
					</div>
				</div>

				{error && (
					<div className={styles.errorMessage}>
						<span>{error}</span>
					</div>
				)}

				<form onSubmit={handleSubmit} className={styles.form}>
					{/* Avatar Image & Color Selection Section */}
					<div className={styles.section}>
						<label className={styles.sectionLabel}>
							<Camera size={16} /> Profile Picture & Avatar
						</label>

						<div className={styles.avatarPickerRow}>
							{/* Interactive Avatar Preview */}
							<div
								className={styles.avatarPreviewWrapper}
								style={{ backgroundColor: avatarColor }}
								onClick={() => fileInputRef.current?.click()}
								title="Click to upload profile image">
								{avatarImage ? (
									<img
										src={avatarImage}
										alt="Profile preview"
										className={styles.avatarPreviewImg}
									/>
								) : (
									<User size={38} color="#ffffff" />
								)}
								<div className={styles.avatarHoverOverlay}>
									<Camera size={20} color="#ffffff" />
									<span>Change</span>
								</div>
							</div>

							{/* Hidden File Input */}
							<input
								ref={fileInputRef}
								type="file"
								accept="image/png, image/jpeg, image/webp, image/gif"
								onChange={handleImageUpload}
								style={{ display: "none" }}
								aria-label="Upload profile photo"
							/>

							{/* Upload Actions & Color Picker */}
							<div className={styles.avatarControls}>
								<div className={styles.uploadBtnRow}>
									<button
										type="button"
										className={styles.uploadBtn}
										onClick={() => fileInputRef.current?.click()}>
										<Upload size={14} />
										<span>{avatarImage ? "Change Image" : "Upload Image"}</span>
									</button>

									{avatarImage && (
										<button
											type="button"
											className={styles.removeImageBtn}
											onClick={handleRemoveImage}
											title="Remove custom photo">
											<Trash2 size={14} />
											<span>Remove</span>
										</button>
									)}
								</div>

								{/* Color Palette */}
								<div className={styles.paletteLabelWrap}>
									<span className={styles.paletteLabel}>
										<Sparkles size={13} /> Or choose avatar color:
									</span>
								</div>

								<div className={styles.colorPalette}>
									{AVATAR_COLORS.map((c) => (
										<button
											key={c.hex}
											type="button"
											className={`${styles.colorChip} ${
												avatarColor.toLowerCase() === c.hex.toLowerCase()
													? styles.colorChipActive
													: ""
											}`}
											style={{ backgroundColor: c.hex }}
											onClick={() => setAvatarColor(c.hex)}
											title={c.name}
											aria-label={c.name}>
											{avatarColor.toLowerCase() === c.hex.toLowerCase() && (
												<Check size={14} color="#ffffff" strokeWidth={3} />
											)}
										</button>
									))}
								</div>
							</div>
						</div>
					</div>

					{/* Profile Name & Email */}
					<div className={styles.section}>
						<div className={styles.inputGroup}>
							<label htmlFor="edit-username">Profile Name</label>
							<div className={styles.inputWrapper}>
								<User size={18} className={styles.inputIcon} />
								<input
									id="edit-username"
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="Enter your name"
									required
									maxLength={50}
								/>
							</div>
						</div>

						<div className={styles.inputGroup}>
							<label htmlFor="edit-email">Account Email</label>
							<div className={styles.inputWrapper}>
								<Mail size={18} className={styles.inputIcon} />
								<input
									id="edit-email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="name@example.com"
									required
								/>
							</div>
						</div>
					</div>

					{/* Password Section Toggle */}
					<div className={styles.passwordSection}>
						<button
							type="button"
							className={styles.passwordToggleBtn}
							onClick={() => setShowPasswordChange(!showPasswordChange)}>
							<Lock size={16} />
							<span>{showPasswordChange ? "Hide Password Settings" : "Change Password"}</span>
						</button>

						{showPasswordChange && (
							<div className={styles.passwordFields}>
								<div className={styles.inputGroup}>
									<label htmlFor="edit-current-password">Current Password</label>
									<div className={styles.inputWrapper}>
										<Lock size={18} className={styles.inputIcon} />
										<input
											id="edit-current-password"
											type={showCurrentPass ? "text" : "password"}
											value={currentPassword}
											onChange={(e) => setCurrentPassword(e.target.value)}
											placeholder="Enter current password"
										/>
										<button
											type="button"
											className={styles.eyeBtn}
											onClick={() => setShowCurrentPass(!showCurrentPass)}>
											{showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
										</button>
									</div>
								</div>

								<div className={styles.inputGroup}>
									<label htmlFor="edit-new-password">New Password</label>
									<div className={styles.inputWrapper}>
										<Lock size={18} className={styles.inputIcon} />
										<input
											id="edit-new-password"
											type={showNewPass ? "text" : "password"}
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											placeholder="At least 6 characters"
										/>
										<button
											type="button"
											className={styles.eyeBtn}
											onClick={() => setShowNewPass(!showNewPass)}>
											{showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
										</button>
									</div>
								</div>

								<div className={styles.inputGroup}>
									<label htmlFor="edit-confirm-password">Confirm New Password</label>
									<div className={styles.inputWrapper}>
										<Lock size={18} className={styles.inputIcon} />
										<input
											id="edit-confirm-password"
											type={showNewPass ? "text" : "password"}
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											placeholder="Repeat new password"
										/>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Account Badge Info */}
					<div className={styles.membershipBadge}>
						<ShieldCheck size={18} className={styles.shieldIcon} />
						<div className={styles.membershipDetails}>
							<span className={styles.badgeTitle}>Ultra HD 4K Streaming Active</span>
							<span className={styles.badgeSub}>All devices supported • Unlimited access</span>
						</div>
					</div>

					{/* Modal Actions */}
					<div className={styles.actions}>
						<button
							type="button"
							className={styles.cancelBtn}
							onClick={closeAccountModal}
							disabled={isSubmitting}>
							Cancel
						</button>
						<button
							type="submit"
							className={styles.saveBtn}
							disabled={isSubmitting}>
							{isSubmitting ? "Saving Changes..." : "Save Changes"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default AccountModal;
