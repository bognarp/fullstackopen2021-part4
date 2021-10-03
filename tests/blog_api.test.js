const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);
const Blog = require('../models/blog');
const User = require('../models/user');
const helper = require('./test_helper');

beforeEach(async () => {
	await Blog.deleteMany({});
	await User.deleteMany({});

	const userA = await helper.createUser({
		username: 'testing_blog_api_userA',
		name: 'Tester A',
		password: 'testing',
	});
	const userB = await helper.createUser({
		username: 'testing_blog_api_userB',
		name: 'Tester B',
		password: 'testing',
	});

	let index = 0;
	for (const blog of helper.initialBlogs) {
		if (index % 2 === 0) {
			await helper.createBlogByUser(blog, userA);
		} else {
			await helper.createBlogByUser(blog, userB);
		}
		index++;
	}
});

describe('when requesting blogs already saved in the db', () => {
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
});

describe('when adding a new blog with authenticated user', () => {
	test('request fails when token not provided', async () => {
		const newBlog = {
			title: 'Test Blog Title',
			author: 'John Doe',
			url: 'http://johndoeblog.com',
			likes: 0,
		};

		await api
			.post('/api/blogs')
			.send(newBlog)
			.expect(401)
			.expect('Content-Type', /application\/json/);

		const blogsInDb = await helper.blogsInDb();
		expect(blogsInDb).toHaveLength(helper.initialBlogs.length);
	});

	test('valid blog gets persisted to the db', async () => {
		const user = await User.find({ username: 'testing_blog_api_userA' });
		const token = helper.createTokenFor(user[0]);

		const newBlog = {
			title: 'Test Blog Title',
			author: 'John Doe',
			url: 'http://johndoeblog.com',
			likes: 0,
		};

		const response = await api
			.post('/api/blogs')
			.set('Authorization', `bearer ${token}`)
			.send(newBlog)
			.expect(201)
			.expect('Content-Type', /application\/json/);

		const blogsInDb = await helper.blogsInDb();
		expect(blogsInDb).toHaveLength(helper.initialBlogs.length + 1);

		const createdBlog = response.body;
		expect(createdBlog).toEqual(expect.objectContaining(newBlog));
	});

	test('valid blog without likes default to 0 likes', async () => {
		const user = await User.find({
			username: 'testing_blog_api_userA',
		});
		const token = helper.createTokenFor(user[0]);

		const newBlog = {
			title: 'Test Blog Title',
			author: 'John Doe',
			url: 'http://johndoeblog.com',
		};

		const response = await api
			.post('/api/blogs')
			.set('Authorization', `bearer ${token}`)
			.send(newBlog)
			.expect(201)
			.expect('Content-Type', /application\/json/);

		const blogsInDb = await helper.blogsInDb();
		expect(blogsInDb).toHaveLength(helper.initialBlogs.length + 1);

		const createdBlog = response.body;
		expect(createdBlog.likes).toBeDefined();
		expect(createdBlog.likes).toBe(0);
	});

	test('without title it fails with status code 400', async () => {
		const user = await User.find({
			username: 'testing_blog_api_userA',
		});
		const token = helper.createTokenFor(user[0]);

		const newBlog = {
			author: 'John Doe',
			url: 'http://johndoeblog.com',
		};

		await api
			.post('/api/blogs')
			.set('Authorization', `bearer ${token}`)
			.send(newBlog)
			.expect(400);

		const blogsAfterPost = await helper.blogsInDb();
		expect(blogsAfterPost).toHaveLength(helper.initialBlogs.length);
	});

	test('without url it fails with status code 400', async () => {
		const user = await User.find({
			username: 'testing_blog_api_userA',
		});
		const token = helper.createTokenFor(user[0]);

		const newBlog = {
			title: 'Test Blog Title',
			author: 'John Doe',
		};

		await api
			.post('/api/blogs')
			.set('Authorization', `bearer ${token}`)
			.send(newBlog)
			.expect(400);

		const blogsAfterPost = await helper.blogsInDb();
		expect(blogsAfterPost).toHaveLength(helper.initialBlogs.length);
	});
});

describe('when deleting a blog with authenticated user', () => {
	test('with valid id it succeeds with status code 204', async () => {
		const user = await User.find({ username: 'testing_blog_api_userA' });
		const token = helper.createTokenFor(user[0]);

		const blogsBefore = await helper.blogsInDb();
		const blogToDelete = blogsBefore[0];

		await api
			.delete(`/api/blogs/${blogToDelete.id}`)
			.set('Authorization', `bearer ${token}`)
			.expect(204);

		const blogsAfter = await helper.blogsInDb();
		expect(blogsAfter).toHaveLength(blogsBefore.length - 1);

		const blogTitles = blogsAfter.map((b) => {
			b.title;
		});
		expect(blogTitles).not.toContain(blogToDelete.title);
	});

	test('with invalid id it fails with status code 400', async () => {
		const user = await User.find({ username: 'testing_blog_api_userA' });
		const token = helper.createTokenFor(user[0]);
		const invalidId = '61521c3f78d6472121800e9';

		await api
			.delete(`/api/blogs/${invalidId}`)
			.set('Authorization', `bearer ${token}`)
			.expect(400);
	});

	test('when blog does not belong to the user it fails with status code 403', async () => {
		const user = await User.find({ username: 'testing_blog_api_userA' });
		const token = helper.createTokenFor(user[0]);

		const blogsBefore = await helper.blogsInDb();
		const blogToDelete = blogsBefore[1];

		await api
			.delete(`/api/blogs/${blogToDelete.id}`)
			.set('Authorization', `bearer ${token}`)
			.expect(403);

		const blogsAfter = await helper.blogsInDb();
		expect(blogsAfter).toHaveLength(blogsBefore.length);
	});
});

describe('when requesting a specific blog', () => {
	test('with valid id it gets returned as json', async () => {
		const blogs = await helper.blogsInDb();
		const blogToRequest = blogs[0];

		const response = await api
			.get(`/api/blogs/${blogToRequest.id}`)
			.expect(200)
			.expect('Content-Type', /application\/json/);

		const parsedBlog = JSON.parse(JSON.stringify(blogToRequest));
		expect(response.body).toEqual(parsedBlog);
	});

	test('with invalid id it fails with status code 400', async () => {
		const invalidId = '61521c3f78d6472121800e9';

		await api.get(`/api/blogs/${invalidId}`).expect(400);
	});

	test('with valid but non-existing id it fails with status code 404', async () => {
		const nonexistingId = await helper.nonexistingId();

		await api.get(`/api/blogs/${nonexistingId}`).expect(404);
	});
});

describe('when updating a blog', () => {
	test('with valid id it returns the updated blog as json', async () => {
		const blogsBefore = await helper.blogsInDb();
		const blogToUpdate = blogsBefore[0];

		const update = {
			title: 'React patterns',
			author: 'Michael Chan',
			url: 'https://reactpatterns.com/',
			likes: 7000,
		};

		const response = await api
			.put(`/api/blogs/${blogToUpdate.id}`)
			.send(update)
			.expect(200)
			.expect('Content-Type', /application\/json/);

		const blogsAfter = await helper.blogsInDb();
		expect(blogsAfter).toHaveLength(blogsBefore.length);

		const updatedBlog = response.body;
		expect(updatedBlog).toEqual(expect.objectContaining(update));
	});

	test('with nonexisting id it fails with satus code 404', async () => {
		const nonexistingId = await helper.nonexistingId();

		const update = {
			title: 'React patterns',
			author: 'Michael Chan',
			url: 'https://reactpatterns.com/',
			likes: 7000,
		};

		await api.put(`/api/blogs/${nonexistingId}`).send(update).expect(404);
	});

	test('with invalid id it fails with status code 400', async () => {
		const invalidId = '61521c3f78d6472121';

		const update = {
			title: 'React patterns',
			author: 'Michael Chan',
			url: 'https://reactpatterns.com/',
			likes: 7000,
		};

		await api.put(`/api/blogs/${invalidId}`).send(update).expect(400);
	});
});

afterAll(() => {
	mongoose.connection.close();
});
