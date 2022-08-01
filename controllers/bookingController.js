const AppErrors = require('../utils/appError');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsyncError = require('../utils/catchAsyncError');
const Stripe = require('stripe')
const stripe = Stripe('sk_test_51KwdJYHTkwmWJUsIoeg2rGxB7oBycmDa86wBjCkByZrxhYFmpR3urgqOcEsvwQOGEYHIW402JOzVYo6lsRRjZI8g00FhgbQASS')
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsyncError(async(request, response, next) => {
    // 1) Get the currently booked tour
    const tour = await Tour.findById(request.params.tourID)
    // 2) Create the checkout session
    const session = await stripe.checkout.sessions.create({
        // Information about the session 
        payment_method_types: ['card'],
        success_url: `${request.protocol}://${request.get('host')}/?tour=${request.params.tourID}&user=${request.user.id}&price=${tour.price}`,
        cancel_url: `${request.protocol}://${request.get('host')}/tour/${tour.slug}`,
        customer_email: request.user.email,
        client_reference_id: request.params.tourID,
        // Information about the product
        line_items: [{
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/tour-5c88fa8cf4afda39709c2951-1553152659745-cover.jpeg`],
            amount: tour.price * 100,
            currency: 'myr',
            quantity: 1
        }]
    })
    // 3) Create session as response
    response.status(200).json({
        status: 'success',
        session
    })
})

exports.createBookingCheckout = catchAsyncError(async (request, response, next) => {
    // This is temporary
    const {tour, user, price} = request.query

    if(!tour && !user && !price) {
        return next();
    }
    await Booking.create({tour, user, price})

    // Redirect and run again the middlewares for the root url
    response.redirect(request.originalUrl.split('?')[0])
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);