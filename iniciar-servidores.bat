@echo off
rem Abre los dos servidores de Optica Impacto Visual, cada uno en su ventana.
rem No cierre esas ventanas mientras use el sistema.
cd /d "%~dp0"

rem Panel, Facturacion, Formulas, Trazabilidad y Accesorios (puerto 5001)
netstat -ano | findstr /r /c:":5001 .*LISTENING" >nul || start "Impacto Visual - Panel (5001)" /d "%~dp0Servidor" cmd /k dotnet run

rem Inventarios (puerto 3002)
netstat -ano | findstr /r /c:":3002 .*LISTENING" >nul || start "Impacto Visual - Inventarios (3002)" /d "%~dp0backend" cmd /k node server.js

rem Espera unos segundos y abre el panel en el navegador
timeout /t 8 /nobreak >nul
start "" http://localhost:5001/
