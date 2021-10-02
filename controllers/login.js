const loginRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');

loginRouter.post('/', async (request, response) => {
	const body = request.body;
	const user = await User.findOne({ username: body.username });
	let correctPassword = null;

	if (user !== null) {
		correctPassword = await bcrypt.compare(body.password, user.password);
	}

	if (!user || !correctPassword) {
		return response.status(401).json({ error: 'invalid password or username' });
	}

	const userForToken = {
		username: user.username,
		id: user._id,
	};

	const token = jwt.sign(userForToken, process.env.SECRET, {
		expiresIn: 60 * 60,
	});

	response.status(200).send({
		token,
		username: user.username,
		name: user.name,
	});
});

module.exports = loginRouter;
