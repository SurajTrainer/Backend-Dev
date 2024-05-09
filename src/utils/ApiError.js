class ApiError extends Error {
    constructor (
        statuscode,
        message = " kuch to gadbad hai abhijit",
        errors = [],
        stacks = ""
    ) {
        super(message)
        this.statuscode = statuscode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if (stacks) {
            this.stacks = stacks
        }else {
            Error.captureStackTrace(this , this.constructor)
        }
    }
}

export default ApiError