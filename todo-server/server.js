    const express = require('express');
    const mongoose = require('mongoose');
    const cors = require('cors');
    const bodyParser = require('body-parser');

    const app = express();
    const port = 5000;

    // Middleware
    app.use(cors());
    app.use(bodyParser.json());

    // Connect to MongoDB
    mongoose.connect('mongodb://localhost/todo-app', { useNewUrlParser: true, useUnifiedTopology: true });

    // Define a Task model
    const Task = mongoose.model('Task', new mongoose.Schema({
        text: String,
        priority: String,
        completed: Boolean,
        createdAt: Date,
        dueDate: Date,
        completedAt: Date
    }));

    // Routes
    app.get('/tasks', async (req, res) => {
        const tasks = await Task.find();
        res.send(tasks);
    });

    app.post('/tasks', async (req, res) => {
        const task = new Task(req.body);
        await task.save();
        res.send(task);
    });

    app.put('/tasks/:id', async (req, res) => {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.send(task);
    });

    app.delete('/tasks/:id', async (req, res) => {
        await Task.findByIdAndDelete(req.params.id);
        res.send({ message: 'Task deleted' });
    });

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
