const AppError = require('../utils/appError');

const handlleCastErrorDB = err => {
   const message = `Invalid ${err.path}: ${err.value}`;
   return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)
    const message = `Duplicate field ${value}. Please use another value!`;
    return new AppError(message, 400);
 }

 const handleValidationErrorDB = err => {
    // Array of all the errors messages
    const errors = Object.values(err.errors).map(error => error.message)

    const message = `Invalid input data: ${errors.join('. ')}`;
    return new AppError(message, 400);
 }

 const handleJsonWebTokenErrorDB = err => {
    return new AppError('Invalid Token, Please login again!', 401);
 }

 const handleTokenExpiredDB = err => {
    return new AppError('Token is expired!', 401);
 }

const sendErrorDev = (error, request, response) => {
    if(request.originalUrl.startsWith('/api')){
        return response.status(error.statusCode).json({
            status: error.status,
            error: error,
            message: error.message,
            stack: error.stack
        });
    }
    return response.status(error.statusCode).render('error', {
        title: 'Something went wrong',
        msg: error
    })
}

const sendErrorProd = (error, request, response) => {
    if(request.originalUrl.startsWith('/api')){
        if(error.isOperational){
            return response.status(error.statusCode).json({
                status: error.status,
                message: error.message,
            });
        }
        return response.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });  
    }
    if(error.isOperational){
        return response.status(error.statusCode).render('error', {
            title: 'Something went wrong',
            msg: error
        })
    }
    return response.status(error.statusCode).render('error', {
        title: 'Something went wrong',
        msg: 'Please try again later'
    })   
}

module.exports = (error, request, response, next) => {
    console.log('Error Controller')
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';

    if(process.env.NODE_ENV === 'production'){
        let err = {...error};
        if(err.name === 'CastError'){
            err = handlleCastErrorDB(err)
        }
        if(err.code === '11000'){
            err = handleDuplicateFieldsDB(err);
        }
        if(err.name === 'ValidationError'){
            err = handleValidationErrorDB(err);
        }
        if(err.name === 'JsonWebTokenError'){
            err = handleJsonWebTokenErrorDB(err);
        }
        if(err.name === 'TokenExpiredError'){
            err = handleTokenExpiredDB(err);
        }
        
        sendErrorProd(err, request, response)
    }
    else if(process.env.NODE_ENV === 'development'){
        console.log(error);
        sendErrorDev(error, request, response);
    }

}