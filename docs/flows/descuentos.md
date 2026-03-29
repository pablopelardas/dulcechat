# Codigos de Descuento

Los codigos de descuento permiten ofrecer rebajas a tus clientes al momento de crear un pedido.

## Crear un codigo de descuento

Para crear un codigo de descuento anda a **Descuentos** en el menu lateral. Toca **Nuevo codigo** y completa:

- **Codigo**: el texto que el cliente va a usar (ej: PROMO10, VERANO2026). Se guarda en mayusculas.
- **Tipo**: puede ser **porcentaje** (ej: 10% de descuento) o **monto fijo** (ej: $500 de descuento).
- **Valor**: el numero del descuento. Si es porcentaje, un valor entre 1 y 100. Si es fijo, el monto en pesos.
- **Pedido minimo** (opcional): monto minimo que debe tener el pedido para poder usar el codigo.
- **Maximo de usos** (opcional): cuantas veces se puede usar el codigo. Si no se pone limite, es ilimitado.
- **Fecha de vencimiento** (opcional): despues de esta fecha el codigo deja de funcionar.

## Aplicar un descuento a un pedido

Al crear un pedido, hay un campo **Codigo de descuento**. Ingresa el codigo y el sistema valida automaticamente:

- Que el codigo exista y este activo
- Que no haya vencido
- Que no haya superado el limite de usos
- Que el pedido cumpla el monto minimo

Si el codigo es valido, el descuento se aplica automaticamente al total del pedido.

## Administrar codigos

Desde la seccion **Descuentos** podes:

- **Editar** un codigo: cambiar el valor, tipo, limites o vencimiento.
- **Desactivar** un codigo: lo deja inactivo sin borrarlo. Se puede reactivar despues.
- **Eliminar** un codigo: lo borra permanentemente.
- **Ver usos**: cada codigo muestra cuantas veces fue utilizado.

## Tipos de descuento

- **Porcentaje**: descuenta un % del subtotal del pedido. Ejemplo: PROMO10 con valor 10 descuenta el 10%.
- **Monto fijo**: descuenta un monto fijo en pesos. Ejemplo: DESCUENTO500 con valor 500 descuenta $500.
