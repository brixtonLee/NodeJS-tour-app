const fs = require('fs');
const AppError = require('./../utils/appError');
const catchAsyncError = require('../utils/catchAsyncError');
const User = require('./../models/userModel');

const users = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/users.json`, 'utf8'));
const factory = require('./handlerFactory');

// Uploading User image
const multer = require('multer');
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//     // Destination (destination to store the uploaded image) could access to three parameters which are request, file(current file) and callback function
//     // Cb here is the callback function that acts like a next function
//     destination: (request, file, cb) => {
//         // null here means no error
//         cb(null, 'public/img/users');
//     },
//     filename: (request, file, cb) => {
//         //user-id-timestamp.jpg
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${request.user.id}-${Date.now()}.${ext}`);
//     }
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (request, file, cb) => {
    if(file.mimetype.startsWith('image')){
        cb(null, true);
    }
    else{
        cb(new AppError('Not an image, please upload only images', 404), false)
    }
}
const upload = multer({storage: multerStorage, fileFilter: multerFilter})

exports.uploadUserPhoto = upload.single('photo'), 

exports.resizeUserPhoto = catchAsyncError(async (request, response, next) => {
    if(!request.file) return next();

    request.file.filename = `user-${request.user.id}-${Date.now()}.jpeg`

    // By using the multer memory storage, the image is then be stored in the memory buffer which can be accessed by request.file.buffer
    await sharp(request.file.buffer).resize(500,500).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/img/users/${request.file.filename}`);

    next();
});

// //Route handlers
// exports.getAllUsers = async (request, response) => {
//     const users = await User.find();
//     response.status(200).json({status: 'success', result: users.length, data: {users: users}});
// }

exports.getAllUsers = factory.getAll(User);

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(key => {
        if (allowedFields.includes(key)) {
            newObj[key] = obj[key];
        }
    });
    return newObj;
}

exports.updateCurrentUser = catchAsyncError(async (request, response, next) => {
    // 1) Create Error if user post password data
    if(request.body.password || request.body.passwordConfirm){
        return next(new AppError('This route is not for password update, please use /updatePassword', 400))
    }
    // 2) Update User Document
    const filteredBody = filterObj(request.body, 'name', 'email');
    if(request.file) filteredBody.photo = request.file.filename;
    const updatedUser = await User.findByIdAndUpdate(request.user.id, filteredBody, {
        new: true,
        runValidators: true
    })

    response.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    })
});

exports.deleteCurrentUser = catchAsyncError(async (request, response, next) => {
    await User.findByIdAndUpdate(request.user.id, { active: false })
    response.status(204).json({
        status:'success',
        data: null
    })
});

exports.getMe = (request, response, next) => {
    request.params.id = request.user.id;
    next();
}

// exports.getUser = (request, response) => {
//     if(parseInt(request.params.id) > users.length) {
//         return response.status(404).json({status: 'fail', message: 'Invalid id'});
//     }
//     const user = users.find(user => user.id === parseInt(request.params.id));
//     response.status(200).json({status: 'success', data: {user: user}});
// }

exports.getUser = factory.getOne(User);

exports.createUser = (request, response) => {
    // const newId = users[users.length - 1].id + 1;
    // const newUser = Object.assign({id: newId},request.body);

    // users.push(newUser);

    // fs.writeFile(`${__dirname}/dev-data/data/users.json`, JSON.stringify(users), err =>{
    //    response.status(201).json({status: 'success', data:{users: newUser}})
    // })

       response.status(500).json({status: 'success', message: 'This route is yet to be defined, please use /signUp instead.'})
}



// exports.updateUser = (request, response) => {
//     if(parseInt(request.params.id) > users.length) {
//         return response.status(404).json({status: 'fail', message: 'Invalid id'});
//     }
//     response.status(200).json({status: 'success', data: {tour: "<Updated tour>"}})
// }

// Do not update password with this
exports.updateUser = factory.updateOne(User);

// exports.deleteUser = (request, response) => {
//     if(parseInt(request.params.id) > users.length) {
//         return response.status(404).json({status: 'fail', message: 'Invalid id'});
//     }
//     response.status(204).json({status: 'success', data: null})
// }

exports.deleteUser = factory.deleteOne(User);