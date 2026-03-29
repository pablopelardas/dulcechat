# Venta Rapida (POS)

La Venta Rapida es el punto de venta (POS) de DulceGestion. Te permite registrar ventas al mostrador de forma agil, sin necesidad de crear un pedido formal. Es ideal para ferias, locales o cuando vendes productos ya listos.

Esta funcion esta disponible en el **Plan Profesional**.

## Como funciona

1. Anda a **Venta Rapida** en el menu principal.
2. Vas a ver una grilla con todos tus productos y recetas disponibles para la venta.
3. Toca un producto para agregarlo al carrito. Si el producto tiene rastreo de stock, ves cuantas unidades tenes disponibles.
4. Ajusta las cantidades con los botones + y -.
5. Si queres, asigna un cliente a la venta (podes elegir uno existente, crear uno nuevo, o dejar la venta sin cliente).
6. Agrega notas si es necesario.
7. Podes aplicar un **codigo de descuento** si tenes alguno configurado.

## Busqueda de productos

En la parte superior de la pantalla tenes un buscador para encontrar rapidamente el producto que necesitas. Busca por nombre.

## Metodos de pago

Al momento de confirmar la venta, elegis el metodo de pago:

- **Efectivo**
- **Transferencia**
- **MercadoPago**
- **Tarjeta** (debito o credito)

## Confirmar la venta

1. Revisa el carrito con todos los items, cantidades y el total.
2. Selecciona el metodo de pago.
3. Toca **Confirmar Venta**.
4. Se crea automaticamente un pedido con:
   - Estado: **Entregado** (porque ya se entrego en el momento).
   - Origen: **POS** (para diferenciarlo de pedidos manuales o del catalogo).
   - El pago queda registrado automaticamente.
   - El numero de pedido se genera con el formato habitual (AAMM-XXX).

## Descuento automatico de stock

Cuando confirmas una venta rapida, el stock de las recetas y productos vendidos se descuenta automaticamente (si tienen rastreo de stock activado). Esto se registra en el historial de produccion como "Venta POS".

## Ticket de venta (impresion 80mm)

Despues de confirmar la venta, se muestra una pantalla de exito con:

- Numero de pedido.
- Detalle de items, cantidades y precios.
- Total cobrado.
- Metodo de pago.

Desde ahi podes **imprimir un ticket** optimizado para impresoras termicas de 80mm (las tipicas de punto de venta). Se abre una ventana de impresion lista para imprimir.

El ticket incluye:
- Nombre del negocio.
- Fecha y hora.
- Numero de venta.
- Detalle de cada item con cantidad y precio.
- Descuento (si aplica).
- Total.
- Metodo de pago.
- Nombre del cliente (si se asigno uno).

## Cierre de caja

El cierre de caja te da un resumen de todas las ventas POS del dia:

1. En la pantalla de Venta Rapida, toca **Cierre de Caja**.
2. Podes seleccionar la fecha (por defecto es hoy).
3. El resumen muestra:
   - **Cantidad de ventas** del dia.
   - **Total de items vendidos**.
   - **Total recaudado**.
   - **Desglose por metodo de pago**: cuanto entro por efectivo, cuanto por transferencia, cuanto por MercadoPago y cuanto por tarjeta.
   - **Detalle de cada venta**: hora, items, total y metodo de pago.
4. Podes **imprimir el cierre de caja** en formato ticket 80mm para guardar como comprobante.

## Nueva venta

Despues de completar una venta, toca **Nueva Venta** para empezar de cero con el carrito vacio.
