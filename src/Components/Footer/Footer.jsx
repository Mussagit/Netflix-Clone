import React from "react";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";

import styles from "./Footer.module.css";

function Footer() {
	const footerLinks = [
		["Audio Description", "Investor Relations", "Legal Notices"],
		["Help Centre", "Jobs", "Cookie Preferences"],
		["Gift Cards", "Terms of Use", "Corporate Information"],
		["Media Centre", "Privacy", "Contact Us"],
	];

	const socialIcons = [
		{ icon: <FaFacebookF />, label: "Facebook" },
		{ icon: <FaInstagram />, label: "Instagram" },
		{ icon: <FaTwitter />, label: "Twitter" },
		{ icon: <FaYoutube />, label: "YouTube" },
	];

	return (
		<footer className={styles.footer}>
			<div className={styles.container}>
				{/* Social Media Icons */}
				<div className={styles.socialLinks}>
					{socialIcons.map((social) => (
						<a
							href="#"
							key={social.label}
							className={styles.socialIcon}
							aria-label={social.label}>
							{social.icon}
						</a>
					))}
				</div>

				{/* Footer Links */}
				<div className={styles.linksContainer}>
					{footerLinks.map((column, index) => (
						<div className={styles.linkColumn} key={index}>
							{column.map((link) => (
								<a href="#" key={link} className={styles.footerLink}>
									{link}
								</a>
							))}
						</div>
					))}
				</div>

				{/* Copyright */}
				<p className={styles.copyright}>© 1997-2026 Netflix, Inc.</p>
			</div>
		</footer>
	);
}

export default Footer;
