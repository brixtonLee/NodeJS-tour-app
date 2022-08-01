const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

//Use this dotenv to read the env file and addd to process.env
const dotenv = require('dotenv');
dotenv.config({ path: './../../config.env'});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose.connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(( ) => {
    console.log('DB Connection Successful');

});

// Read Json File
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));


const importData = async ( ) => {
    try{
        await Tour.create(tours);
        // await User.create(users, {validateBeforeSave: false});
        // await Review.create(reviews);
        console.log('Data Successfully imported');
    }
    catch(error){
        console.log(error);
    }
    process.exit();
}

const deleteData = async ( ) => {
    try{
        await Tour.deleteMany();
        // await User.deleteMany();
        // await Review.deleteMany();
        console.log('Data Successfully deleted');
    }
    catch(error){
        console.log(error);
    }
    process.exit();
}
// 
if(process.argv[2] === '--import'){
    importData();
}
else if(process.argv[2] === '--delete'){
    deleteData();
}


