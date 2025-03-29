const sqlite3 = require('sqlite3').verbose();

const initializeDatabase = async () => {
    const dbPath = 'C:/Users/Анита/Desktop/site/users.db'; // Укажите ваш путь
    console.log('A. Попытка открыть базу данных по пути:', dbPath);

    const db = await new Promise((resolve, reject) => {
        const dbInstance = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('B. Ошибка подключения к базе данных:', err.message);
                reject(err);
            } else {
                console.log('C. Подключение к базе данных установлено');
                resolve(dbInstance);
            }
        });
    });

    console.log('D. db после создания:', db, 'typeof db.run:', typeof db.run, 'typeof db.close:', typeof db.close);
    if (!db || typeof db.run !== 'function' || typeof db.close !== 'function') {
        throw new Error('Объект базы данных не инициализирован корректно');
    }

    await new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT UNIQUE,
                password TEXT
            )`, (err) => {
            if (err) {
                console.error('E. Ошибка при создании таблицы:', err.message);
                reject(err);
            } else {
                console.log('F. Таблица пользователей успешно создана (или уже существует)');
                resolve();
            }
        });
    });

    return db;
};

module.exports = initializeDatabase;