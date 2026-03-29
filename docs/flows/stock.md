# Stock e Ingredientes

DulceGestion te permite llevar un control completo del stock de tus ingredientes (materias primas). Sabes en todo momento cuanto te queda de cada cosa y el sistema te avisa cuando algo esta por agotarse.

## Agregar un ingrediente

1. Anda a **Ingredientes** en el menu principal.
2. Toca **Nuevo Ingrediente**.
3. Completa los datos:
   - **Nombre** (obligatorio): por ejemplo "Harina 000".
   - **Unidad** (obligatorio): la unidad de medida, por ejemplo "kg", "litros", "unidades".
   - **Precio por unidad** (obligatorio): cuanto te sale cada unidad. Por ejemplo, si 1 kg de harina cuesta $500, pones 500.
   - **Stock actual**: cuantas unidades tenes en este momento.
   - **Rastrear stock**: si esta activado, el sistema lleva la cuenta del stock y te avisa cuando baja.
   - **Umbral de alerta**: podes definir un umbral personalizado para este ingrediente. Si no lo pones, se usa el umbral general que configuraste en Ajustes.

## Importar ingredientes desde CSV

Si tenes muchos ingredientes para cargar, podes importarlos masivamente:

1. En la lista de ingredientes, toca **Importar CSV**.
2. Subi un archivo CSV con columnas: nombre, unidad, precio por unidad, stock (opcional), umbral (opcional).
3. El sistema valida cada fila y te muestra errores si los hay.
4. Se pueden importar hasta 500 ingredientes por vez.

## Editar un ingrediente

Toca un ingrediente de la lista para editarlo. Podes cambiar:
- Nombre, unidad, precio por unidad.
- Stock actual (si cambias el stock manualmente, se registra como "Ajuste manual" en el historial).
- Umbral de alerta.
- Si se rastrea el stock o no.

## Historial de precios

Cada ingrediente tiene un historial de precios que se arma automaticamente cada vez que registras una compra (gasto con items de ingredientes). Podes ver como fue subiendo el precio a lo largo del tiempo con un grafico.

## Alertas de stock bajo

Cuando el stock de un ingrediente baja del umbral configurado, aparece una alerta:

- En el **Dashboard** principal ves cuantos ingredientes estan con stock bajo.
- En la **lista de ingredientes** se resaltan los que estan por debajo del umbral.
- Podes configurar las alertas desde **Configuraciones**:
  - **Activar/desactivar alertas de stock**: si no queres que te avise, desactivalas.
  - **Umbral general**: el minimo por defecto para todos los ingredientes (por ejemplo, 10 unidades).
  - Cada ingrediente puede tener su propio umbral que sobreescribe al general.

## Descuento automatico de stock

El stock de ingredientes se descuenta automaticamente en estas situaciones:

- **Al cocinar una receta** (desde Produccion): se descuenta la cantidad exacta de cada ingrediente segun la receta y la cantidad que cocinaste. Si la receta tiene sub-recetas, se descuentan recursivamente todos los ingredientes.
- **Al registrar una venta rapida (POS)**: si la receta/producto tiene rastreo de stock, se descuenta al confirmar la venta.

## Incremento automatico de stock

El stock se incrementa automaticamente cuando:

- **Registras un gasto de compra de ingredientes**: al cargar un gasto en la seccion de Gastos e incluir items de ingredientes, el stock se suma automaticamente. Si despues editas o eliminas ese gasto, el stock se revierte.

## Ajuste manual de stock

Si necesitas corregir el stock sin registrar una compra o produccion:

1. Anda a **Historial de Stock** (accesible desde ingredientes).
2. Usa la opcion de **Ajuste manual**.
3. Indica el ingrediente, la cantidad (positiva para sumar, negativa para restar) y una descripcion.
4. Se registra en el historial de movimientos.

Tambien podes editar directamente el campo de stock de un ingrediente y se registra como ajuste manual.

## Historial de movimientos de stock

Cada cambio en el stock queda registrado con:

- **Tipo**: compra, coccion, ajuste manual, o venta.
- **Cantidad**: cuanto se sumo o resto.
- **Stock anterior y nuevo**: para ver el antes y despues.
- **Descripcion**: que origino el movimiento.
- **Fecha**: cuando ocurrio.

Podes filtrar el historial por tipo de movimiento y por ingrediente especifico.

## Lista de compras (Faltantes)

La lista de compras te ayuda a saber que necesitas comprar para cumplir con tus pedidos:

1. Anda a **Faltantes** en el menu.
2. Selecciona un rango de fechas para los pedidos que queres cubrir, o un pedido especifico.
3. Toca **Generar Lista**.
4. El sistema:
   - Analiza todos los pedidos pendientes/en preparacion en ese rango.
   - Calcula los ingredientes e insumos necesarios para producir todo.
   - Resta el stock que ya tenes.
   - Te muestra la lista de lo que te falta comprar, con cantidades y costos estimados.
5. Podes imprimir la lista para ir al proveedor.

La lista de compras tambien se puede generar desde la seccion de Produccion (planificacion), que te lleva directamente a Faltantes con las fechas pre-cargadas.

## Eliminar un ingrediente

Solo podes eliminar un ingrediente si no esta siendo usado en ninguna receta ni en gastos registrados. Si esta en uso, el sistema te indica donde esta referenciado.

## Proveedores (Plan Profesional)

En el plan Profesional podes cargar proveedores y vincularlos a ingredientes:

- Cada proveedor puede tener precios distintos para el mismo ingrediente.
- Al registrar una compra y vincularla a un proveedor, se actualiza automaticamente el precio del proveedor para ese ingrediente.
- La seccion de comparacion de proveedores te muestra quien te ofrece mejor precio para cada ingrediente.

## Limites del plan

- **Plan Emprendedor (gratis)**: hasta 50 ingredientes.
- **Plan Profesional**: ingredientes ilimitados. Ademas, acceso a proveedores y comparacion de precios.
