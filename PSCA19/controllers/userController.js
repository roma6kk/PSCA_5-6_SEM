const express = require('express');
const userModel = require('../userModel');
module.exports = {
    list: (req, res) => {
        const data = userModel.getAll();
        res.json({ status: 'success', data: data });
    },

    show: (req, res) => {
        const user = userModel.getById(req.params.id);
        if (user) {
            res.json({ status: 'success', data: user });
        } else {
            res.status(404).json({ status: 'error', message: 'User not found' });
        }
    },

    create: (req, res) => {
        const newUser = userModel.create(req.body);
        res.status(201).json({ status: 'success', message: 'User created', data: newUser });
    },

    update: (req, res) => {
        const id = req.params.id;
        const updatedUser = userModel.update(id, req.body);

        if (updatedUser) {
            res.json({ status: 'success', message: 'User updated', data: updatedUser });
        } else {
            res.status(404).json({ status: 'error', message: 'User not found' });
        }
    },

    remove: (req, res) => {
        const id = req.params.id;
        const removedUser = userModel.remove(id);

        if (removedUser) {
            res.json({ status: 'success', message: 'User deleted', data: removedUser });
        } else {
            res.status(404).json({ status: 'error', message: 'User not found' });
        }
    }
};