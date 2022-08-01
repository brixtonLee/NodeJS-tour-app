const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema =new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'A review must have description']
    },
    rating: {
        type: Number,
        required: [true, 'A review must have a rating'],
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'A review must belong to any tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A review must belong to any user']
    }
},  {toJSON: {virtuals: true}, toObject: {virtuals: true}});

reviewSchema.pre(/^find/, function(next){
    // Select Name Only
    // this.populate({path: 'tour', select: 'name'}).populate({path: 'user', select: 'name'})
    
    this.populate({path: 'user', select: 'name'})
    next();
})

// Static Method
reviewSchema.statics.calculateAverageRatings = async function(tourId) {
    // This keyword point to the current model
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1},
                avgRating: { $avg: '$rating'}
            }
        }
    ]);
    console.log(stats);

    if(stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: stats[0].nRating,
            ratingAverage: stats[0].avgRating
        })
    }
    else{
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: 0,
            ratingAverage: 4.5
        })
    }
}

reviewSchema.post('save', function(){

    this.constructor.calculateAverageRatings(this.tour);
})

reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r =  await this.findOne();
    console.log(this.r);
    next();
});

reviewSchema.post(/^findOneAnd/, async function(){
    await this.r.constructor.calculateAverageRatings(this.r.tour)
});

// Unique combination of tour and user should be unique
reviewSchema.index({ tour: 1, user: 1 }, { unique: true})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;