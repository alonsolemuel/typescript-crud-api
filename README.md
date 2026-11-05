# 📘 TypeScript CRUD API

**A REST API for managing users, built with TypeScript, Express, Sequelize and MySQL.**

## ✨ Features

- Full **CRUD** for users (create, read, update, delete)
- User authentication with **JWT**
- Passwords hashed with **bcrypt**
- Request validation with **Joi**
- **Sequelize** ORM with MySQL (database is created automatically)
- Centralized error handling middleware
- Role helper for user roles
- Simple HTML/JS frontend to try the API
- Basic tests

## 🛠️ Tech Stack

TypeScript · Node.js · Express · Sequelize · MySQL · Joi · JWT · bcryptjs

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users/authenticate` | Log in, returns a JWT |
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get a user by ID |
| POST | `/users` | Create a user |
| PUT | `/users/:id` | Update a user |
| DELETE | `/users/:id` | Delete a user |

## 🚀 Getting Started

**Requirements:** Node.js 18+, MySQL

```bash
git clone https://github.com/alonsolemuel/typescript-crud-api.git
cd typescript-crud-api
npm install
```

Edit `config.json` with your MySQL details, then:

```bash
npm run start:dev   # development
npm test            # run tests
```
