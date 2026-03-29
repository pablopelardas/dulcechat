# Pedidos

Los pedidos son el flujo principal de tu negocio en DulceGestion. Podes crear pedidos manualmente, recibirlos desde el catalogo publico, o generarlos desde la venta rapida (POS).

## Crear un pedido

1. Anda a **Pedidos** en el menu principal.
2. Toca **Nuevo Pedido**.
3. Completa los datos:
   - **Cliente** (obligatorio para pedidos manuales): selecciona un cliente existente o crea uno nuevo.
   - **Fecha de entrega**: cuando el cliente necesita el pedido.
   - **Items**: agrega recetas y/o productos al pedido, indicando cantidad y precio de cada uno.
   - **Ajuste de precio**: podes sumar o restar un monto al total (por ejemplo, un descuento o un recargo por delivery).
   - **Codigo de descuento**: si tenes codigos de descuento configurados, el cliente o vos pueden aplicar uno. El sistema valida que sea vigente y calcula el descuento automaticamente.
   - **Notas**: cualquier indicacion especial del cliente.
4. Al guardar, se genera automaticamente un **numero de pedido** con formato AAMM-XXX (por ejemplo, 2603-001 para el primer pedido de marzo 2026).

## Estados del pedido

Cada pedido pasa por estos estados:

- **Pendiente**: el pedido fue creado pero todavia no se empezo a preparar.
- **Preparando**: estas trabajando en el pedido.
- **Listo**: el pedido esta terminado y esperando la entrega.
- **Entregado**: el cliente ya recibio el pedido.
- **Cancelado**: el pedido fue cancelado.

Podes cambiar el estado desde el detalle del pedido. Cuando cambias el estado, opcionalmente podes notificar al cliente por WhatsApp.

## Pagos

### Registrar un pago

1. Abri el detalle del pedido.
2. En la seccion de pagos, toca **Registrar Pago**.
3. Indica:
   - **Monto**: cuanto pago el cliente.
   - **Metodo de pago**: Efectivo, Transferencia, MercadoPago o Tarjeta.
   - **Fecha**: por defecto es hoy, pero podes cambiarla.
   - **Notas**: opcional, por ejemplo "seña por transferencia".

### Pagos parciales (seña)

Podes registrar pagos parciales. Por ejemplo, si el pedido sale $10.000 y el cliente deja una seña de $5.000, registras ese pago y el sistema actualiza automaticamente el estado de pago:

- **Impago**: no se registro ningun pago.
- **Seña**: se pago una parte pero no el total.
- **Pagado**: se pago el total o mas.

El sistema muestra una barra de progreso visual del pago.

### Metodos de pago disponibles

- Efectivo
- Transferencia bancaria
- MercadoPago
- Tarjeta (debito/credito)

### Eliminar un pago

Si registraste un pago por error, podes eliminarlo desde el historial de pagos del pedido. El estado de pago se recalcula automaticamente.

## Filtrar pedidos

En la lista de pedidos podes filtrar por:

- **Fecha**: rango de fechas de entrega (desde - hasta).
- **Estado**: filtrar por uno o varios estados (pendiente, preparando, listo, entregado, cancelado).

Esto te ayuda a ver rapidamente, por ejemplo, todos los pedidos pendientes de esta semana.

## Editar un pedido

Podes editar cualquier campo de un pedido existente: cliente, fecha, items, ajustes de precio, notas. Los pagos ya registrados se mantienen.

## Eliminar un pedido

Si necesitas eliminar un pedido, se borran todos los items y pagos asociados. Esta accion no se puede deshacer.

## Descuento de stock al entregar

Cuando marcas un pedido como "Entregado", podes descontar el stock de las recetas y productos incluidos. Esto es util si rastrear el stock de tus productos terminados (funcion del plan Profesional).

- El boton **Descontar stock** aparece en pedidos entregados que todavia no tuvieron descuento.
- El descuento se registra en el historial de produccion.
- No se puede descontar dos veces el mismo pedido.

## Pedidos del catalogo

Cuando un cliente hace un pedido desde tu catalogo publico, aparece en tu lista de pedidos con el origen "Catalogo". Estos pedidos:

- Llegan sin cliente asignado (porque el cliente del catalogo no esta necesariamente en tu base).
- Muestran el nombre y telefono que ingreso el cliente al hacer el pedido.
- Podes **aceptarlos** (asignandoles un cliente existente o creando uno nuevo) o **rechazarlos** (se cancelan).

Cuando llega un pedido del catalogo, recibis una notificacion por email.

## Calendario de pedidos

DulceGestion incluye una vista de calendario donde podes ver las entregas organizadas por dia y semana. Esto te ayuda a planificar tu produccion.

## Envio por WhatsApp

Desde el detalle de un pedido podes:

- Enviar el detalle del pedido al cliente por WhatsApp.
- Enviar un recordatorio de la fecha de entrega.
- Notificar cambios de estado.

Los mensajes usan plantillas personalizables que configuras en Ajustes.

## Generar PDF

Podes generar un PDF del pedido o presupuesto para descargar o enviar al cliente.

## Limites del plan

- **Plan Emprendedor (gratis)**: hasta 30 pedidos por mes.
- **Plan Profesional**: pedidos ilimitados.
