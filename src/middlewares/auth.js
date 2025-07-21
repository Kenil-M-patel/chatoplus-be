const jwt = require('jsonwebtoken');
const Customer = require("../db/models/user");
const { sendErrorResponse } = require('../utils/response');

const allowedUrls = [
    '/v1/auth/register',
    '/v1/auth/register-guest',
    '/v1/auth/login',
    '/v1/auth/verify-email',
    '/v1/auth/reset-password',
    '/v1/auth/platformuser-login',
    '/v1/product/get',
    '/v1/product/getClient',
    '/v1/product/suggestions',
    '/v1/category/get',
    '/v1/product/get/:slug',
    '/v1/product-combo/get',
    '/v1/product-combo/getClient',
    '/v1/product-combo/get/:slug',
    '/v1/SEO/:slug',
    '/v1/product-content/product-by-product-content/:id',
    '/v1/product/videos',
    '/v1/product/check-stock',
    '/v1/blog/get',
    '/v1/blog/get/:slug',
    '/v1/wishlist/create-many',
    '/v1/review/create',
    '/v1/review/client-review',
    '/v1/news-letter/create',
    '/v1/coupon/verify',
    '/v1/cart/check-cart-stock',
];

const authorized = async (req, res, next) => {
    const allowed = allowedUrls.some(url => {
        const regexString = url.replace(':id', '([a-f\\d]{24})').replace(':slug', '([^/]+)');
        const regex = new RegExp(`^${regexString}$`);
        return regex.test(req.path);
    });


    if (allowed) return next();

    const authorizationHeader = req.get('Authorization') || req.headers["authorization"];

    if (!authorizationHeader) return sendErrorResponse(res, "Authorization header missing!", null, 401);

    // If the token is in the "Bearer <token>" format, remove the prefix.
    token = authorizationHeader?.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Customer.findById(decoded?.id);
        req.user = user;

        next();
    } catch (error) {
        return sendErrorResponse(res, "Unauthorized or invalid token!", null, 401);
    }
}

module.exports = authorized;