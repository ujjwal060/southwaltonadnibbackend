const express = require('express');

const createSuccess = (statusCode, successMessage, data) => {
    const successObj = {
        status: statusCode,
        message: successMessage,
        data: data
    }
    return successObj;
}

module.exports = createSuccess