import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '123456',
  database: process.env.MYSQL_DATABASE || 'nft_database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

export async function query(sql: string, values?: any[]) {
  try {
    const [rows] = await pool.execute(sql, values);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

export default pool; 