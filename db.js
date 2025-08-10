const mysql = require('mysql2/promise');

// Clever Cloud MySQL connection pool config
// Replace these with your actual Clever Cloud database details
const pool = mysql.createPool({
  host: 'bh6tve9fla0edqcuinq3-mysql.services.clever-cloud.com',          // Replace with your Clever Cloud host
  port: 3306,                                  // Usually 3306 for Clever Cloud
  user: 'uvxoqoo3x1oowpca',          // Replace with your Clever Cloud username
  password: 'QCFNGWiKF7elD9cwTyro',      // Replace with your Clever Cloud password
  database: 'bh6tve9fla0edqcuinq3',      // Replace with your Clever Cloud database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false // Required for Clever Cloud
  }
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Clever Cloud MySQL database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.log('⚠️ Please check your Clever Cloud database credentials');
  });

module.exports = pool;
