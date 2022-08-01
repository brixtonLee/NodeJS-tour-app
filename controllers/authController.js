const crypto = require('crypto');
const User = require('./../models/userModel');
const catchAsyncError = require('../utils/catchAsyncError');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
// Built in promisify function
const {promisify} = require('util');

const signToken = id => {
    return jwt.sign({id: id}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN})
}

const createSendToken = (user, statusCode, response) => {

    // jwt.sign(payload, secret, when the jwt should expire)
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), 
        // The cookie will be sent only in encrypted connection
        // secure: true,
        // The cookie cannot be modified by anyway in the browser
        httpOnly: true
    }
    if(process.env.NODE_ENV === 'production'){
        cookieOptions.secure = true;
    }
    // SendBack the cookie
    response.cookie('jwt', token, cookieOptions)

    // Not Show up the password anymore in the output
    user.password = undefined;

    response.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signUp = catchAsyncError(async (request, response, next) => {
    const newUser = await User.create({
        name: request.body.name,
        email: request.body.email,
        password: request.body.password,
        passwordConfirm: request.body.passwordConfirm,
        passwordChangedAt: request.body.passwordChangedAt,
        role: request.body.role
    });
    // Send the Email with the sign up user with template
    const url = `${request.protocol}://${request.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, response);
});

exports.logIn = catchAsyncError(async (request, response, next) => {
    const { email, password } = request.body;

    // 1) Check if email and password exists
    if(!email || !password){
        next(new AppError('Please provide email and password', 400))
    }

    // 2) Check if the user exist && password is correct
    const user = await User.findOne({email}).select('+password');
    console.log(user);
    if(!user || !(await user.correctPassword(password, user.password))){
        next(new AppError('Incorrect email or password', 401))
    }
    // 3) If everything is okay, send token to client
    // const token = signToken(user._id);
    // response.status(201).json({
    //     status: 'success',
    //     token   
    // });
    createSendToken(user, 200, response);

});

exports.logOut = (request, response) => {
    // SendBack the cookie
    response.cookie('jwt', 'loggedOut', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    response.status(200).json({status: 'success'});
}

exports.protect = catchAsyncError(async (request, response, next) => {
    // 1) Getting token and check of it's there
    let token;
    if(request.headers.authorization && request.headers.authorization.startsWith('Bearer')){
        token = request.headers.authorization.split(' ')[1];
    }
    else if(request.cookies.jwt){
        token = request.cookies.jwt;
    }

    if(!token){
        return next(new AppError('You are not logged in! Please login first.', 401));
    }

    // 2) Verification token
    const decoded_payload = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    // 3) Check if user still exists
    const freshUser = await User.findById(decoded_payload.id);

    if(!freshUser){
        return next(new AppError('User not found for this token', 404));
    }
    // 4) Check if user changed password after the token was issued

    if(freshUser.changedPasswordAfter(decoded_payload.iat)){
        return next(new AppError('User Recently changed password! Please login again.', 401));
    }

    request.user = freshUser;
    response.locals.user = freshUser;

    next();
});

exports.restrictTo = (...roles) => {
    return (request, response, next) => {
        if(!roles.includes(request.user.role)){
            return next(new AppError('User is not allowed to perform this action.', 403));
        }


        next();
    }
}

exports.forgotPassword = catchAsyncError(async (request, response, next) => {
    // 1) Get User based on posted email
    const user = await User.findOne({ email: request.body.email });
    if(!user){
        return next(new AppError('User not found', 404));
    }
    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    
    // save the newly added field for forgot password (without validation)
    await user.save({ validateBeforeSave: false});

    // 3) Send it to user email
    
    
    try{
        const resetURL = `${request.protocol}://${request.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        // const message = `Forgot Your Password? Submit a PATCH request with your new password and passwordCoonfirm to: ${resetURL}.\nIf you didn't forget your password, just ignore this message!`;
        // await sendEmail({
        //     email: user.email,
        //     subject: 'Your Password reset token (valid for 10 mins)',
        //     message
        // });
        await new Email(user, resetURL).sendPasswordReset();
    
        response.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        })
    }
    catch (err) {
        console.log(err);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false});
        return next(new AppError('There was an error sending email. Try again later.'), 500)
    }
    

});

exports.resetPassword = catchAsyncError(async(request, response, next) => {
    // 1) Get User Based on Token
    // Compare The token
    const hashedToken = crypto.createHash('sha256').update(request.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt : Date.now()}});
    // 2) If the token is not expired, and there is User, set the new password
    if(!user){
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = request.body.password;
    user.passwordConfirm = request.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 3) Update changedPasswordAt property for the User

    // 4) Log In user, send JWT
    // const token = signToken(user._id)

    // response.status(200).json({
    //     status: 'success',
    //     token
    // });
    createSendToken(user, 200, response);
});

exports.updatePassword = catchAsyncError(async (request, response, next) =>{
    // 1) Get the user from collection
    const user = await User.findById(request.user.id).select('+password');
    // 2) Check if posted password is correct
    if(!user.correctPassword(request.body.passwordCurrent,user.password)){
        return next(new AppError('Password does not match!!', 401));
    }
    // 3) If so,update the password
    user.password = request.body.password;
    user.passwordConfirm = request.body.passwordConfirm;
    await user.save();
    // 4) Log user in, send JWT
    createSendToken(user, 200, response);
});

// Only for rendered pages 
exports.isLoggedIn = async (request, response, next) => {
    // 1) Getting token and check of it's there
    let token;
    try{
        if(request.cookies.jwt){

            // 1) Verification token
            const decoded_payload = await promisify(jwt.verify)(request.cookies.jwt, process.env.JWT_SECRET)
    
            // 2) Check if user still exists
            const freshUser = await User.findById(decoded_payload.id);
    
            if(!freshUser){
                return next();
            }
            // 4) Check if user changed password after the token was issued
    
            if(freshUser.changedPasswordAfter(decoded_payload.iat)){
                return next();
            }
    
            // There is a logged in user
            // Each template could access to response.locals
            response.locals.user = freshUser;
        }
        return next();
    }
    catch(error){
        return next();
    }
};



// JSON WEB TOKEN: npm i jsonwebtoken
// Bcrypt: npm i bcryptjs