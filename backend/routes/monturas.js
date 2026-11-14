const express = require('express');
const { sql, getPool } = require('../db');

const router = express.Router();

const COLUMNAS = `IdMontura, Ubicacion, Referencia, FechaIngreso, Cantidad, ValorCosto,
  ValorCliente, Material, Forma, EstadoMontura, Marca, EsReplica, NombreReplica, Color`;

// Convierte el cuerpo de la peticion en parametros tipados
function agregarParametros(request, b) {
  const esReplica = b.EsReplica === true || b.EsReplica === 1 || b.EsReplica === 'Si';
  return request
    .input('Ubicacion', sql.NVarChar(100), b.Ubicacion)
    .input('Referencia', sql.NVarChar(50), b.Referencia)
    .input('FechaIngreso', sql.Date, b.FechaIngreso || new Date())
    .input('Cantidad', sql.Int, b.Cantidad ?? 0)
    .input('ValorCosto', sql.Decimal(12, 2), b.ValorCosto)
    .input('ValorCliente', sql.Decimal(12, 2), b.ValorCliente)
    .input('Material', sql.NVarChar(50), b.Material || null)
    .input('Forma', sql.NVarChar(50), b.Forma || null)
    .input('EstadoMontura', sql.NVarChar(30), b.EstadoMontura || 'Nueva')
    .input('Marca', sql.NVarChar(100), b.Marca || null)
    .input('EsReplica', sql.Bit, esReplica)
    .input('NombreReplica', sql.NVarChar(100), esReplica ? b.NombreReplica || null : null)
    .input('Color', sql.NVarChar(50), b.Color || null);
}

function validar(b) {
  const faltantes = ['Ubicacion', 'Referencia', 'ValorCosto', 'ValorCliente'].filter(
    (c) => b[c] === undefined || b[c] === null || b[c] === ''
  );
  return faltantes.length ? `Campos obligatorios: ${faltantes.join(', ')}` : null;
}

// Listar todas (con filtro opcional ?q= por referencia, marca o ubicacion)
router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const q = req.query.q ? `%${req.query.q}%` : null;
    const result = await pool
      .request()
      .input('q', sql.NVarChar(100), q)
      .query(`SELECT ${COLUMNAS} FROM dbo.Monturas
              WHERE @q IS NULL OR Referencia LIKE @q OR Marca LIKE @q OR Ubicacion LIKE @q
              ORDER BY IdMontura DESC`);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT ${COLUMNAS} FROM dbo.Monturas WHERE IdMontura = @id`);
    if (!result.recordset.length) return res.status(404).json({ error: 'Montura no encontrada' });
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const pool = await getPool();
    const result = await agregarParametros(pool.request(), req.body).query(`
      INSERT INTO dbo.Monturas (Ubicacion, Referencia, FechaIngreso, Cantidad, ValorCosto,
        ValorCliente, Material, Forma, EstadoMontura, Marca, EsReplica, NombreReplica, Color)
      OUTPUT INSERTED.*
      VALUES (@Ubicacion, @Referencia, @FechaIngreso, @Cantidad, @ValorCosto,
        @ValorCliente, @Material, @Forma, @EstadoMontura, @Marca, @EsReplica, @NombreReplica, @Color)`);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const pool = await getPool();
    const result = await agregarParametros(pool.request(), req.body)
      .input('id', sql.Int, req.params.id)
      .query(`
        UPDATE dbo.Monturas SET Ubicacion = @Ubicacion, Referencia = @Referencia,
          FechaIngreso = @FechaIngreso, Cantidad = @Cantidad, ValorCosto = @ValorCosto,
          ValorCliente = @ValorCliente, Material = @Material, Forma = @Forma,
          EstadoMontura = @EstadoMontura, Marca = @Marca, EsReplica = @EsReplica,
          NombreReplica = @NombreReplica, Color = @Color
        OUTPUT INSERTED.*
        WHERE IdMontura = @id`);
    if (!result.recordset.length) return res.status(404).json({ error: 'Montura no encontrada' });
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM dbo.Monturas WHERE IdMontura = @id');
    if (!result.rowsAffected[0]) return res.status(404).json({ error: 'Montura no encontrada' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
