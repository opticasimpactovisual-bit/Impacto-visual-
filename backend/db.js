// Conexion a SQL Server usando autenticacion de Windows (msnodesqlv8 + ODBC)
const sql = require('mssql/msnodesqlv8');

const config = {
  connectionString:
    `Driver={${process.env.DB_DRIVER}};` +
    `Server=${process.env.DB_SERVER};` +
    `Database=${process.env.DB_DATABASE};` +
    'Trusted_Connection=Yes;TrustServerCertificate=Yes;',
};

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config).catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

module.exports = { sql, getPool };
