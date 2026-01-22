const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Get all employees
app.get('/api/employees', (req, res) => {
    const query = 'SELECT * FROM employees ORDER BY created_at DESC';
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ employees: rows });
    });
});

// Get employee by ID
app.get('/api/employees/:id', (req, res) => {
    const query = 'SELECT * FROM employees WHERE id = ?';
    db.get(query, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Employee not found' });
            return;
        }
        res.json({ employee: row });
    });
});

// Create new employee
app.post('/api/employees', (req, res) => {
    const { name, email, department, position, salary, hire_date, phone } = req.body;
    
    if (!name || !email || !department || !position || !salary || !hire_date) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    const query = `INSERT INTO employees (name, email, department, position, salary, hire_date, phone) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [name, email, department, position, salary, hire_date, phone], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            message: 'Employee created successfully',
            id: this.lastID 
        });
    });
});

// Update employee
app.put('/api/employees/:id', (req, res) => {
    const { name, email, department, position, salary, hire_date, phone } = req.body;
    const query = `UPDATE employees 
                   SET name = ?, email = ?, department = ?, position = ?, 
                       salary = ?, hire_date = ?, phone = ?
                   WHERE id = ?`;
    
    db.run(query, [name, email, department, position, salary, hire_date, phone, req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Employee not found' });
            return;
        }
        res.json({ message: 'Employee updated successfully' });
    });
});

// Delete employee
app.delete('/api/employees/:id', (req, res) => {
    const query = 'DELETE FROM employees WHERE id = ?';
    db.run(query, [req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Employee not found' });
            return;
        }
        res.json({ message: 'Employee deleted successfully' });
    });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    const queries = {
        total: 'SELECT COUNT(*) as count FROM employees',
        avgSalary: 'SELECT AVG(salary) as avg FROM employees',
        byDept: 'SELECT department, COUNT(*) as count FROM employees GROUP BY department'
    };

    db.get(queries.total, [], (err, total) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        db.get(queries.avgSalary, [], (err, avgSalary) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            db.all(queries.byDept, [], (err, byDept) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({
                    totalEmployees: total.count,
                    averageSalary: avgSalary.avg || 0,
                    byDepartment: byDept
                });
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});