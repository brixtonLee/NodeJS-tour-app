const AppErrors = require('../utils/appError');
const Review = require('./../models/reviewModel');
const catchAsyncError = require('../utils/catchAsyncError');
const factory = require('./handlerFactory');

// exports.getAllReviews = async (request, response) => {
//     let filter;
//     if(request.params.tourId){
//         filter = { tour: request.params.tourId };
//     }
//     const reviews = await Review.find(filter);
//     response.status(200).json({status: 'success', result: reviews.length, data: {reviews: reviews}});
// }
exports.getAllReviews = factory.getAll(Review)


exports.setTourUserIds = (request, response, next) => {
    // Nested Routes
    if(!request.body.tour){
        request.body.tour = request.params.tourId;
    }

    if(!request.body.user){
        request.body.user = request.user.id;
    }
    next();
}

// exports.createReview = catchAsyncError(async (request, response, next) => {

//     const newReview = await Review.create(request.body)
//     response.status(201).json({status: 'success', data:{review: newReview}})
// });

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
