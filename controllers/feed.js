const fs = require('fs/promises');
const path = require('path');
const { validationResult } = require('express-validator');
const Post = require('../models/post');
const User = require('../models/user');
const { errorHandler, serverError } = require('../error/errorHandling');
const io = require('../socket');

// Get multiple posts
exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: 'Fetched posts successfully.',
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    serverError(err);
    next(err);
  }
};

// Create a post
exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  errorHandler(errors, 'Validation failed, entered data is incorrect.', 422);
  errorHandler(req.file, 'No image provided', 422);

  const imageUrl = req.file.path;
  const { title, content } = req.body;

  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    io.getIO().emit('posts', {
      action: 'create',
      post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
    });
    // Create post in db
    // 201 -> Success a resource was created
    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator: { _id: user._id, name: user.name },
    });
  } catch (err) {
    serverError(err);
    next(err); // Throwing an errow won't work, because in async code snippet
  }
};

// Get a post
exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId).populate('creator');
    errorHandler(post, 'Could not find post', 404); // unprocessable entity
    res.status(200).json({ message: 'Post fetched.', post: post });
  } catch (err) {
    serverError(err);
    next(err);
  }
};

// Update a post
exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  errorHandler(errors, 'Validation failed, entered data is incorrect.', 422); // 404 unprocessable entity

  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image; // no new file picked

  // if file was picked
  if (req.file) {
    imageUrl = req.file.path;
  }
  errorHandler(imageUrl, 'No file picked', 422);
  try {
    const post = await Post.findById(postId).populate('creator');
    errorHandler(post, 'Could not find post', 404);
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    const result = await post.save();
    io.getIO().emit('posts', { action: 'update', post: result });
    res.status(200).json({ message: 'Post updated!', post: result });
  } catch (err) {
    serverError(err);
    next(err);
  }
};

// Delete a post
exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId);
    errorHandler(post, 'Could not find post.', 404); // 404 not found

    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    io.getIO().emit('posts', { action: 'delete', post: postId });
    res.status(200).json({ message: 'Deleted post' });
  } catch (err) {
    serverError(err);
    next(err);
  }
};

// Helper function
// ================================ //
const clearImage = async filePath => {
  filep = path.join(__dirname, '..', filePath);
  try {
    await fs.unlink(filep);
  } catch (err) {
    console.log(err);
  }
};
