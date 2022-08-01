const express = require('express');

const path = require('path');

const morgan = require('morgan');

const AppError = require('./utils/appError');

const errorController = require('./controllers/errorController')

const tourRouter = require('./routes/tourRoutes');

const userRouter = require('./routes/userRoutes');

const reviewRouter = require('./routes/reviewRoutes');

const bookingRouter = require('./routes/bookingRoutes');

const viewRouter = require('./routes/viewRoutes');

const rateLimit = require('express-rate-limit');

const helmet = require('helmet');

const mongoSanitize = require('express-mongo-sanitize');

const xss = require('xss-clean');

const cookieParser = require('cookie-parser');

const app = express();


// Rendering
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// This line will automatically let express know the public folder is the static path
app.use(express.static(path.join(__dirname, 'public')));

// parameter pollution
const hpp = require('hpp');

// 1) Global Middlewares
// The order of the middleware written in the code is important

// Set Security HTTP Headers Middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: {
        allowOrigins: ['*']
    },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ['*'],
            scriptSrc: ["* data: 'unsafe-eval' 'unsafe-inline' blob:"]
        }
    }
}))

// Logger middleware
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}


// Rate Limiter
const limiter = rateLimit({
    // Maximum times of requests
    max: 100,
    // Per time
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this ip, please try again in an hour!'
});

// Use limiter for all request starts with api
app.use('/api', limiter)

// Body Parser, reading data from body into request body
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: true, limit: '10kb'}));

// Parse the cookies into request.cookies
app.use(cookieParser());

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({whitelist:  ['duration']}));

//Serving Static html files
// app.use(express.static(`${__dirname}/public`))
// app.use(express.static(path.join(__dirname, 'public')));

// app.get('/api/v1/tours', getAllTours);
// // With URL parameters
// app.get('/api/v1/tours/:id', getTour);

// app.post('/api/v1/tours', createTour);

// app.patch('/api/v1/tours/:id', updateTour);

// app.delete('/api/v1/tours/:id', deleteTour);


// Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);


// 4) Error Handling for undefined routes
// The all keyword is for all the HTTP methods
// It is a middleware
// app.all('*', (request, response, next) => {
//     console.log('Undefined routes');
//     // response.status(404).json({
//     //     status: 'fail',
//     //     message: `Cant find ${request.originalUrl} on this server`
//     // });

//     // // Create Error
//     // const error = new Error(`Cant find ${request.originalUrl} on this server`);
//     // error.status = 'fail';
//     // error.statusCode = 404;

//     // Whatever argument is passed to the next method, express will recognize it as an error
//     next(new AppError(`Cant find ${request.originalUrl} on this server`, 404));
// })

// 5) Global Error Handling Middleware
app.use(errorController)


module.exports = app;

/*
    Mongo DB CRUD:
    use DatabaseName: If the database does not exist, it will be automatically created
    db: current database
    db.CollectionName: If the collection does not exist, it will be automatically created
    1. Create
    1.1 db.tours.insertOne({name: "The Forest Hiker", price: 297, rating: 4.7})
    1.2 db.tours.insertMany([{name: "The Sea Explorer", price: 497, rating: 4.8}, {name: "The Snow Adventurer", price: 997, rating: 4.9, difficulty: "easy"}])
    2. Read
    2.1 db.tours.find({name: "The Forest Hiker"})
    2.2 And Condition: db.tours.find({name: "The Forest Hiker", price:300})
    2.3 Less Than Equal: db.tours.find({price: {$lte:500}})
    2.4 Less Than Equal And Greater than equal: db.tours.find({price: {$lt:500}, rating: {$gte: 4.8}})
    2.5 Less Than Equal OR Greater than equal: db.tours.find({$or: [ {price: {$lt: 500}}, {rating : {$gte: 4.8}}]})
    2.6 Show Name Field Only: db.tours.find({$or: [ {price: {$lt: 500}}, {rating : {$gte: 4.8}}]}, {name: 1})
    3. Update
    3.1 Update where name field equal:  db.tours.updateOne({name: "The Snow Adventurer"}, {$set: {price: 597}})
    3.2. db.tours.updateMany({name: "The Snow Adventurer"}, {$set: {premium: true}})
    3.3 replace to replace all the fields
    4. Delete
    4.1 db.tours.deleteOne({name: "The Snow Adventurer"})

*/

/*
    Data Modelling
    1. Referencing (normalized): nicely separated data / Embedding (denormalized): non separated

*/

  