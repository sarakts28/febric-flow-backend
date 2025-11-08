import Client from "../models/client_modal.js";
import createError from "../utilies/errorHandle.js";
import { createdResponse, successResponse } from "../utilies/responseHandler.js";

// @desc    Create a new client
// @route   POST /api/client
// @access  Private

export const createClient = async (req, res) => {
    if(!req.body)
    {
    throw createError("Request body is required", 400);
    }
    const { client_name, client_email, client_phone, client_address, client_city, client_state, client_zip, client_country } = req.body;
    if(!client_name || !client_email)
    {
    throw createError("Client name and email are required", 400);
    }

    const client = await Client.findOne({ client_email });
    if(client)
    {
    throw createError("Client already exists", 400);
    }
    try {
        const client = new Client({ client_name, client_email, client_phone, client_address, client_city, client_state, client_zip, client_country, user: req.user._id });
        await client.save();
        return createdResponse(res, client);
    } catch (error) {
        throw createError(error.message, 500);
    }
}

// @desc    Get all clients and simple search on the base of client name and client email
// @route   GET /api/client
// @access  Private
export const getAllClients = async (req, res) => {
    let page_limit = parseInt(req.query.page_limit) || 10;
    let page = parseInt(req.query.page) || 1;

    const { search } = req.query;
    const query = {};
    if(search)
    {
        query.$or = [
            { client_name: { $regex: search, $options: "i" } },
            { client_email: { $regex: search, $options: "i" } }
        ];
    }
    const skip = (page - 1) * page_limit;
    const allClientsCount = await Client.countDocuments(query);

    const clients = await Client.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(page_limit);
    const totalPages = Math.ceil(allClientsCount / page_limit);

    if (page > 1 && page > totalPages) {
        throw createError(`Page ${page} does not exist. Maximum page is ${totalPages+1}`, 400);
    }

    const data = {
        result: clients,
        totalCount: allClientsCount,
        pagination: {
            current_page: page,
            page_limit: page_limit,
            total_pages: Math.ceil(allClientsCount / page_limit),
            total_items: allClientsCount,
            isNext: page < Math.ceil(allClientsCount / page_limit),
            isPrev: page > 1,
        },
    };
    
    return successResponse(res,"Clients fetched successfully", data);
}
    