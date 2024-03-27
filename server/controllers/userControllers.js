
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken")
const fs = require('fs')
const path = require('path')
const {v4: uuid} = require('uuid')

const User = require("../models/userModel")
const HttpError = require('../models/errorModel')


// ============= REGISTER A NEW USER
// POST REQUEST : api/users/register
// UNPROTECTED
const registerUser = async (req, res, next) => {
    try {
        const {name, email, password, password2} = req.body;
        if(!name || !email || !password){
            return next(new HttpError("Fill in all fields.", 422))
        }

        const newEmail = email.toLowerCase();

        // check if user already registered
        const emailExists = await User.findOne({email: newEmail})
        if(emailExists){
            return next(new HttpError("Email already registered", 422))
        }

        // Password length should be must be greater than 6
        if((password.trim()).length < 6){
            return next(new HttpError("Password should be at least 6 characters", 422))
        }

        // if both password are incorrect
        if(password !== password2){
            return next(new HttpError("Passwords do match", 422))
        }

        // Hasing password
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);

        // create user entry in database
        const newUser = await User.create({name, email: newEmail, password: hashedPass})

        res.status(201).json(`New user: ${newUser.email} is registered`)

    } catch (error) {
        return next(new HttpError("User registration failed", 423));
    }
};

// ============= LOGIN A REGISTER USER
// POST REQUEST : api/users/login
// UNPROTECTED
const loginUser = async (req, res, next) => {
    try {

        // fetch data
        const {email, password} = req.body;
        if(!email || !password){
            return next(new HttpError("Fill in all fields", 422))
        }
        const newEmail = email.toLowerCase();
        // Find user
        const user = await User.findOne({email: newEmail});
        if(!user){
            return next(new HttpError("Invalid email", 422));
        }
        // Check password
        const comparePass =await bcrypt.compare(password, user.password);
        if(!comparePass){
            return next(new HttpError("Invalid password", 422));
        }

        // Generate token
        const {_id: id, name} = user;
        const token = jwt.sign({id, name}, process.env.JWT_SECRET, {expiresIn: "1d"});

        // return response

        res.status(200).json({token, id, name});
    } catch (error) {
        return next(new HttpError("Login failed, please check your credientials", 422));
    }
};

// ============= USER PROFILE
// GET REQUEST : api/users/:id
// PROTECTED
const getUser = async (req, res, next) => {
    try {
        const {id} = req.params;
        const user = await User.findById(id).select('-password');
        if(!user){
            return next(new HttpError("User not found", 404));
        }
        return res.status(200).json(user);
    } catch (error) {
        return next(new HttpError(error));
    }
};



// ============= CHANGE A USER AVATAR
// POST REQUEST : api/users/change-avatar
// PROTECTED
const changeAvatar = async (req, res, next) => {
    try {
        if(!req.files.avatar){
            return next(new HttpError("Please chose an image", 422))
        }

        // find user from database
        const user = await User.findById(req.user.id);
        // delete old avatar if exists
        if(user.avatar){
            fs.unlink(path.join(__dirname, '..', 'uploads', user.avatar), (err)=>{
                if(err){
                    return next(new HttpError(err));
                }
            })
        }

        const {avatar} = req.files;
        // check file size

        if(avatar.size > 500000){
            return next(new HttpError("Profile picture is too big should be less than 500kb", 422))
        }

        let fileName;
        fileName = avatar.name;

        let splittedFileName = fileName.split('.')
        let newFileName = splittedFileName[0] + uuid() + '.' + splittedFileName[splittedFileName.length - 1];
        avatar.mv(path.join(__dirname, '..', 'uploads', newFileName), async (err)=>{
            if(err){
                return next(new HttpError(err));
            }

            const updatedAvatar = await User.findByIdAndUpdate(req.user.id, {avatar: newFileName}, {new: true});
            if(!updatedAvatar){
                return next(new HttpError("Avatar could not be changed", 422));
            }
            res.status(200).json(updatedAvatar);
        })

    } catch (error) {
        return next(new HttpError(error));
    }
};

// ============= EDIT USER DETAILS
// POST REQUEST : api/users/edit-user
// PROTECTED
const editUser = async (req, res, next) => {
    try {
        const {name, email, currentPassword, newPassword, confirmNewPassword} = req.body;
        if(!name || !email || !currentPassword  || !newPassword || !confirmNewPassword ){
            return next(new HttpError("Fill in all fields", 422));
        }
        
        // get user from db
        const user = await User.findById(req.user.id);
        if(!user){
            return next(new HttpError("User not found", 403));
        }
        
        // make sure new email already exists
        const emailExists = await User.findOne({email});
        
        // we want to update other details with/ withour changing the email (which is unique if because we use it to log in)
        if(emailExists && (emailExists._id != req.user.id)){
            console.log("error 2")
            return next(new HttpError("Email already exists", 422))
        }

        // compare password to database passowrd
        const validatePassword = await bcrypt.compare(currentPassword, user.password);
        if(!validatePassword){
            return next(new HttpError("Invalid current password", 422))
        }

        // compare new password 
        if(newPassword != confirmNewPassword){
            return next(new HttpError("New passwords do not match", 422))
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // update user info in database
        const newInfo = await User.findByIdAndUpdate(req.user.id, {name, email, password: hashedPassword}, {new: true});
        return res.status(200).json(newInfo);

    } catch (error) {
        console.log("erroras")
        return next(new HttpError(error));
    }
};



// ============= GET AUTHORS
// GET REQUEST : api/users/edit-user
// UNPROTECTED
const getAuthors = async (req, res, next) => {
    try {
        const authors = await User.find().select('-password')
        res.json(authors);
    } catch (error) {
        return next(new HttpError(error));
    }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
  changeAvatar,
  editUser,
  getAuthors,
};
