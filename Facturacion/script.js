        const total = document.getElementById("Total");
        const abono = document.getElementById("Abono");
        const saldo = document.getElementById("Saldo");

        // Convierte "1.500.000" en el número 1500000
        function leerPesos(campo) {
            return Number(campo.value.replace(/\D/g, "")) || 0;
        }

        // Formatea un campo como pesos colombianos: 1500000 -> 1.500.000
        function formatearPesos(campo) {
            const digitos = campo.value.replace(/\D/g, "");
            campo.value = digitos ? Number(digitos).toLocaleString("es-CO") : "";
        }

        // Saldo = Total - Abono
        function calcularSaldo() {
            const resultado = leerPesos(total) - leerPesos(abono);
            saldo.value = resultado.toLocaleString("es-CO");
        }

        total.addEventListener("input", function () {
            formatearPesos(total);
            calcularSaldo();
        });

        abono.addEventListener("input", function () {
            formatearPesos(abono);
            calcularSaldo();
        });

        // Devuelve el valor de un campo, o null si está vacío
        function valor(id) {
            const texto = document.getElementById(id).value.trim();
            return texto === "" ? null : texto;
        }

        // Código interno de la factura que se está editando (null = factura nueva)
        let idFacturaEditando = null;

        // Envía la factura al servidor, que la guarda en SQL Server.
        // Ningún campo es obligatorio y el número de factura se puede repetir.
        async function guardarFactura() {
            const factura = {
                numeroFactura: valor("N_Factura"),
                fechaVenta: valor("fecha"),
                total: leerPesos(total),
                abono: leerPesos(abono),
                medioPago: valor("MedioPago"),
                cliente: {
                    nombre: valor("Cliente"),
                    tipoDocumento: valor("Tipo_documento"),
                    documento: valor("Documento"),
                    telefono: valor("Telefono"),
                    email: valor("email")
                },
                // Un producto por cada grupo de "Agregar otro producto"
                productos: Array.from(document.querySelectorAll(".producto")).map(function (grupo) {
                    return {
                        tipoMontura: grupo.querySelector("select").value || null,
                        color: grupo.querySelector("[id^='Color']").value.trim() || null,
                        referencia: grupo.querySelector("[id^='Referencia']").value.trim() || null,
                        tipoLente: grupo.querySelector("textarea").value.trim() || null
                    };
                }),
                fechaEntrega: valor("FechaEntrega"),
                horaEntrega: valor("HoraEntrega"),
                detalleEntrega: valor("Detalle"),
                vendedor: valor("Vendedor")
            };

            try {
                const editando = idFacturaEditando !== null;
                const respuesta = await fetch(editando ? "/api/facturas/" + idFacturaEditando : "/api/facturas", {
                    method: editando ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(factura)
                });
                const datos = await respuesta.json();
                if (!respuesta.ok) {
                    alert("No se guardó la factura. " + datos.mensaje);
                    return;
                }
                const numero = factura.numeroFactura ? "No. " + factura.numeroFactura + " " : "";
                if (editando) {
                    alert("Factura " + numero + "actualizada en la base de datos.");
                } else {
                    alert("Factura " + numero + "guardada en la base de datos (código interno " + datos.idFactura + ").");
                }
                limpiarFormulario();
            } catch (error) {
                alert("No hay conexión con el servidor. Inicie el servidor y abra la página en http://localhost:5001");
            }
        }

        // Deja el formulario vacío para la siguiente factura
        function limpiarFormulario() {
            // Quita los productos agregados y deja solo el primero
            document.querySelectorAll(".producto").forEach(function (grupo, indice) {
                if (indice > 0) grupo.remove();
            });
            contadorProductos = 1;

            document.querySelectorAll("input, textarea").forEach(function (campo) {
                campo.value = "";
            });
            document.querySelectorAll("select").forEach(function (campo) {
                campo.selectedIndex = 0;
            });

            // Vuelve al modo "factura nueva"
            idFacturaEditando = null;
            document.getElementById("avisoEdicion").hidden = true;
            document.getElementById("resultados").hidden = true;
            document.getElementById("guardar").textContent = "Guardar Factura";

            window.scrollTo(0, 0);
        }

        document.getElementById("guardar").addEventListener("click", guardarFactura);


        // ---------- Buscar y editar una factura anterior ----------
        const resultados = document.getElementById("resultados");

        // "2026-11-01T00:00:00" -> "2026-11-01" (formato de los campos de fecha)
        function soloFecha(texto) {
            return texto ? texto.substring(0, 10) : "";
        }

        // "2026-11-01" -> "01/11/2026"
        function fechaCorta(texto) {
            const f = soloFecha(texto);
            return f ? f.substring(8, 10) + "/" + f.substring(5, 7) + "/" + f.substring(0, 4) : "Sin fecha";
        }

        function pesos(numero) {
            return "$" + Number(numero || 0).toLocaleString("es-CO");
        }

        // Pone un valor en una lista; si viene vacío deja la primera opción
        function elegir(campo, valor) {
            campo.value = valor || "";
            if (campo.selectedIndex === -1) campo.selectedIndex = 0;
        }

        async function buscarFacturas() {
            const texto = document.getElementById("Buscar").value.trim();
            if (!texto) return;

            let lista;
            try {
                const respuesta = await fetch("/api/facturas/buscar?texto=" + encodeURIComponent(texto));
                lista = await respuesta.json();
            } catch (error) {
                alert("No hay conexión con el servidor. Inicie el servidor y abra la página en http://localhost:5001");
                return;
            }

            resultados.innerHTML = "";
            if (lista.length === 0) {
                const vacio = document.createElement("li");
                vacio.className = "vacio";
                vacio.textContent = "No se encontró ninguna factura con \"" + texto + "\".";
                resultados.appendChild(vacio);
            }
            lista.forEach(function (f) {
                const boton = document.createElement("button");
                boton.type = "button";
                boton.className = "abrir";
                const partes = [
                    ["num", "No. " + (f.numero_factura || "—")],
                    ["fec", fechaCorta(f.fecha_venta)],
                    ["cli", (f.cliente || "Sin cliente") + (f.documento ? " · " + (f.tipo_documento || "") + " " + f.documento : "")],
                    ["val", "Total " + pesos(f.total) + " · Saldo " + pesos(f.saldo)]
                ];
                partes.forEach(function (p) {
                    const span = document.createElement("span");
                    span.className = p[0];
                    span.textContent = p[1];
                    boton.appendChild(span);
                });
                boton.addEventListener("click", function () {
                    cargarFactura(f.id_factura);
                });
                const eliminar = document.createElement("button");
                eliminar.type = "button";
                eliminar.className = "eliminar";
                eliminar.textContent = "Eliminar";
                eliminar.addEventListener("click", function () {
                    eliminarFactura(f, li);
                });

                const li = document.createElement("li");
                li.appendChild(boton);
                li.appendChild(eliminar);
                resultados.appendChild(li);
            });
            resultados.hidden = false;
        }

        // Borra la factura de SQL Server después de confirmar. También se borran sus productos y fórmulas.
        async function eliminarFactura(f, li) {
            const nombre = "No. " + (f.numero_factura || "—") + (f.cliente ? " de " + f.cliente : "");
            if (!confirm("¿Eliminar la factura " + nombre + "?\n\nTambién se borran sus productos y sus fórmulas. Esto no se puede deshacer.")) {
                return;
            }

            try {
                const respuesta = await fetch("/api/facturas/" + f.id_factura, { method: "DELETE" });
                const datos = await respuesta.json();
                if (!respuesta.ok) {
                    alert("No se eliminó la factura. " + datos.mensaje);
                    return;
                }
            } catch (error) {
                alert("No hay conexión con el servidor. Inicie el servidor y abra la página en http://localhost:5001");
                return;
            }

            // Si era la factura que se estaba editando, el formulario vuelve a factura nueva
            if (idFacturaEditando === f.id_factura) limpiarFormulario();

            li.remove();
            if (!resultados.querySelector("li")) resultados.hidden = true;
            alert("Factura " + nombre + " eliminada.");
        }

        // Trae la factura del servidor y la pone en el formulario para editarla
        async function cargarFactura(id) {
            let f;
            try {
                const respuesta = await fetch("/api/facturas/" + id);
                f = await respuesta.json();
                if (!respuesta.ok) {
                    alert(f.mensaje);
                    return;
                }
            } catch (error) {
                alert("No hay conexión con el servidor. Inicie el servidor y abra la página en http://localhost:5001");
                return;
            }

            limpiarFormulario();

            document.getElementById("N_Factura").value = f.numero_factura || "";
            document.getElementById("fecha").value = soloFecha(f.fecha_venta);
            total.value = f.total ? Number(f.total).toLocaleString("es-CO") : "";
            abono.value = f.abono ? Number(f.abono).toLocaleString("es-CO") : "";
            calcularSaldo();
            elegir(document.getElementById("MedioPago"), f.medio_pago);

            document.getElementById("Cliente").value = f.cliente || "";
            elegir(document.getElementById("Tipo_documento"), f.tipo_documento);
            document.getElementById("Documento").value = f.documento || "";
            document.getElementById("Telefono").value = f.telefono || "";
            document.getElementById("email").value = f.email || "";

            // Un grupo de producto por cada producto guardado
            const lista = f.productos || [];
            for (let i = 1; i < lista.length; i++) {
                document.getElementById("agregarProducto").click();
            }
            document.querySelectorAll(".producto").forEach(function (grupo, i) {
                const p = lista[i];
                if (!p) return;
                elegir(grupo.querySelector("select"), p.tipo_montura);
                grupo.querySelector("[id^='Color']").value = p.color || "";
                grupo.querySelector("[id^='Referencia']").value = p.referencia || "";
                grupo.querySelector("textarea").value = p.tipo_lente || "";
            });

            document.getElementById("FechaEntrega").value = soloFecha(f.fecha_entrega);
            document.getElementById("HoraEntrega").value = f.hora_entrega ? f.hora_entrega.substring(0, 5) : "";
            document.getElementById("Detalle").value = f.detalle_entrega || "";
            document.getElementById("Vendedor").value = f.vendedor || "";

            // Modo edición: Guardar actualiza esta factura en vez de crear otra
            idFacturaEditando = f.id_factura;
            document.getElementById("textoEdicion").textContent =
                "No. " + (f.numero_factura || "—") + (f.cliente ? " de " + f.cliente : "");
            document.getElementById("avisoEdicion").hidden = false;
            document.getElementById("guardar").textContent = "Guardar cambios";
        }

        document.getElementById("botonBuscar").addEventListener("click", buscarFacturas);
        document.getElementById("Buscar").addEventListener("keydown", function (evento) {
            if (evento.key === "Enter") buscarFacturas();
        });
        document.getElementById("nuevaFactura").addEventListener("click", limpiarFormulario);

        // Abre la ventana de impresión del navegador (también permite guardar como PDF)
        document.getElementById("imprimir").addEventListener("click", function () {
            window.print();
        });


        // Agrega otro grupo de montura, color, referencia y lente copiando el primero
        const productos = document.getElementById("productos");
        let contadorProductos = 1;

        document.getElementById("agregarProducto").addEventListener("click", function () {
            contadorProductos++;
            const nuevo = productos.querySelector(".producto").cloneNode(true);

            // Cada campo necesita un id distinto: Montura_2, Color_2, ...
            nuevo.querySelectorAll("input, select, textarea").forEach(function (campo) {
                campo.id = campo.id + "_" + contadorProductos;
                campo.name = campo.id;
                campo.value = "";
                if (campo.tagName === "SELECT") campo.selectedIndex = 0;
            });
            nuevo.querySelectorAll("label").forEach(function (etiqueta) {
                etiqueta.htmlFor = etiqueta.htmlFor + "_" + contadorProductos;
            });

            const quitar = nuevo.querySelector(".quitar");
            quitar.hidden = false;
            quitar.addEventListener("click", function () {
                nuevo.remove();
            });

            productos.appendChild(nuevo);
        });


        // ---------- Imprimir con RX ----------
        // Busca la fórmula (RX) guardada para el número de factura, la pone al final
        // de la hoja solo para imprimir, abre la impresión y después la quita.
        const botonImprimirRx = document.getElementById("imprimirRx");
        if (botonImprimirRx) botonImprimirRx.addEventListener("click", imprimirConRx);

        function textoCelda(etiqueta, texto, clase) {
            const el = document.createElement(etiqueta);
            el.textContent = texto == null || texto === "" ? "—" : texto;
            if (clase) el.className = clase;
            return el;
        }

        function armarRx(formulas) {
            const bloque = document.createElement("section");
            bloque.id = "rxImpresion";
            bloque.className = "rx-impresion";

            const titulo = document.createElement("p");
            titulo.className = "titulo";
            titulo.textContent = "RX - Fórmula óptica";
            bloque.appendChild(titulo);

            formulas.forEach(function (fo) {
                const tarjeta = document.createElement("div");
                tarjeta.className = "rx-formula";

                const datos = document.createElement("div");
                datos.className = "rx-datos";
                datos.append(
                    textoCelda("span", "Paciente: " + (fo.nombre_cliente || "—")),
                    textoCelda("span", "Doctor: " + (fo.doctor || "—"))
                );
                tarjeta.appendChild(datos);

                const tabla = document.createElement("table");
                tabla.className = "rx-tabla";
                const encabezado = document.createElement("tr");
                ["", "Fórmula", "ADD", "DP", "Altura"].forEach(function (t) {
                    encabezado.appendChild(textoCelda("th", t || " "));
                });
                tabla.appendChild(encabezado);

                [["OD", fo.ojo_derecho], ["OI", fo.ojo_izquierdo]].forEach(function (ojo, i) {
                    const fila = document.createElement("tr");
                    fila.append(
                        textoCelda("th", ojo[0]),
                        textoCelda("td", ojo[1], "rx-numero")
                    );
                    // ADD, distancia y altura se escriben una sola vez para los dos ojos
                    if (i === 0) {
                        [fo.adicion, fo.distancia, fo.altura].forEach(function (valor) {
                            const td = textoCelda("td", valor, "rx-numero");
                            td.rowSpan = 2;
                            fila.appendChild(td);
                        });
                    }
                    tabla.appendChild(fila);
                });
                tarjeta.appendChild(tabla);

                const lente = document.createElement("div");
                lente.className = "rx-datos";
                lente.append(
                    textoCelda("span", "Lente: " + (fo.tipo_lente || "—")),
                    textoCelda("span", "Montura: " + (fo.tipo_montura || "—"))
                );
                tarjeta.appendChild(lente);
                bloque.appendChild(tarjeta);
            });
            return bloque;
        }

        async function imprimirConRx() {
            const numero = document.getElementById("N_Factura").value.trim();
            if (!numero) {
                alert("Escriba o busque el número de la factura para traer su fórmula (RX).");
                return;
            }

            let datos;
            try {
                const respuesta = await fetch("/api/formulas/factura?numero=" + encodeURIComponent(numero));
                datos = await respuesta.json();
                if (!respuesta.ok) {
                    alert((datos && datos.mensaje) || "No se encontró la factura " + numero + ".");
                    return;
                }
            } catch (error) {
                alert("No hay conexión con el servidor. Inicie el servidor y abra la página en http://localhost:5001");
                return;
            }

            const formulas = datos.formulas || [];
            if (formulas.length === 0) {
                const seguir = confirm("La factura " + numero + " no tiene fórmula (RX) guardada.\n" +
                    "Guárdela en la página Fórmulas de clientes.\n\n¿Desea imprimir la factura sin RX?");
                if (seguir) window.print();
                return;
            }

            const anterior = document.getElementById("rxImpresion");
            if (anterior) anterior.remove();
            const rx = armarRx(formulas);
            document.querySelector(".pie").before(rx);

            window.addEventListener("afterprint", function () { rx.remove(); }, { once: true });
            window.print();
        }
