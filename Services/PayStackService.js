const axios = require("axios");

const paystack = axios.create({
    baseURL: "https://api.paystack.co",

    headers: {
        Authorization:
            `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

        "Content-Type": "application/json"
    }
});

const initializeTransaction =
    async (data) => {

        const response =
            await paystack.post(
                "/transaction/initialize",
                data
            );

        return response.data;
    };

const verifyTransaction =
    async (reference) => {

        const response =
            await paystack.get(
                `/transaction/verify/${reference}`
            );

        return response.data;
    };

module.exports = {
    initializeTransaction,
    verifyTransaction
};