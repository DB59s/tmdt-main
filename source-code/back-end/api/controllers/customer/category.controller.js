const Category = require('../../models/category.model');

module.exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(400).json({
            code: 400,
            message: error.message
        });
    }
}; 