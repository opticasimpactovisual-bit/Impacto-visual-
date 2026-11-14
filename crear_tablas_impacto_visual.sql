-- =============================================================
-- Tablas de Optica Impacto Visual - NIT 1121207872-6
-- Motor: Microsoft SQL Server (Express)
-- Ejecutar en SQL Server Management Studio con F5
-- Se puede ejecutar varias veces: solo crea lo que falte y no borra datos
-- =============================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE Optica_Impacto_visual;
GO

-- -------------------------------------------------------------
-- Clientes (sección "Cliente" de Facturacion.html)
-- -------------------------------------------------------------
IF OBJECT_ID(N'dbo.clientes', N'U') IS NULL
CREATE TABLE dbo.clientes (
    id_cliente      INT IDENTITY(1,1) PRIMARY KEY,
    nombre          NVARCHAR(120),
    tipo_documento  VARCHAR(3) DEFAULT 'CC'
                    CONSTRAINT chk_tipo_documento CHECK (tipo_documento IN ('CC', 'CE', 'TI', 'NIT')),
    documento       VARCHAR(20),
    telefono        VARCHAR(20),
    email           NVARCHAR(120),
    creado_en       DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'uq_cliente_documento')
    CREATE UNIQUE INDEX uq_cliente_documento
        ON dbo.clientes (tipo_documento, documento)
        WHERE documento IS NOT NULL;
GO

-- -------------------------------------------------------------
-- Facturas (Facturacion.html)
-- -------------------------------------------------------------
IF OBJECT_ID(N'dbo.facturas', N'U') IS NULL
CREATE TABLE dbo.facturas (
    id_factura      INT IDENTITY(1,1) PRIMARY KEY,
    numero_factura  VARCHAR(20),
    fecha_venta     DATE,
    id_cliente      INT
                    CONSTRAINT fk_factura_cliente REFERENCES dbo.clientes (id_cliente),
    total           DECIMAL(12,2) DEFAULT 0,
    abono           DECIMAL(12,2) DEFAULT 0,
    saldo           AS (total - abono) PERSISTED,
    medio_pago      VARCHAR(20)
                    CONSTRAINT chk_medio_pago CHECK (medio_pago IN (
                        'Efectivo', 'TC', 'TD', 'Sistecredito', 'ADDI',
                        'Nequi', 'Daviplata', 'BoldQR')),
    fecha_entrega   DATE,
    hora_entrega    TIME(0),
    detalle_entrega NVARCHAR(255),
    vendedor        NVARCHAR(120),
    creado_en       DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_valores_positivos CHECK (total >= 0 AND abono >= 0),
    CONSTRAINT chk_abono_no_mayor CHECK (abono <= total)
);
GO

-- -------------------------------------------------------------
-- Productos de cada factura (botón "Agregar otro producto")
-- -------------------------------------------------------------
IF OBJECT_ID(N'dbo.factura_productos', N'U') IS NULL
CREATE TABLE dbo.factura_productos (
    id_producto     INT IDENTITY(1,1) PRIMARY KEY,
    id_factura      INT NOT NULL
                    CONSTRAINT fk_producto_factura REFERENCES dbo.facturas (id_factura)
                    ON DELETE CASCADE,
    tipo_montura    VARCHAR(30)
                    CONSTRAINT chk_tipo_montura CHECK (tipo_montura IN (
                        'TR90', 'Acetato', 'Metalica', '3Piezas',
                        'SobrepuestoTR90', 'SobrepuestoMetalica',
                        'AireMetalica', 'AireAcetato', 'AireTr90',
                        'Pacientedejamontura')),
    color           NVARCHAR(60),
    referencia      NVARCHAR(60),
    tipo_lente      NVARCHAR(MAX)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_facturas_numero')
    CREATE INDEX idx_facturas_numero  ON dbo.facturas (numero_factura);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_facturas_fecha')
    CREATE INDEX idx_facturas_fecha   ON dbo.facturas (fecha_venta);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_facturas_cliente')
    CREATE INDEX idx_facturas_cliente ON dbo.facturas (id_cliente);
GO

-- -------------------------------------------------------------
-- Fórmulas (Formulas_clientes.html)
-- -------------------------------------------------------------
IF OBJECT_ID(N'dbo.formulas', N'U') IS NULL
CREATE TABLE dbo.formulas (
    id_formula      INT IDENTITY(1,1) PRIMARY KEY,
    id_factura      INT
                    CONSTRAINT fk_formula_factura REFERENCES dbo.facturas (id_factura)
                    ON DELETE CASCADE,
    nombre_cliente  NVARCHAR(120),
    ojo_derecho     NVARCHAR(60),
    ojo_izquierdo   NVARCHAR(60),
    adicion         NVARCHAR(20),
    distancia       NVARCHAR(20),
    altura          NVARCHAR(20),
    tipo_lente      NVARCHAR(MAX),
    tipo_montura    NVARCHAR(60),
    doctor          NVARCHAR(120),
    fecha_entrega   DATE,
    hora_entrega    TIME(0),
    creado_en       DATETIME2(0) DEFAULT SYSDATETIME()
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_formulas_factura')
    CREATE INDEX idx_formulas_factura ON dbo.formulas (id_factura);
GO

-- -------------------------------------------------------------
-- Trazabilidad (trasavilidad.html)
-- -------------------------------------------------------------
IF OBJECT_ID(N'dbo.trazabilidad', N'U') IS NULL
CREATE TABLE dbo.trazabilidad (
    id_trazabilidad   INT IDENTITY(1,1) PRIMARY KEY,
    numero_orden      NVARCHAR(30),
    fecha_adquirencia DATE,
    nombre_paciente   NVARCHAR(120),
    proveedor         NVARCHAR(120),
    fecha_envio       DATE,
    prescripcion_od   NVARCHAR(60),
    prescripcion_oi   NVARCHAR(60),
    prescripcion_add  NVARCHAR(60),
    fecha_llegada     DATE,
    material          NVARCHAR(MAX),
    montura           NVARCHAR(120),
    invima_1          NVARCHAR(60),
    invima_2          NVARCHAR(60),
    lote_1            NVARCHAR(60),
    lote_2            NVARCHAR(60),
    lensometria_od    NVARCHAR(60),
    lensometria_oi    NVARCHAR(60),
    lensometria_add   NVARCHAR(60),
    aprobado          BIT,
    devolucion        BIT,
    creado_en         DATETIME2(0) DEFAULT SYSDATETIME()
);
GO

-- -------------------------------------------------------------
-- Inventario de accesorios (Accesorios)
-- -------------------------------------------------------------
IF OBJECT_ID(N'dbo.Accesorios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Accesorios (
        IdAccesorio     INT IDENTITY(1,1)  NOT NULL,
        TipoProducto    NVARCHAR(40)       NOT NULL,
        Referencia      NVARCHAR(60)       NULL,
        Cantidad        INT                NOT NULL CONSTRAINT DF_Accesorios_Cantidad DEFAULT (0),
        FechaIngreso    DATE               NOT NULL CONSTRAINT DF_Accesorios_FechaIngreso DEFAULT (CAST(GETDATE() AS DATE)),
        ValorCosto      DECIMAL(12,2)      NULL,
        ValorCliente    DECIMAL(12,2)      NULL,
        Observaciones   NVARCHAR(255)      NULL,
        CreadoEn        DATETIME2(0)       NOT NULL CONSTRAINT DF_Accesorios_CreadoEn DEFAULT (SYSDATETIME()),
        CONSTRAINT PK_Accesorios PRIMARY KEY (IdAccesorio),
        CONSTRAINT CK_Accesorios_Tipo CHECK (TipoProducto IN (
            N'Plaquetas', N'Tornillos', N'Pañitos', N'Líquido antiempañante',
            N'Terminales', N'Cordón', N'Cadenas', N'Colas de ratón',
            N'Reparación', N'Otros')),
        CONSTRAINT CK_Accesorios_Cantidad CHECK (Cantidad >= 0),
        CONSTRAINT CK_Accesorios_ValorCosto CHECK (ValorCosto >= 0),
        CONSTRAINT CK_Accesorios_ValorCliente CHECK (ValorCliente >= 0)
    );
    CREATE INDEX IX_Accesorios_Tipo ON dbo.Accesorios (TipoProducto);
END
GO

-- Ver las tablas creadas
SELECT name AS tabla FROM sys.tables ORDER BY name;
GO
