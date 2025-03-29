const express = require('express');
const initializeDatabase = require('./db');

const app = express();
const port = 8080;

console.log('1. Запуск сервера...');

async function startServer() {
    console.log('2. Начало функции startServer...');
    let db;
    try {
        console.log('3. Перед вызовом initializeDatabase...');
        db = await initializeDatabase();
        console.log('4. После initializeDatabase, db:', db, 'typeof db.close:', typeof db.close);

        if (!db || typeof db.close !== 'function') {
            throw new Error('Объект базы данных не инициализирован корректно');
        }
        console.log('5. База данных готова к работе');

        // Настройка Express
        app.use(express.json());

        // Простой маршрут для проверки
        app.get('/', (req, res) => {
            res.send('Сервер работает!');
        });

        // Запуск сервера
        app.listen(port, () => {
            console.log(`6. Server running at http://localhost:${port}`);
        });

        // Обработка завершения работы
        process.on('SIGINT', () => {
            console.log('7. Закрытие сервера...');
            if (db && typeof db.close === 'function') {
                db.close((err) => {
                    if (err) {
                        console.error('Ошибка при закрытии базы данных:', err.message);
                    } else {
                        console.log('Подключение к базе данных закрыто');
                    }
                    process.exit(0);
                });
            } else {
                console.error('Ошибка: db не имеет метода close');
                process.exit(1);
            }
        });
    } catch (error) {
        console.error('Ошибка при запуске сервера:', error.message);
        process.exit(1);
    }
}

startServer();
