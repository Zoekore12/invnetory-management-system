const dotenv = require("dotenv").config();
const connectDB = require('./Config/databaseConfig');
const express = require('express');
const app = express();
const port = process.env.PORT
const cookieParser = require("cookie-parser")
const productRoute = require("./Routes/ProductRoute");
const userRoutes = require("./Routes/UserRoute");
const SalesRoute = require("./Routes/SalesRoute");
const activityRoute = require("./Routes/ActivitiesRoute");
const shippingRoute = require("./Routes/ShippingRoute");
const OrderRoute = require("./Routes/Order");
const PaymentRoute = require("./Routes/PaymentRoute");

const startAccountDeactivationJob = require('./Services/deactivationService')



app.use(express.json());//middleware
app.use(cookieParser());

connectDB();//connecting data

//deactivation taking place
startAccountDeactivationJob();

app.use('/products',productRoute);

app.use("/users", userRoutes);

app.use("/sales", SalesRoute);

app.use('/activities',activityRoute);

app.use("/shipping", shippingRoute);

app.use("/Order", OrderRoute);

app.use("/Payment", PaymentRoute);

app.listen(port, ()=>{
    console.log(`Server started on port ${port}`);
})