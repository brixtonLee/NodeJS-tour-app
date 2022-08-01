module.exports = fn => {
    // Return the async function
    return (request, response, next) => {
        fn(request, response, next).catch(next);
    }
}
