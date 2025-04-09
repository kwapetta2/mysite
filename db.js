const sqlite3 = require('sqlite3').verbose();

function initializeDatabase() {
    const dbPath = './users.db';
    console.log('A. Попытка открыть базу данных по пути:', dbPath);

    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('B. Ошибка подключения к базе данных:', err.message);
            throw err;
        }
        console.log('C. Подключение к базе данных установлено');
    });

    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error('D. Ошибка при создании таблицы:', err.message);
            } else {
                console.log('E. Таблица users успешно создана (или уже существует)');
            }
        });

        db.all("PRAGMA table_info(users)", (err, rows) => {
            if (err) {
                console.error('F. Ошибка при получении структуры таблицы:', err.message);
            } else {
                console.log('G. Структура таблицы users:', rows);
            }
        });
    });

    return db;
}

module.exports = initializeDatabase;
