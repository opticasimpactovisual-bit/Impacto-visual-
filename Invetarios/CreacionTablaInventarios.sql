USE Optica_Impacto_visual;
GO

IF OBJECT_ID('dbo   .Monturas', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Monturas (
        IdMontura       INT IDENTITY(1,1)  NOT NULL,
        Ubicacion       NVARCHAR(100)      NOT NULL,
        Referencia      NVARCHAR(50)       NOT NULL,
        FechaIngreso    DATE               NOT NULL CONSTRAINT DF_Monturas_FechaIngreso DEFAULT (CAST(GETDATE() AS DATE)),
        Cantidad        INT                NOT NULL CONSTRAINT DF_Monturas_Cantidad DEFAULT (0),
        ValorCosto      DECIMAL(12,2)      NOT NULL,
        ValorCliente    DECIMAL(12,2)      NOT NULL,
        Material        NVARCHAR(50)       NULL,
        Forma           NVARCHAR(50)       NULL,
        EstadoMontura   NVARCHAR(30)       NOT NULL CONSTRAINT DF_Monturas_Estado DEFAULT (N'Nueva'),
        Marca           NVARCHAR(100)      NULL,
        EsReplica       BIT                NOT NULL CONSTRAINT DF_Monturas_EsReplica DEFAULT (0),
        NombreReplica   NVARCHAR(100)      NULL,

        CONSTRAINT PK_Monturas PRIMARY KEY (IdMontura),
        CONSTRAINT CK_Monturas_Cantidad CHECK (Cantidad >= 0),
        CONSTRAINT CK_Monturas_ValorCosto CHECK (ValorCosto >= 0),
        CONSTRAINT CK_Monturas_ValorCliente CHECK (ValorCliente >= 0),
        CONSTRAINT CK_Monturas_Estado CHECK (EstadoMontura IN (N'Nueva', N'Usada', N'Exhibición', N'Dañada', N'Vendida')),
        CONSTRAINT CK_Monturas_Replica CHECK (EsReplica = 1 OR NombreReplica IS NULL)
    );

    CREATE INDEX IX_Monturas_Marca ON dbo.Monturas (Marca);
END
GO

USE Optica_Impacto_visual;
GO
ALTER TABLE dbo.Monturas ADD Color NVARCHAR(50) NULL;
GO