# Produccion

El modulo de Produccion te permite gestionar el stock de tus recetas y productos terminados, planificar la produccion segun tus pedidos pendientes, y llevar un historial completo de todo lo que producis.

Esta funcion esta disponible en el **Plan Profesional**.

## Secciones de Produccion

La pagina de Produccion tiene cuatro pestanas:

### Planificacion

La planificacion te muestra que necesitas producir para cumplir con tus pedidos pendientes:

- Analiza los pedidos con estado **pendiente** y **preparando**.
- Calcula cuantas unidades de cada receta y producto necesitas.
- Compara con el stock actual que tenes.
- Te muestra el **faltante**: cuanto necesitas producir de cada cosa.
- Desde ahi podes **cocinar** directamente las cantidades necesarias.
- Tambien podes ir a la **lista de compras** (Faltantes) para saber que ingredientes te faltan.

### Recetas

Una tabla con todas tus recetas que tienen rastreo de stock activado:

- Nombre de la receta.
- Stock actual (en la unidad de rendimiento de la receta).
- Acciones: **Cocinar** y **Ajustar stock**.

### Productos

Una tabla con todos tus productos que tienen rastreo de stock activado:

- Nombre del producto.
- Stock actual.
- Acciones: **Producir** y **Ajustar stock**.

### Historial

Un registro completo de todos los movimientos de stock de recetas y productos:

- Tipo de movimiento: coccion, produccion, venta, ajuste manual.
- Receta o producto afectado.
- Cantidad (positiva si se produjo, negativa si se consumio/vendio).
- Descripcion del movimiento.
- Fecha y hora.

Podes filtrar el historial por tipo de movimiento.

## Cocinar una receta

Cocinar una receta significa producirla: se descuentan los ingredientes del stock y se suman las unidades producidas al stock de la receta.

1. En la pestana de Recetas (o desde Planificacion), toca **Cocinar** en la receta que queres producir.
2. Indica cuantas unidades queres cocinar (por ejemplo, 2 tandas de galletitas).
3. Confirma la accion.
4. El sistema:
   - Descuenta automaticamente todos los ingredientes necesarios (calculados segun la receta, incluyendo sub-recetas recursivamente).
   - Incrementa el stock de la receta con la cantidad producida.
   - Registra el movimiento en el historial de produccion.
   - Registra los movimientos de ingredientes en el historial de stock.

En el plan Emprendedor, se descuentan los ingredientes pero no se incrementa el stock de la receta (eso requiere el plan Profesional).

## Producir un producto

Similar a cocinar, pero para productos (que pueden contener varias recetas):

1. En la pestana de Productos, toca **Producir**.
2. Indica la cantidad.
3. Se registra el movimiento de stock del producto.

## Ajuste manual de stock

Si necesitas corregir el stock de una receta o producto sin cocinar/producir (por ejemplo, por una perdida, donacion o error):

1. Toca **Ajustar** en la receta o producto.
2. Indica la cantidad (positiva para sumar, negativa para restar).
3. Agrega una descripcion opcional.
4. Se registra como "Ajuste manual" en el historial.

## Descuento automatico por ventas

Cuando se vende una receta o producto (ya sea por pedido entregado o venta rapida POS), el stock se descuenta automaticamente:

- **Venta rapida (POS)**: el stock se descuenta al confirmar la venta.
- **Pedidos**: el stock se descuenta cuando marcas el pedido como entregado y usas el boton "Descontar stock".

Estos descuentos se registran en el historial con tipo "venta" y referencia al numero de pedido.

## Resumen en pantalla

En la parte superior de la pagina de Produccion ves chips resumen con:

- Total de recetas con rastreo.
- Total de productos con rastreo.
- Cantidad rastreada.
- Cantidad con stock bajo (stock menor a 1).

## Activar rastreo de stock en recetas y productos

Para que una receta o producto aparezca en Produccion, necesitas activar la opcion **Rastrear stock** en su formulario de edicion. Si no lo activas, no se lleva el conteo de stock para ese item.
