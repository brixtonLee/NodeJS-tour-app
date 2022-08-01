const catchAsyncError = require('./../utils/catchAsyncError');
const AppError = require('./../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// Create a function which will then returned a function (For all Models)
exports.deleteOne = Model => catchAsyncError(async (request, response, next) => {
    const document = await Model.findByIdAndDelete(request.params.id);

    
    if(!document) {
        return next(new AppError('No Document found for this ID',404));
    }
    
    response.status(204).json({status: 'success', data: null})
});

exports.updateOne = Model => catchAsyncError(async (request, response, next) => {
    const document = await Model.findByIdAndUpdate(request.params.id, request.body, {
        new: true,
        // Run the validation from the schema 
        runValidators: true
    });
    
    if(!document) {
        return next(new AppErrors('No Document found for this ID',404));
    }

    response.status(200).json({status: 'success', data: {data: document}})
});

exports.createOne = Model => catchAsyncError(async (request, response, next) => {
    const document = await Model.create(request.body)
    response.status(201).json({status: 'success', data:{data: document}})
});

exports.getOne = (Model, populateOptions) => catchAsyncError(async (request, response, next) => {
    let query = Model.findOne({_id: request.params.id});

    if(populateOptions){
        query = query.populate(populateOptions);
    }

    // const tour = await Tour.findById(request.params.id);
    // OR
    // Populate is to populate the guide id into actual user data in the output of the query
    // const document = await Model.findOne({_id: request.params.id}).populate('reviews');

    const document = await query;

    if(!document) {
        return next(new AppError('No document found for this ID',404));
    }
    // const tour = tours.find(tour => tour.id === parseInt(request.params.id));
    response.status(200).json({status: 'success', data: {data: document}});

});

exports.getAll = Model => catchAsyncError(async (request, response, next) => {
    // Nested routes on tour
    let filter;
    if(request.params.tourId){
        filter = { tour: request.params.tourId };
    }

    const features = new APIFeatures(Model.find(), request.query).filter().sort().limitFields().paginate();
    const documents = await features.query;
    response.status(200).json({status: 'success', data: {documents: documents}});
});