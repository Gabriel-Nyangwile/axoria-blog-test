export default class AppError extends Error {
    constructor(message = "An error has occured") {
        super(message);
        this.name = "AppError";
    }
}