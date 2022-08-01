const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const tourSchema = new mongoose.Schema({
    name: {
        type:String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxLength: [40, 'The tour must have less or equal than 40 characters'],
        minLength: [10, 'The tour must have more or equal than 40 characters'],
        // Validator.js
        // validate: [validator.isAlpha, 'tour name must have only characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a maxGroupSize'],
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty must be either easy, medium or difficult'
        }
    },
    ratingsAverage: {
        type:Number,
        default: 4.5,
        min: [1, 'Rating must be above or equal to 1.0'],
        max: [5, 'Rating must be less than or eqaul to 5.0'],
        // Round the number (will be run each time this value is stored)
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type:Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        // Custom validation
        validate: {
            validator: function(val){
                // Val variable is referring to the current value
                // this only points to current NEW document creation
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be lower than regular price'
        }
    },
    summary: {
        type: String, 
        trim: true,
        required: [true, 'A tour must have a summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a image cover']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date],
    secretTour:{
        type: Boolean,
        default: false
    },
    // Geo Special Data
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            // Line, Polygon, Geometry
            default: 'Point',
            enum: ['Point']
        },
        // An array of numbers is expected for the coordinates
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        // MongoDB ID
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ] 
    // In which the output is in object format or Json format, output the virtual properties
}, {toJSON: {virtuals: true}, toObject: {virtuals: true}});

// Indexes
// 1 stands for ascending order, -1 stands for descending order
tourSchema.index({price: 1, ratingAverage: -1})
tourSchema.index({slug: 1})
tourSchema.index({startLocation: '2dsphere'})

// Virtual Properties
tourSchema.virtual('durationInWeeks').get(function () {
    return this.duration / 7;
});

// Virtual Populate
tourSchema.virtual('reviews', {
    // Reference to which model
    ref: 'Review',
    // Field in the reference model that contains the tour id
    foreignField: 'tour',
    // Field in the current model that is referenced by the foreign field   
    localField: '_id'
});

// Document Middleware: runs before .save() and create(), not insertMany()
tourSchema.pre('save', function(next) {
    // this keyword is pointing to the currently processed document
    this.slug = slugify(this.name, {lower: true});
    console.log(this.slug);
    next();
});


// User Embedding in Tours
// tourSchema.post('save', async function(next) {
//     const guidePromises = this.guides.map(async id => {
//         await User.findById(id);
//     });
//     this.guides = await Promise.all(guidePromises)
// });

// // Post Middleware runs after all the pre middleware functions have finished
// tourSchema.post('save', function(doc, next) {
//     // doc is pointing to the currently processed document after pre middleware
//     console.log(doc);
// });

// Query middleware
// This is run before the query actually executes and being awaited
// Regular Expression
tourSchema.pre(/^find/, function(next){
    // This is pointing to the currently processed query
    // this.find({ secretTour: { $ne: true}});
    // Add properties
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function(next){
    this.populate({path: 'guides', select: '-__v -passwordChangedAt'});
    next();
})

tourSchema.pre(/^find/, function(next){
    // console.log(docs);
    next();
});

// // Aggregate Middleware
// tourSchema.pre('aggregate', function(next) {
//     this.pipeline().unshift({ $match: {secretTour: { $ne: true}}})
//     // this keyword is pointing to the currently processed aggregation object
//     // this.slug = slugify(this.name, {lower: true});
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;  

// 4 types of middleware in mongoose:
// 1. Document
// 2. Query
// 3. Model
// 4. Aggregate