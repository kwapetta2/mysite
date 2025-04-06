const express = require('express');
const initializeDatabase = require('./db');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const port = 8080;

console.log('1. Запуск сервера...');

async function startServer() {
    console.log('2. Запуск startServer...');

    try {
        const db = await initializeDatabase();
        console.log('3. База данных инициализирована');

        app.use(express.json());
        app.use(express.static(path.join(__dirname, 'public')));

        app.post('/register', async (req, res) => {
            try {
                const { name, email, password } = req.body;

                if (!name || !email || !password) {
                    return res.status(400).json({ error: 'Все поля обязательны' });
                }

                const existingUser = await new Promise((resolve, reject) => {
                    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });

                if (existingUser) {
                    return res.status(400).json({ error: 'Пользователь уже зарегистрирован' });
                }

                const hashedPassword = await bcrypt.hash(password, 10);

                const result = await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT INTO users (name, nickname, email, password) VALUES (?, ?, ?, ?)',
                        [name, name, email, hashedPassword],
                        function (err) {
                            if (err) reject(err);
                            else resolve({ id: this.lastID });
                        }
                    );
                });

                res.status(201).json({
                    message: 'Регистрация успешна',
                    user: {
                        id: result.id,
                        name: name,
                        nickname: name,
                        email: email,
                        registeredAt: new Date().toISOString()
                    }
                });
            } catch (error) {
                console.error('Ошибка регистрации:', error.message);
                res.status(500).json({ error: 'Ошибка сервера' });
            }
        });

        app.post('/login', async (req, res) => {
            try {
                const { email, password } = req.body;

                if (!email || !password) {
                    return res.status(400).json({ error: 'Укажите email и пароль' });
                }

                const user = await new Promise((resolve, reject) => {
                    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });

                if (!user || !(await bcrypt.compare(password, user.password))) {
                    return res.status(401).json({ error: 'Неверный email или пароль' });
                }

                res.json({
                    success: true,
                    token: `token_${user.id}`,
                    user: {
                        id: user.id,
                        name: user.name,
                        nickname: user.nickname || user.name,
                        email: user.email,
                        registeredAt: user.registeredAt
                    }
                });
            } catch (error) {
                console.error('Ошибка входа:', error.message);
                res.status(500).json({ error: 'Ошибка сервера' });
            }
        });
        app.listen(port, () => {
            console.log(`4. Сервер работает на http://localhost:${port}`);
        });
        process.on('SIGINT', () => {
            console.log('5. Остановка сервера...');
            db.close((err) => {
                if (err) console.error('Ошибка при закрытии БД:', err.message);
                else console.log('База данных закрыта');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('Ошибка запуска сервера:', error.message);
        process.exit(1);
    }
}

startServer();
