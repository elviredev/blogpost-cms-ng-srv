const express = require('express');
const router = express.Router();
const Blogpost = require('../models/blogpost');
const mongoose = require('mongoose');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const resize = require('../../utils/resize');

router.get('/ping', (req, res) => {
	res.status(200).json({ msg: 'pong', date: new Date() });
}); // GET localhost:3000/ping

router.get('/blog-posts', (req, res) => {
	// vérification login passport OK
	console.log('req.user', req.user);
	
	Blogpost.find()
		.sort({ 'createdOn' : -1 })
		.exec()
		.then(blogPosts => res.status(200).json(blogPosts))
		.catch(err => res.status(500).json({
			message: 'blog posts not found :(',
			error: err
		}));
}); // GET localhost:3000/api/v1/blog-posts

router.get('/blog-posts/:id', (req, res) => {
	const id = req.params.id;
	Blogpost.findById(id)
		.then(blogPost => res.status(200).json(blogPost))
		.catch(err => res.status(500).json({
			message: `blog post with id ${id} not found`,
			error: err
		}));
}); // GET localhost:3000/api/v1/blog-posts/a1z2er2

router.post('/blog-posts', (req, res) => {
	console.log('req.body', req.body);
	//const blogPost = new Blogpost(req.body);
	//const blogPost = new Blogpost({... req.body, image: lastUploadedImageName });
	const smallImagePath = `./uploads/${lastUploadedImageName}`;
	const outputName = `./uploads/small-${lastUploadedImageName}`;
	resize({path: smallImagePath, width: 200, height: 200, outputName: outputName})
		.then(data => {
			console.log('OK resize', data.size);
		})
		.catch(err => console.error('error from resize', error));
	
		const blogPost = new Blogpost({
			...req.body,
			image: lastUploadedImageName,
			smallImage: `small-${lastUploadedImageName}`
		});

	blogPost.save((err, blogPost) => {
		if (err) {
			return res.status(500).json(err);
		}
		res.status(201).json(blogPost);
	});
}); // POST localhost:3000/api/v1/blog-posts

router.delete('/blog-posts/:id', (req, res) => {
	// console.log('req.isAuthenticated', req.isAuthenticated());
	// req.logOut(); // TODO DELETE !!!! pour le test !
	console.log('req.isAuthenticated', req.isAuthenticated());
	if(!req.isAuthenticated()) {
		return res.status(401).json({ result: 'KO', msg: 'NOT authorized to delete a blog post' })
	}
	const id = req.params.id;
	Blogpost.findByIdAndDelete(id, (err, blogPost) => {
		if (err) {
			return res.status(500).json(err);
		}
		res.status(202).json({ msg: `blog post with ${blogPost._id} deleted` });
	});
}); // DELETE localhost:3000/api/v1/blog-posts/a1z2er2

router.delete('/blog-posts', (req, res) => {
	const ids = req.query.ids; // recupère un query parameter 'ids' qui est une string
	console.log('query ids', ids);
	// cast string id en ObjectId
	const allIds = ids.split(',').map(id => {
		if(id.match(/^[0-9a-fA-F]{24}?/)) {
			return mongoose.Types.ObjectId(id);
		} else {
			console.log('id is not valid', id);
		}
	}); // DELETE localhost:3000/api/v1/blog-posts

	// suppression documents en BDD via mongoose
	const condition = { _id: { $in : allIds } };
	Blogpost.deleteMany(condition, (err, result) => {
		if(err) {
			return res.status(500).json(err);
		}
		res.status(202).json(result);
	});
});

let lastUploadedImageName = '';

// file upload configuration : MULTER
const storage = multer.diskStorage({
	destination: './uploads/',
	filename: function(req, file, callback) {
		crypto.pseudoRandomBytes(16, function(err, raw) {
			if(err) return callback(err);
			//callback(null, raw.toString('hex') + path.extname(file.originalname));
			lastUploadedImageName = raw.toString('hex') + path.extname(file.originalname);
			console.log('lastUploadedImageName', lastUploadedImageName);
			callback(null, lastUploadedImageName);
		});
	}
});

var upload = multer({ storage: storage });

// file upload : post
router.post('/blog-posts/images', upload.single('image'), (req, res) => {
	if(!req.file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
		return res.status(400).json({ message: 'only image files please' });
	}
	res.status(201).send({ filename: req.file.filename, file: req.file });
}); // POST localhost:3000/api/v1/blog-posts

router.put('/blog-posts/:id', upload.single('image'), (req, res) => {
	const id = req.params.id;
	const conditions = { _id: id };
	const blogPost = { ...req.body, image: lastUploadedImageName };
	const update = { $set: blogPost };
	const options = {
		upsert: true,
		new: true
	};
	Blogpost.findOneAndUpdate(conditions, update, options, (err, response) => {
		if(err) return res.status(500).json({ msg: 'update failed', error: err });
		res.status(200).json( { msg: `document with id ${id} updated`, response: response })
	}); // PUT localhost:3000/api/v1/blog-posts/a1z2eert
});

module.exports = router;

