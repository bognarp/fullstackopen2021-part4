const Blog = require('../models/blog');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const initialBlogs = [
	{
		title: 'React patterns',
		author: 'Michael Chan',
		url: 'https://reactpatterns.com/',
		likes: 7,
	},
	{
		title: 'Go To Statement Considered Harmful',
		author: 'Edsger W. Dijkstra',
		url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
		likes: 5,
	},
	{
		title: 'Canonical string reduction',
		author: 'Edsger W. Dijkstra',
		url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
		likes: 12,
	},
];

const blogsInDb = async () => {
	const blogs = await Blog.find({});
	return blogs.map((blog) => blog.toJSON());
};

const nonexistingId = async () => {
	const blog = new Blog({ title: 'test title', url: 'test url' });
	await blog.save();
	await blog.remove();

	return blog._id.toString();
};

const usersInDb = async () => {
	const users = await User.find({});
	return users.map((user) => {
		return user.toJSON();
	});
};

const createBlogByUser = async (blog, user) => {
	const newBlog = new Blog({
		title: blog.title,
		author: blog.author,
		user: user._id,
		url: blog.url,
		likes: blog.likes,
	});

	const savedBlog = await newBlog.save();
	user.blogs = user.blogs.concat(savedBlog._id);
	await user.save();
};

const createUser = async (userObj) => {
	const password = await bcrypt.hash(userObj.password, 10);
	const user = new User({
		username: userObj.username,
		name: userObj.name,
		password,
	});

	return await user.save();
};

const createTokenFor = (user) => {
	const userForToken = {
		username: user.username,
		id: user._id,
	};

	return jwt.sign(userForToken, process.env.SECRET, {
		expiresIn: 60 * 60,
	});
};

module.exports = {
	initialBlogs,
	blogsInDb,
	nonexistingId,
	usersInDb,
	createBlogByUser,
	createUser,
	createTokenFor,
};
