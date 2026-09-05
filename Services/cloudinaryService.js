const cloudinary = require("../Config/cloudConfig");

const uploadImageToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "inventory-products",
                resource_type: "image"
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        stream.end(file.buffer);
    });
};

const deleteImageFromCloudinary = async (publicId) => {
    if (!publicId) {
        return;
    }

    return await cloudinary.uploader.destroy(publicId);
};

module.exports = {uploadImageToCloudinary,deleteImageFromCloudinary};