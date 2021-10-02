const usersRouter = require('express').Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');

usersRouter.get('/', async (request, response) => {
	const users = await User.find({}).populate('blogs', {
		url: 1,
		title: 1,
		author: 1,
	});

	response.json(users);
});

const validPassword = (password) => {
	return password.length >= 3;
};

usersRouter.post('/', async (request, response) => {
	const body = request.body;

	if (!validPassword(body.password)) {
		return response
			.status(400)
			.json({ error: 'password must be at least 3 characters long' });
	}

	const hashedPassword = await bcrypt.hash(body.password, 10);

	const user = new User({
		username: body.username,
		password: hashedPassword,
		name: body.name,
	});

	const savedUser = await user.save();

	response.json(savedUser);
});

module.exports = usersRouter;
