const mysql = require('mysql2/promise');

// MySQL connection pool config
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',     // CHANGE THIS
  password: '1234', // CHANGE THIS
  database: 'eventwise_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
