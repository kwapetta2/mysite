const express = require('express');
const initializeDatabase = require('./db');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const port = 8080;

async function startServer() {
    const db = await initializeDatabase();

    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));

    app.post('/register', async (req, res) => {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        try {
            // Проверка на существующего пользователя
            const existingUser = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (existingUser) {
                return res.status(400).json({ error: 'Пользователь уже зарегистрирован' });
            }

            // Хешируем пароль
            const hashedPassword = await bcrypt.hash(password, 10);

            // Вставка нового пользователя в базу данных
            const result = await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                    [name, email, hashedPassword],
                    function (err) {
                        if (err) reject(err);
                        else resolve({ id: this.lastID });
                    }
                );
            });

            // Ответ с успешной регистрацией
            res.status(201).json({
                message: 'Регистрация успешна',
                user: {
                    id: result.id,
                    name,
                    email,
                    registeredAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Ошибка регистрации:', error.message);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.post('/login', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Укажите email и пароль' });
        }

        try {
            // Проверка пользователя по email
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            // Если пользователя нет или пароль не совпадает
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }

            // Ответ с успешным входом
            res.json({
                success: true,
                token: `token_${user.id}`,
                user: {
                    id: user.id,
                    name: user.name,
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
        console.log(` Сервер работает на http://localhost:${port}`);
    });

    process.on('SIGINT', () => {
        console.log(' Остановка сервера...');
        db.close((err) => {
            if (err) console.error('Ошибка закрытия БД:', err.message);
            else console.log('База данных закрыта');
            process.exit(0);
        });
    });
}

startServer();
