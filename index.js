const mysql = require('mysql2');
const inquirer = require('inquirer');

const db = mysql.createConnection(
    {
      host: 'localhost',
      user: 'root',
      password: 'pass123',
      database: 'employees_db'
    }
);

const init = function () {
    inquirer.prompt({
        type: 'list',
        name: 'main',
        message: 'What would you like to do?',
        choices: ['View All Employees', 'Add Employees', 'Update Employee Role', 'View All Roles', 'Add Role', 'View All Departments', 'Add Department', 'Quit']
    }).then((data) => {
        if (data.main === 'View All Employees') {
            db.query(`SELECT 
                        employee.id, 
                        employee.first_name, 
                        employee.last_name, role.title AS title, 
                        department.name AS department, 
                        role.salary AS salary,
                        CONCAT(manager.first_name, ' ', manager.last_name) AS manager
                    FROM employee
                    JOIN role ON employee.role_id = role.id
                    JOIN department ON role.department_id = department.id
                    LEFT JOIN employee manager ON manager.id = employee.manager_id`, (req, res) => {
                console.table(res);
                init();
            });
        } else if (data.main === 'Add Employees') {
            db.query(`SELECT * FROM employee, role`, (req, res) => {
                inquirer.prompt([
                    {
                        type: 'input',
                        name: 'firstname',
                        message: "What is the employee's first name?"
                    },
                    {
                        type: 'input',
                        name: 'lastname',
                        message: "What is the employee's last name?"
                    },
                    {
                        type: 'list',
                        name: 'role',
                        message: "What is the employee's role?",
                        choices: () => {
                            let roles = [];
                            for (let i = 0; i < res.length; i++) {
                                roles.push(res[i].title);
                            }

                            let newRoles = [...new Set(roles)];
                            return newRoles; 
                        }
                    },
                    {
                        type: 'list',
                        name: 'manager',
                        message: "Who is the employee's manager?",
                        choices: () => {
                            let managers = [];
                            for (let i = 0; i < res.length; i++) {
                                managers.push(res[i].first_name + ' ' + res[i].last_name);
                            }

                            let newManagers = [...new Set(managers)];
                            return newManagers; 
                        }
                    }
                ]).then((data) => {
                    db.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)`, [data.firstname, data.lastname, data.role.id, data.manager.id], (req, res) => {
                        console.log(`Added ${data.firstname} ${data.lastname} to the database`);
                        init();
                    });
                })
            });
        } else if (data.main === 'Update Employee Role') {
            db.query(`SELECT * FROM employee, role`, (req, res) => {
                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'employee',
                        message: "Which employee's role do you want to update?",
                        choices: () => {
                            let employees = [];
                            for (let i = 0; i < res.length; i++) {
                                employees.push(res[i].first_name + ' ' + res[i].last_name);
                            }

                            let newEmployees = [...new Set(employees)];
                            return newEmployees; 
                        }
                    },
                    {
                        type: 'list',
                        name: 'role',
                        message: 'Which role do you want to assign the selected employee?',
                        choices: () => {
                            let roles = [];
                            for (let i = 0; i < res.length; i++) {
                                roles.push(res[i].title);
                            }

                            let newRoles = [...new Set(roles)];
                            return newRoles; 
                        }
                    }
                ]).then((data) => {
                    db.query(`UPDATE employee SET ? WHERE ?`, [{role_id: data.role}, {first_name: data.employee}], (req, res) => {
                        console.log(`Updated employee's role`);
                        init();
                    });
                })
            });
        } else if (data.main === 'View All Roles') {
            db.query(`SELECT
                        role.id,
                        role.title,
                        role.salary,
                        department.name AS department
                      FROM role
                      JOIN department ON role.department_id = department.id`, (req, res) => {
                console.table(res);
                init();
            });
        } else if (data.main === 'Add Role') {
            db.query(`SELECT * FROM department`, (req, res) => {
                inquirer.prompt([
                    {
                        type: 'input',
                        name: 'role',
                        message: 'What is the name of the role?'
                    },
                    {
                        type: 'input',
                        name: 'salary',
                        message: 'What is the salary of the role?'
                    },
                    {
                        type: 'list',
                        name: 'department',
                        message: 'Which department does the role belong to?',
                        choices: () => {
                            let departments = [];
                            for (let i = 0; i < res.length; i++) {
                                departments.push(res[i].name);
                            }

                            let newDepartments = [...new Set(departments)];
                            return newDepartments; 
                        }
                    }
                ]).then((data) => {
                    db.query(`INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)`, [data.role, data.salary, data.department.id], (req, res) => {
                        console.log(`Added ${data.role} to the database`);
                        init();
                    });
                })
            });
        } else if (data.main === 'View All Departments') {
            db.query(`SELECT * FROM department`, (req, res) => {
                console.table(res);
                init();
            })
        } else if (data.main === 'Add Department') {
            inquirer.prompt([
                {
                    type: 'input',
                    name: 'department',
                    message: 'What is the name of the department?'
                }
            ]).then((data) => {
                db.query(`INSERT INTO department (name) VALUES (?)`, [data.department], (req, res) => {
                    console.log(`Added ${data.department} to the database`);
                    init();
                });
            })
        } else if (data.main === 'Quit') {
            db.end();
        }
    });
};

init();