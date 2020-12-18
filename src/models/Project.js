const mongoose = require('mongoose');
const { Schema } = mongoose;
const User = require('./User');
const ProjectSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    caption: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    projectImage: {
        url: {
            type: String,
            required: true
        },
        id: {
            type: String,
            required: true
        }
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    approved: {
        type: Boolean,
        required: true,
        default: false
    },
    completed: {
        type: Boolean,
        required: true,
        default: false
    },
    budget: [
        {
            item_name: {
                type: String,
                required: true,
                trim: true
            },
            unit_cost: {
                type: Number,
                required: true,
                trim: true
            },
            quantity: {
                type: Number,
                required: true,
                trim: true
            },
            line_total: {
                type: Number,
                required: true,
                trim: true
            },
            comment: {
                type: String,
                trim: true
            },
        }
    ]
}, { timestamps: true});



module.exports = Project = mongoose.model('project', ProjectSchema);