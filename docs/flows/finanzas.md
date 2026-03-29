# Finanzas

El modulo de Finanzas de DulceGestion te da una vision completa de la salud economica de tu negocio: cuanto facturas, cuanto gastas y cuanto te queda de ganancia.

El dashboard financiero y los reportes avanzados estan disponibles en el **Plan Profesional**. El registro basico de gastos esta disponible en todos los planes.

## Dashboard financiero

Anda a **Finanzas** en el menu principal. El dashboard te muestra:

### Resumen general

- **Ingresos totales**: la suma de todos los pagos recibidos en el periodo seleccionado.
- **Gastos totales**: la suma de todos los gastos registrados.
- **Ganancia**: ingresos menos gastos.
- **Margen de ganancia**: el porcentaje de ganancia sobre los ingresos.
- **Cantidad de pedidos**: pedidos entregados/completados en el periodo.

### Selector de periodo

Podes ver las finanzas de distintos periodos:

- Mes actual
- Mes anterior
- Ultimos 3 meses
- Ultimos 6 meses
- Ultimo ano
- Rango personalizado (elegis las fechas exactas)

### Graficos

- **Ingresos vs Gastos**: grafico de barras mensual que compara lo que entra y lo que sale.
- **Gastos por categoria**: grafico de torta que muestra como se distribuyen tus gastos entre ingredientes, alquiler, servicios, etc.

### Accesos rapidos

Desde el dashboard financiero tenes botones para ir rapidamente a:
- Registrar un nuevo gasto.
- Ver los gastos operativos.

## Pestanas del modulo financiero

### Resumen

La vista principal con las tarjetas de estadisticas, graficos y los gastos recientes.

### Movimientos

Una linea de tiempo unificada con todos los movimientos de dinero:

- **Ingresos**: pagos recibidos de clientes (indicando numero de pedido, cliente y metodo).
- **Egresos**: gastos registrados (indicando descripcion, proveedor y categoria).

Cada movimiento muestra la fecha, el monto y una descripcion. Los ingresos se muestran en verde y los egresos en rojo.

### Ventas por mes

Un reporte mensual que muestra:
- Ingresos de cada mes.
- Gastos de cada mes.
- Ganancia de cada mes.

Podes ver la evolucion de tu negocio a lo largo del tiempo.

### Top Clientes

Ranking de tus mejores clientes por facturacion:
- Nombre y telefono del cliente.
- Total facturado.
- Cantidad de pedidos.

### Top Productos

Ranking de tus productos mas vendidos:
- Nombre del producto/receta.
- Unidades vendidas.
- Ingresos generados.

## Gastos

### Registrar un gasto

1. Anda a **Gastos** en el menu (o desde el acceso rapido en Finanzas).
2. Toca **Nuevo Gasto**.
3. Completa:
   - **Descripcion** (obligatorio): por ejemplo "Compra de ingredientes en el mayorista".
   - **Monto** (obligatorio): el total del gasto.
   - **Categoria** (obligatorio): por ejemplo "ingredientes", "packaging", "servicios", "equipamiento", etc.
   - **Fecha**: cuando se realizo el gasto.
   - **Proveedor** (opcional, Plan Profesional): si queres vincularlo a un proveedor.
   - **Notas**: detalle adicional.

### Items del gasto (compra de ingredientes)

Si el gasto es una compra de ingredientes, podes detallar que ingredientes compraste:

1. En el formulario de gasto, agrega items de ingredientes.
2. Para cada item indica: ingrediente, cantidad comprada y precio por unidad.
3. Al guardar el gasto:
   - El **stock** del ingrediente se incrementa automaticamente.
   - El **precio** del ingrediente se actualiza al nuevo precio de compra.
   - Si vinculaste un proveedor, se actualiza el precio del proveedor para ese ingrediente.

Lo mismo aplica para items de insumos (packaging, etc.).

### Editar un gasto

Al editar un gasto que tenia items de ingredientes:
- El stock de los ingredientes del gasto anterior se revierte.
- Se aplican los nuevos valores.
- Todo queda registrado en el historial de movimientos.

### Eliminar un gasto

Al eliminar un gasto con items, el stock de los ingredientes se revierte automaticamente.

### Filtrar gastos

Podes filtrar por:
- Rango de fechas.
- Categoria.

## Gastos operativos

Los gastos operativos son los gastos fijos de tu negocio (alquiler, servicios, salarios, etc.) que no estan vinculados a ingredientes.

1. Anda a **Gastos Operativos** desde el menu o el dashboard financiero.
2. Registra gastos con descripcion, monto, categoria y fecha.
3. Podes buscar, editar y eliminar gastos operativos.

## Exportar a CSV

En los reportes de ventas, top clientes y top productos, podes exportar los datos a un archivo CSV para analizarlos en una planilla de calculo (Excel, Google Sheets, etc.).
