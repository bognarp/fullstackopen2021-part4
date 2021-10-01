const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);
const User = require('../models/user');
const helper = require('./test_helper');
const bcrypt = require('bcrypt');

describe('when there is initially one user in db', () => {
	beforeEach(async () => {
		await User.deleteMany({});

		const password = await bcrypt.hash('admin', 10);
		const user = new User({ username: 'root', password });

		await user.save();
	});

	test('creation succeeds with a valid new username', async () => {
		const usersAtStart = await helper.usersInDb();

		const newUser = {
			username: 'tesztelek420',
			name: 'Teszt Elek',
			password: '1234',
		};

		await api
			.post('/api/users')
			.send(newUser)
			.expect(200)
			.expect('Content-Type', /application\/json/);

		const usersAtEnd = await helper.usersInDb();
		expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

		const usernames = usersAtEnd.map((user) => user.username);
		expect(usernames).toContain(newUser.username);
	});

	test('creation fails with status code 400 and message if username already taken', async () => {
		const usersAtStart = await helper.usersInDb();

		const newUser = {
			username: 'root',
			name: '',
			password: 'admin',
		};

		const response = await api
			.post('/api/users')
			.send(newUser)
			.expect(400)
			.expect('Content-Type', /application\/json/);

		expect(response.body.error).toContain('expected `username` to be unique');

		const usersAtEnd = await helper.usersInDb();
		expect(usersAtEnd).toHaveLength(usersAtStart.length);
	});

	test('creation fails with short username with status code 400 and message', async () => {
		const usersAtStart = await helper.usersInDb();

		const newInvalidUser = {
			username: 'Ab',
			name: 'Teszt Elek',
			password: '1234',
		};

		const response = await api
			.post('/api/users')
			.send(newInvalidUser)
			.expect(400)
			.expect('Content-Type', /application\/json/);

		expect(response.body.error).toContain(
			'shorter than the minimum allowed length'
		);

		const usersAtEnd = await helper.usersInDb();
		expect(usersAtEnd).toHaveLength(usersAtStart.length);
	});

	test('creation fails with missing username with status code 400 and message', async () => {
		const usersAtStart = await helper.usersInDb();

		const newInvalidUser = {
			username: '',
			name: 'Teszt Elek',
			password: '1234',
		};

		const response = await api
			.post('/api/users')
			.send(newInvalidUser)
			.expect(400)
			.expect('Content-Type', /application\/json/);

		expect(response.body.error).toContain('`username` is required.');

		const usersAtEnd = await helper.usersInDb();
		expect(usersAtEnd).toHaveLength(usersAtStart.length);
	});

	test('creation fails with short password with status code 400', async () => {
		const usersAtStart = await helper.usersInDb();

		const newInvalidUser = {
			username: 'tesztelek420',
			name: 'Teszt Elek',
			password: '12',
		};

		const response = await api
			.post('/api/users')
			.send(newInvalidUser)
			.expect(400);

		expect(response.body.error).toContain(
			'password must be at least 3 characters long'
		);

		const usersAtEnd = await helper.usersInDb();
		expect(usersAtEnd).toHaveLength(usersAtStart.length);
	});
});
