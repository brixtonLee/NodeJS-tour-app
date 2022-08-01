const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// password reset token
const crypto = require('crypto');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'The name of the user is required']
    },
    email: {
        type: String,
        required: [true, 'The email address of the user is required'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide correct format for the email address']
    },
    photo:{
        type: String
    },
    role: {
        type: String,
        enum: ['admin', 'guide', 'lead-guide', 'user'],
        default: 'user'
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
    //   Set the password invisible to any routes (with find)
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Password Confirm is required'],
        // Custom validation
        // This only works for SAVE and CREATE
        validate: {
            validator: function(val){
                // Val variable is referring to the current value
                // this only points to current NEW document creation
                return val === this.password;
            },
            message: 'Password confirm should be same as password'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

// Encrypt Password
userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next();
    }
// npm i bcryptjs
// brcypt hash
this.password = await bcrypt.hash(this.password, 12);

this.passwordConfirm = undefined;
next();
});

userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew){
        next();
    }
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function(next){
    this.find({active: {$ne : false}});
    next()
});

// Comparing Password for hashing
userSchema.methods.correctPassword = async function(candidatePassword, userPassword)
{
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    // This is pointing to the current document
    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp;
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hashing the token
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    console.log(this.passwordResetToken, resetToken);
    // Need to store in database then compare with the token that user provided

    this.passwordResetExpires = Date.now() + 1000 * 60 * 1000;

    return resetToken
}

const User = mongoose.model('User', userSchema);

module.exports = User;

// Authentication with JWT
// It is stateless
// JWT Token is made up of three parts:
/*
    1. Header
    2. Payload
    3. Signature
    
*/