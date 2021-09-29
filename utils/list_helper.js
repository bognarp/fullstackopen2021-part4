const dummy = (blogs) => {
	return 1;
};

const totalLikes = (blogs) => {
	if (blogs.length === 0) {
		return 0;
	}

	return blogs.reduce((acc, blog) => {
		return acc + blog.likes;
	}, 0);
};

const favoriteBlog = (blogs) => {
	const mostLiked = _.maxBy(blogs, function (blog) {
		return blog.likes;
	});

	return {
		title: mostLiked.title,
		author: mostLiked.author,
		likes: mostLiked.likes,
	};
};

const mostBlogs = (blogs) => {
	const counter = _.countBy(blogs, 'author');
	const maxBlogs = _.max(_.values(counter));
	const author = _.findKey(counter, function (e) {
		return e === maxBlogs;
	});

	return {
		author: author,
		blogs: maxBlogs,
	};
};

const mostLikes = (blogs) => {
	const counterObj = {};

	blogs.forEach((blog) => {
		if (counterObj[blog.author] === undefined) {
			counterObj[blog.author] = blog.likes;
		} else {
			counterObj[blog.author] += blog.likes;
		}
	});

	const maxLikes = _.max(_.values(counterObj));
	const author = _.findKey(counterObj, function (a) {
		return a === maxLikes;
	});

	return {
		author: author,
		likes: maxLikes,
	};
};

module.exports = {
	dummy,
	totalLikes,
	favoriteBlog,
	mostBlogs,
	mostLikes,
};
