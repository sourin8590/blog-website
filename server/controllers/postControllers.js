const Post = require("../models/postModel");
const User = require("../models/userModel");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const HttpError = require("../models/errorModel");



// ============================ Create a post
// POst: api/posts
// Protected
const createPost = async (req, res, next) => {
  try {
    let { title, category, description } = req.body;
    if (!title || !category || !description) {
      return next(
        new HttpError("Fill in all details and chose thumbnail", 422)
      );
    }
    const { thumbnail } = req.files;
    // chech file size
    if (thumbnail.size > 2000000) {
      return next(
        new HttpError("File is too large it should be less than 2MB")
      );
    }
    let fileName = thumbnail.name;
    let splittedFileName = fileName.split(".");
    let newFileName =
      splittedFileName[0] +
      uuid() +
      "." +
      splittedFileName[splittedFileName.length - 1];

    // upload thumbnail
    thumbnail.mv(
      path.join(__dirname, ".." + "/uploads", newFileName),
      async (err) => {
        if (err) {
          return next(new HttpError(err));
        } else {
          const newPost = await Post.create({
            title,
            category,
            description,
            thumbnail: newFileName,
            creator: req.user.id,
          });
          if (!newPost) {
            return next(new HttpError("Post could not be created", 422));
          }
          // find user and increase post count by 1
          const currentUser = await User.findById(req.user.id);
          const userPostCount = currentUser.posts + 1;
          await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });

          res.status(201).json(newPost);
        }
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};







// ========================= Get all posts
// Get: api/posts
// Protected
const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};






// ========================== Get single post
// GET: apu/posts/:id
// Unprotected

const getPost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if(!post){
            return next(new HttpError("Post not found with the given id", 500))
        }
        res.status(200).send(post);
    } catch (error) {
        return next(new HttpError(error));
    }
}






// ================== Get post by category
// Get : api/posts/categories/:category
// unprotected

const getCatPost = async (req, res, next) => {
    try {
        const {category} = req.params;
        const catPosts = await Post.find({category}).sort({createdAt: -1});
        res.status(200).json(catPosts)
    } catch (error) {
        return next(new HttpError(error));
    }
}






// ================= Get users post
// GET: api/posts/users/:id
// unprotected
const getUserPosts = async (req, res, next) => {
    try {
        const {id} = req.params;
        const posts = await Post.find({creator: id}).sort({createdAt: -1});
        res.status(200).json(posts);
    } catch (error) {
        return next(new HttpError(error));
    }
}





// ================== Edit post
// Patch: api/posts/:id
// Protected
const editPost = async (req, res, next) => {
    try {
        let fileName;
        let newFileName;
        let updatedPost;

        const postId = req.params.id;
        const oldPost = await Post.findById(postId);
        console.log(oldPost.creator + '    ' + req.user.id)
        if(oldPost.creator != req.user.id){
            return next(new HttpError("You are not allowed to edit this post", 403))
        }
        else {
            let {title, category, description} = req.body;
    
            if(!title || !category || description.length < 12){
                return next(new HttpError("Fill in all required fields", 422))   
            }
            if(!req.files){
                updatedPost = await Post.findByIdAndUpdate(postId, {title, category, description}, {new:  true});
            }
            else {
                // get old post from database
                const oldPost = await Post.findById(postId);
                fs.unlink(path.join(__dirname,'..', 'uploads', oldPost.thumbnail), async (err) => {
                    if(err){
                        return next(new HttpError(err))
                    }
                })
    
                // Upload a new thumbnail
                const {thumbnail} = req.files;
                // check file size
                if(thumbnail.size > 2000000){
                    return next(new HttpError("Thumnail should be less than 2mb"))
                }
    
                fileName = thumbnail.name;
                let splittedFileName = fileName.split('.');
                newFileName = splittedFileName[0] + uuid() + '.' + splittedFileName[splittedFileName.length-1]
                thumbnail.mv(path.join(__dirname, '..' + '/uploads', newFileName), async (err) =>{
                    if(err) {
                        return next(new HttpError(err))
                    }
                })
    
                // updated post in db
                updatedPost = await Post.findByIdAndUpdate(postId, {title, category, description, thumbnail: newFileName}, {new: true})
            }
            if(!updatedPost){
                return next(new HttpError("Could not update post"))
            }
    
            res.status(200).send(updatedPost);

        }

    } catch (error) {
        return next(new HttpError(error));
    }
}





// =================== Delete post
// Delete: api/posts/:id
// Protected
const deletePost = async (req, res, next) =>{
    try {
        const postId = req.params.id;
        if(!postId) {
            return next(new HttpError("Post unavailable", 400))
        }
        const post = await Post.findById(postId);
        const fileName = post?.thumbnail;
        if(req.user.id == post.creator){
            // delete thumbnail from upload folder
            fs.unlink(path.join(__dirname, '..', 'uploads', fileName), async (err) =>{
                if(err) {
                    return next(new HttpError("unable to delete post thumbnail", 501));
                }
                else {
                    await Post.findByIdAndDelete(postId);
    
                    // find user and reduce post count by 1
                    const currentUser = await User.findById(req.user.id);
                    const userPostCount = currentUser.posts - 1;
                    await User.findByIdAndUpdate(req.user.id, { $set: { posts: userPostCount }});
                    res.status(200).json(`Post ${postId} deleted successfully`)
                }
            })
        }
        else {
            return next(new HttpError("Post could not be deleted", 403))
        }

    } catch (error) {
        return next(new HttpError("Error while deleting post", 500));
    }
}



module.exports = { createPost, getPosts, getPost, getCatPost, getUserPosts, editPost, deletePost };
