// Root Serverless Function for Vercel Monorepo Deployment
// Dynamically imports the unified ES module serverless API handler using pathToFileURL

const path = require("path");
const { pathToFileURL } = require("url");

module.exports = async (req, res) => {
	const modulePath = pathToFileURL(path.join(__dirname, "..", "frontend", "api", "index.js")).href;
	const handlerModule = await import(modulePath);
	const handler = handlerModule.default || handlerModule;
	return handler(req, res);
};
