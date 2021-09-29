const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);
const Blog = require('../models/blog');
const helper = require('./blog_api_test_helper');

beforeEach(async () => {
	await Blog.deleteMany({});

	for (const blog of helper.initialBlogs) {
		let newBlog = new Blog(blog);
		await newBlog.save();
	}
});

test('blogs are returned as json', async () => {
	const response = await api
		.get('/api/blogs')
		.expect(200)
		.expect('Content-Type', /application\/json/);

	const blogs = response.body;
	const blogAuthors = blogs.map((b) => {
		return b.author;
	});

	expect(blogs).toHaveLength(helper.initialBlogs.length);
	expect(blogAuthors).toContain(helper.initialBlogs[0].author);
});

test('blogs have the unique identifier id (not _id)', async () => {
	const response = await api
		.get('/api/blogs')
		.expect(200)
		.expect('Content-Type', /application\/json/);

	const blogs = response.body;
	blogs.forEach((blog) => {
		expect(blog.id).toBeDefined();
	});
});

test('a valid blog can be added', async () => {
	const newBlog = {
		title: 'Test Blog Title',
		author: 'John Doe',
		url: 'http://johndoeblog.com',
		likes: 0,
	};

	const response = await api
		.post('/api/blogs')
		.send(newBlog)
		.expect(201)
		.expect('Content-Type', /application\/json/);

	const blogsInDb = await helper.blogsInDb();
	expect(blogsInDb).toHaveLength(helper.initialBlogs.length + 1);

	const createdBlog = response.body;
	expect(createdBlog).toEqual(expect.objectContaining(newBlog));
});

test('newly added blog without likes default to 0 likes', async () => {
	const newBlog = {
		title: 'Test Blog Title',
		author: 'John Doe',
		url: 'http://johndoeblog.com',
	};

	const response = await api
		.post('/api/blogs')
		.send(newBlog)
		.expect(201)
		.expect('Content-Type', /application\/json/);

	const blogsInDb = await helper.blogsInDb();
	expect(blogsInDb).toHaveLength(helper.initialBlogs.length + 1);

	const createdBlog = response.body;
	expect(createdBlog.likes).toBeDefined();
	expect(createdBlog.likes).toBe(0);
});

test('blog without title is not added', async () => {
	const newBlog = {
		author: 'John Doe',
		url: 'http://johndoeblog.com',
	};

	await api.post('/api/blogs').send(newBlog).expect(400);

	const blogsAfterPost = await helper.blogsInDb();
	expect(blogsAfterPost).toHaveLength(helper.initialBlogs.length);
});

test('blog without url is not added', async () => {
	const newBlog = {
		title: 'Test Blog Title',
		author: 'John Doe',
	};

	await api.post('/api/blogs').send(newBlog).expect(400);

	const blogsAfterPost = await helper.blogsInDb();
	expect(blogsAfterPost).toHaveLength(helper.initialBlogs.length);
});

afterAll(() => {
	mongoose.connection.close();
});
