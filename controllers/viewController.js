const AppError = require('./../utils/appError');
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');

const User = require('./../models/userModel');
const catchAsyncError = require('../utils/catchAsyncError');

exports.getOverview = catchAsyncError(async (request, response, next) => {
    //  1) Get tour data from collection
    const tours = await Tour.find();
    // 2) Build template

    // 3) REnder the template using the data


    response.status(200).render('overview', {
        title: 'All Tour',
        tours: tours
    });
});

exports.getTour = catchAsyncError(async (request, response, next) => {
    // 1) Get the data for the requested tour (including reviews and tour guide)
    // The fields in the populate is to write the fields that you want to display in the populated reviews
    const tour = await Tour.findOne({slug: request.params.slug}).populate({path: 'reviews', fields: 'review rating user'});
    // 2) Build the template

    if(!tour){
        return next(new AppError('There is no tour with this name', 404))
    }
    // 3) Render template with the data
    response.status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', {
      title: `${tour.title} Tour`,
      tour
    });
});

exports.getLoginForm = (request, response) => {
    response.status(200).render('login', {
        title: 'Login to your account',
    })
};

exports.getAccount = (request, response) => {
    response.status(200).render('account', {
        title: 'Your account',
    })
}

exports.getMyTours = catchAsyncError(async(request, response,next) => {
    // 1) Find All Bookings
    const bookings = await Booking.find({user: request.user.id})
    // 2) Find Tour with returned Ids
    const tourIds = bookings.map(booking => booking.tour)
    const tours = await Tour.find({_id: { $in: tourIds}})

    response.status(200).render('overview', {
        title: 'My Tour',
        tours
    })
})

exports.updateUserData = catchAsyncError(async(request, response) => {
    const user = await User.findByIdAndUpdate(request.user.id, {
        name: request.body.name,
        email: request.body.email
    }, {
        new: true,
        runValidators: true
    });

    response.status(200).render('account', {
        title: 'Your account',
        user: user
    })
});