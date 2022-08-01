class APIFeatures {
    constructor(query, queryString){
        this.query = query;
        this.queryString = queryString;
    }

    filter(){
        // 1) Filtering
        const queryObj = {...this.queryString}
        const excludedFields = ['page', 'sort', 'fields', 'limit'];
        excludedFields.forEach(field => delete queryObj[field]);

        // 2) Advanced Filtering
        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort(){
        // 3) Sorting
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        }
        return this
    }

    limitFields(){
        // 4) Field Limitation
        if(this.queryString.fields){
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        }
        return this
    }

    paginate(){
        // 5) Pagination
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);

        // if(this.queryString.page){
        //     const numTours  = await Tour.countDocuments();
        //     if(skip >= numTours){
        //         throw new Error('This page does not exist!');
        //     }
        // }
        return this
    }

}

module.exports = APIFeatures;