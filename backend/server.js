const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { getPool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Sirve la pagina de inventarios en http://localhost:3000/
app.use(express.static(path.join(__dirname, '..', 'Invetarios'), { index: 'Inventarios.html' }));

app.use('/api/monturas', require('./routes/monturas'));

app.get('/api/salud', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1');
    res.json({ ok: true, baseDeDatos: process.env.DB_DATABASE });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Errores de SQL Server traducidos a respuestas claras
app.use((err, req, res, next) => {
  console.error(err);
  const num = err.number || err.originalError?.info?.number;
  if (num === 547) {
    return res.status(400).json({ error: 'Datos invalidos: ' + err.message });
  }
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
