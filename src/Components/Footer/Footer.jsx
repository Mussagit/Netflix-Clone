import React, { useState } from "react";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import styles from "./Footer.module.css";

function Footer() {
	const [serviceCode, setServiceCode] = useState(null);

	const footerLinks = [
		["Audio Description", "Investor Relations", "Legal Notices"],
		["Help Centre", "Jobs", "Cookie Preferences"],
		["Gift Cards", "Terms of Use", "Corporate Information"],
		["Media Centre", "Privacy", "Contact Us"],
	];

	const socialIcons = [
		{ icon: <FaFacebookF />, label: "Facebook", url: "https://facebook.com/netflix" },
		{ icon: <FaInstagram />, label: "Instagram", url: "https://instagram.com/netflix" },
		{ icon: <FaTwitter />, label: "Twitter", url: "https://twitter.com/netflix" },
		{ icon: <FaYoutube />, label: "YouTube", url: "https://youtube.com/netflix" },
	];

	return (
		<footer className={styles.footer}>
			<div className={styles.container}>
				{/* Social Media Icons */}
				<div className={styles.socialLinks}>
					{socialIcons.map((social) => (
						<a
							href={social.url}
							target="_blank"
							rel="noopener noreferrer"
							key={social.label}
							className={styles.socialIcon}
							aria-label={social.label}>
							{social.icon}
						</a>
					))}
				</div>

				{/* Footer Navigation Links */}
				<div className={styles.linksContainer}>
					{footerLinks.map((column, colIdx) => (
						<div className={styles.linkColumn} key={colIdx}>
							{column.map((link) => (
								<a href="#footer" key={link} className={styles.footerLink}>
									{link}
								</a>
							))}
						</div>
					))}
				</div>

				{/* Service Code Button */}
				<div className={styles.serviceCodeSection}>
					<button
						className={styles.serviceCodeBtn}
						onClick={() =>
							setServiceCode(
								serviceCode ? null : `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`
							)
						}>
						{serviceCode ? `Service Code: ${serviceCode}` : "Service Code"}
					</button>
				</div>

				{/* Copyright */}
				<p className={styles.copyright}>© 1997-2026 Netflix, Inc. Built with React & Vite.</p>
			</div>
		</footer>
	);
}

export default Footer;
