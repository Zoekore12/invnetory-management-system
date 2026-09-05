const axios = require("axios");

const shipbubble = axios.create({
    baseURL: "https://api.shipbubble.com/v1",
    headers: {
        Authorization: `Bearer ${process.env.SHIPBUBBLE_API_KEY}`,
        "Content-Type": "application/json"
    }
});

const fetchShippingRates = async (data) => {
    const response = await shipbubble.post(
        "/shipping/fetch_rates",
        data
    );

    return response.data;
};

const createShipment = async (data) => {
    const response = await shipbubble.post(
        "/shipping/labels",
        data
    );

    return response.data;
};


module.exports = {  fetchShippingRates, createShipment };