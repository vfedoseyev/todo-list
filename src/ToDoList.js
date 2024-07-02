import React, { useState, useEffect } from 'react';
import './ToDoList.css';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatDistanceToNow } from 'date-fns';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import axios from 'axios';
import './animations.css'; // Файл с анимациями

function ToDoList() {
    const [tasks, setTasks] = useState([]);
    const [taskText, setTaskText] = useState('');
    const [taskPriority, setTaskPriority] = useState('Medium');
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editText, setEditText] = useState('');
    const [sortOrder, setSortOrder] = useState('creation');
    const [dueDate, setDueDate] = useState(null);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }, [tasks]);

    const fetchTasks = async () => {
        try {
            const response = await axios.get('http://localhost:5000/tasks');
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const addTask = async () => {
        if (taskText.trim()) {
            try {
                const newTask = {
                    text: taskText,
                    priority: taskPriority,
                    completed: false,
                    createdAt: new Date(),
                    dueDate,
                    completedAt: null
                };
                const response = await axios.post('http://localhost:5000/tasks', newTask);
                setTasks([...tasks, response.data]);
                setTaskText('');
                setTaskPriority('Medium');
                setDueDate(null);
            } catch (error) {
                console.error('Error adding task:', error);
            }
        }
    };

    const editTask = (id) => {
        setEditingTaskId(id);
        const task = tasks.find(task => task.id === id);
        if (task) {
            setEditText(task.text);
            setDueDate(task.dueDate ? new Date(task.dueDate) : null);
        }
    };

    const saveTask = async (id) => {
        try {
            const updatedTask = { text: editText, dueDate };
            const response = await axios.put(`http://localhost:5000/tasks/${id}`, updatedTask);
            setTasks(tasks.map(task => (task.id === id ? response.data : task)));
            setEditingTaskId(null);
            setEditText('');
            setDueDate(null);
        } catch (error) {
            console.error('Error saving task:', error);
        }
    };

    const toggleTaskCompletion = async (id) => {
        try {
            const task = tasks.find(task => task.id === id);
            const updatedTask = { ...task, completed: !task.completed, completedAt: !task.completed ? new Date() : null };
            const response = await axios.put(`http://localhost:5000/tasks/${id}`, updatedTask);
            setTasks(tasks.map(task => (task.id === id ? response.data : task)));
        } catch (error) {
            console.error('Error toggling task completion:', error);
        }
    };

    const deleteTask = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/tasks/${id}`);
            setTasks(tasks.filter(task => task.id !== id));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const sortTasks = (tasks) => {
        return tasks.slice().sort((a, b) => {
            if (sortOrder === 'priority') {
                const priorities = { High: 1, Medium: 2, Low: 3 };
                return priorities[a.priority] - priorities[b.priority];
            } else if (sortOrder === 'completed') {
                return a.completed - b.completed;
            } else if (sortOrder === 'dueDate') {
                return new Date(a.dueDate) - new Date(b.dueDate);
            } else {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
        });
    };

    const checkReminders = () => {
        const now = new Date();
        tasks.forEach(task => {
            if (task.dueDate && !task.completed) {
                const timeLeft = new Date(task.dueDate) - now;
                if (timeLeft > 0 && timeLeft <= 60000) {
                    sendNotification(task);
                }
            }
        });
    };

    const sendNotification = (task) => {
        const options = {
            body: `Task "${task.text}" is due in ${formatDistanceToNow(new Date(task.dueDate))}!`,
            icon: '/path/to/icon.png' // Путь к иконке уведомления (опционально)
        };
        new Notification('Task Due Soon', options);
    };

    const sortedTasks = sortTasks(tasks);

    const filteredTasks = sortedTasks.filter(task =>
        task.text.toLowerCase().includes(searchText.toLowerCase())
    );

    const activeTasks = filteredTasks.filter(task => !task.completed);
    const completedTasks = filteredTasks.filter(task => task.completed);

    return (
        <div className="todo-list">
            <h1>To-Do List</h1>
            <div className="task-inputs">
                <input
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    placeholder="Add a new task"
                />
                <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
                <DatePicker
                    selected={dueDate}
                    onChange={(date) => setDueDate(date)}
                    showTimeSelect
                    dateFormat="Pp"
                    placeholderText="Set due date"
                />
                <button onClick={addTask}>Add Task</button>
            </div>
            <h2>Search task</h2>
            <div className="search-bar">
                <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search tasks"
                />
            </div>
            <h2>Filter task</h2>
            <div className="sort-options">
                <button onClick={() => setSortOrder('creation')}>Sort by Creation Date</button>
                <button onClick={() => setSortOrder('priority')}>Sort by Priority</button>
                <button onClick={() => setSortOrder('completed')}>Sort by Status</button>
                <button onClick={() => setSortOrder('dueDate')}>Sort by Due Date</button>
            </div>
            <h2>Active Tasks</h2>
            <TransitionGroup component="ul">
                {activeTasks.map((task) => (
                    <CSSTransition key={task.id} timeout={500} classNames="task">
                        <li>
                            <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleTaskCompletion(task.id)}
                            />
                            {editingTaskId === task.id ? (
                                <>
                                    <input
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                    />
                                    <DatePicker
                                        selected={dueDate}
                                        onChange={(date) => setDueDate(date)}
                                        showTimeSelect
                                        dateFormat="Pp"
                                        placeholderText="Set due date"
                                    />
                                    <button onClick={() => saveTask(task.id)}>Save</button>
                                </>
                            ) : (
                                <>
                                    <span>{task.text} ({task.priority})</span>
                                    {task.dueDate && (
                                        <span> - Due by: {new Date(task.dueDate).toLocaleString()}</span>
                                    )}
                                    <button onClick={() => editTask(task.id)}>Edit</button>
                                    <button onClick={() => deleteTask(task.id)}>Delete</button>
                                </>
                            )}
                        </li>
                    </CSSTransition>
                ))}
            </TransitionGroup>
            <h2>Completed Tasks</h2>
            <TransitionGroup component="ul">
                {completedTasks.map((task) => (
                    <CSSTransition key={task.id} timeout={500} classNames="task">
                        <li>
                            <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleTaskCompletion(task.id)}
                            />
                            <span className="completed">{task.text} ({task.priority})</span>
                            {task.completedAt && (
                                <span> - Completed at: {new Date(task.completedAt).toLocaleString()}</span>
                            )}
                            {task.dueDate && (
                                <span> - Due by: {new Date(task.dueDate).toLocaleString()}</span>
                            )}
                            <button onClick={() => deleteTask(task.id)}>Delete</button>
                        </li>
                    </CSSTransition>
                ))}
            </TransitionGroup>
        </div>
    );
}

export default ToDoList;
