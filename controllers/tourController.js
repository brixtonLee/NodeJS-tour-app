// const fs = require('fs');
const AppErrors = require('../utils/appError');
const Tour = require('./../models/tourModel');
const catchAsyncError = require('../utils/catchAsyncError');
const APIFeatures = require('../utils/apiFeatures');

const factory = require('./handlerFactory');

const multer = require('multer');
const sharp = require('sharp');
const { request } = require('express');
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf8'));

// exports.checkID = (request, response, next, value) => {
//     if(parseInt(request.params.id) > tours.length) {
//         return response.status(404).json({status: 'fail', message: 'Invalid id'});
//     }
//     next();
// }

// exports.checkBody = (request, response, next) => {
//     if(!request.body.name || !request.body.price) {
//         return response.status(400).json({status: 'fail', message: 'Bad request'});
//     }
//     next();
// }

// Uploading Images
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

// Upload Multiple Different Images
exports.uploadTourImages = upload.fields([
    {name: 'imageCover', maxCount: 1},
    {name: 'images', maxCount: 3}
]);

// Single Image: upload.single('image') request.file
// Multiple Images: upload.array('images') request.files

exports.resizeTourImages = catchAsyncError(async (request, response, next) => {

    if(!request.files.imageCover || !request.files.images) return next();

    // 1) Cover Image
    const imageCoverFileName = `tour-${request.params.id}-${Date.now()}-cover.jpeg`;
    console.log(request.files);
    await sharp(request.files.imageCover[0].buffer).resize(2000,1333).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/img/tours/${imageCoverFileName}`);
    request.body.imageCover = imageCoverFileName;

    // 2) Images
    request.body.images = []
    await Promise.all(request.files.images.map(async (file, index) => {
        const fileName = `tour-${request.params.id}-${Date.now()}-${index + 1}.jpeg`;
        await sharp(file.buffer).resize(2000,1333).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/img/tours/${fileName}`);

        request.body.images.push(fileName);
    }));
    return next();
})

exports.aliasTopTours = (request, response, next) => {
    request.query.limit = '5';
    request.query.sort = '-ratingsAverage,price';
    request.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}

// //Route handlers
// exports.getAllTours = catchAsyncError(async (request, response, next) => {
        
//         // const tours = await Tour.find();
//         // With params
//         // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy');
//         // console.log(request.query);
//         // let query = Tour.find(JSON.parse(queryStr))

//         const features = new APIFeatures(Tour.find(), request.query).filter().sort().limitFields().paginate();
//         const tours = await features.query;
//         response.status(200).json({status: 'success', data: {tours: tours}});
    
// });

exports.getAllTours = factory.getAll(Tour)

// exports.getTour = catchAsyncError(async (request, response, next) => {
//         // const tour = await Tour.findById(request.params.id);
//         // OR
//         // Populate is to populate the guide id into actual user data in the output of the query
//         const tour = await Tour.findOne({_id: request.params.id}).populate('reviews');

//         if(!tour) {
//             return next(new AppErrors('No tour found for this ID',404));
//         }
//         // const tour = tours.find(tour => tour.id === parseInt(request.params.id));
//         response.status(200).json({status: 'success', data: {tour: tour}});

// });

exports.getTour = factory.getOne(Tour, {path: 'reviews'});

// exports.createTour = catchAsyncError(async (request, response, next) => {
//     const newTour = await Tour.create(request.body)
//     response.status(201).json({status: 'success', data:{tours: newTour}})

//     // const newId = tours[tours.length - 1].id + 1;
//     // const newTour = Object.assign({id: newId},request.body);

//     // tours.push(newTour);

//     // fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err =>{
//     // })


// });

exports.createTour = factory.createOne(Tour);

// exports.updateTour = catchAsyncError(async (request, response, next) => {
//         const updatedTour = await Tour.findByIdAndUpdate(request.params.id, request.body, {
//             new: true,
//             // Run the validation from the schema 
//             runValidators: true
//         });
        
//         if(!updatedTour) {
//             return next(new AppErrors('No tour found for this ID',404));
//         }

//         response.status(200).json({status: 'success', data: {tour: updatedTour}})
// });

exports.updateTour = factory.updateOne(Tour);

// Old
// exports.deleteTour = catchAsyncError(async (request, response, next) => {
//         const deletedTour = await Tour.findByIdAndDelete(request.params.id);

        
//         if(!deletedTour) {
//             return next(new AppErrors('No tour found for this ID',404));
//         }
        
//         response.status(204).json({status: 'success', data: null})
// });

// Delete With Factory
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsyncError(async (request, response, next) => {
        const stats = await Tour.aggregate([
            {
                $match: { ratingAverage: { $gte: 4.5 } },
            },
            {
                $group: { 
                    _id: {$toUpper : '$difficulty'}, 
                    num : { $sum : 1},
                    numRatings: { $sum : '$ratingQuantity'},
                    avgRating: { $avg: '$ratingAverage' }, 
                    avgPrice: { $avg: '$price'}, 
                    minPrice: { $min: '$price' }, 
                    maxPrice: { $max: '$price' } 
                }
            },
            {
                $sort: { avgPrice: 1}
            },
            {
                $match: { _id: { $ne: 'EASY'} }
            }
        ]);
        response.status(200).json({status: 'success', data: {stats: stats}})
});

exports.getMonthlyPlan = catchAsyncError(async (request, response, next) => {
        const year = request.params.year * 1;
        const plan = await Tour.aggregate([
            {
                // To unwind the array into separate document
                $unwind: '$startDates'
            },
            // Matching the values
            {
                $match: {startDates:  {$gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`)}}
            },
            // Aggregate Function
            {
                $group: {
                    _id: { $month: '$startDates'},
                    numTourStarts: { $sum: 1 },
                    tours: { $push: '$name'}
                }
            },
            // Add new fields
            {
                $addFields: { month: '$_id'}
            },
            // Project only fields
            {
               $project: {
                _id: 0,
               } 
            },
            {
                $sort: { numTourStarts: -1}
            },
            // Set the limit that the user can see
            {
                $limit: 12
            }
        ]);

        response.status(200).json({status: 'success', data: {plan: plan}})
});

// Get Tour wihtin certain distance
exports.getToursWithin = catchAsyncError(async (request, response, next) => {
    const {distance, latlng, unit} = request.params;

    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if(!lat || !lng){
        return next(new AppError('Please provide latitude and longitude in the format of lat,lng', 400));
    }

    const tours = await Tour.find({startLocation : { $geoWithin: { $centerSphere: [[lng, lat], radius]}}})


    response.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    })
});

exports.getDistances = catchAsyncError(async (request, response, next) => {
    const {latlng, unit} = request.params;

    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if(!lat || !lng){
        return next(new AppError('Please provide latitude and longitude in the format of lat,lng', 400));
    }


    const distances = await Tour.aggregate([
        // geoNear needs to always be the first stage
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]) 
        response.status(200).json({
            status: 'success',
            data: {
                data: distances
            }
        })
})