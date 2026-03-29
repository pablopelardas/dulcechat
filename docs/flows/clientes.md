# Clientes

En DulceGestion podes gestionar tu cartera de clientes con toda su informacion, historial de pedidos, cuenta corriente y mas.

## Agregar un cliente

1. Anda a **Clientes** en el menu principal.
2. Toca **Nuevo Cliente**.
3. Completa los datos:
   - **Nombre** (obligatorio).
   - **Telefono**: se usa para enviarle mensajes por WhatsApp.
   - **Direccion**: para las entregas.
   - **Notas**: cualquier dato adicional que quieras recordar.

## Importar clientes desde CSV

Si tenes una lista de clientes en planilla:

1. Toca **Importar CSV** en la lista de clientes.
2. Subi un archivo CSV con columnas: nombre, telefono, direccion, notas.
3. Se pueden importar hasta 500 clientes por vez.

## Ver detalle de un cliente

Al tocar un cliente en la lista, se abre su perfil completo con:

- **Datos de contacto**: nombre, telefono (con boton para WhatsApp), direccion.
- **Estadisticas**: total gastado, cantidad de pedidos, fecha del ultimo pedido, saldo pendiente.
- **Historial de pedidos**: todos sus pedidos ordenados del mas reciente al mas antiguo.
- **Cuenta corriente**: detalle de deuda y pagos.
- **Precios personalizados**: precios especiales para este cliente.
- **Portal del cliente**: acceso al portal con link magico.
- **Eventos**: cumpleanos, aniversarios y fechas importantes.

## Cuenta corriente (fiado)

DulceGestion lleva la cuenta corriente de cada cliente automaticamente:

- Cada pedido no cancelado suma a la deuda del cliente.
- Cada pago (ya sea al pedido o a cuenta) resta de la deuda.
- El **saldo** te muestra cuanto te debe el cliente en este momento.

### Pagos a cuenta (distribucion FIFO)

Cuando un cliente te hace un pago "a cuenta" (sin referencia a un pedido especifico):

1. En el perfil del cliente, anda a la seccion **Cuenta Corriente**.
2. Toca **Registrar Pago a Cuenta**.
3. Indica el monto, metodo de pago y notas opcionales.
4. El sistema distribuye el pago automaticamente entre los pedidos impagos, empezando por el mas antiguo (metodo FIFO - primero en entrar, primero en salir).
5. Si el pago es mayor que toda la deuda, el sobrante queda como saldo a favor.

### Historial de cuenta

La cuenta corriente muestra una linea de tiempo unificada con:

- **Cargos**: cada pedido nuevo que suma deuda.
- **Pagos a pedidos**: pagos aplicados directamente a un pedido.
- **Pagos a cuenta**: pagos distribuidos automaticamente.
- **Saldo acumulado**: ves como evoluciona la deuda en el tiempo.

### Deudores en el dashboard

En el dashboard principal aparece:

- El total **Por Cobrar** (suma de deuda de todos los clientes).
- Una alerta con los principales deudores.

## Favoritos del cliente

El sistema trackea automaticamente que es lo que mas pide cada cliente. En el perfil del cliente podes ver sus items favoritos (los que mas veces pidio), ordenados por cantidad. Esto te ayuda a sugerir productos cuando creas un nuevo pedido.

## Eventos del cliente

Podes registrar fechas importantes de cada cliente (cumpleanos, aniversarios, fiestas):

1. En el perfil del cliente, anda a **Eventos**.
2. Toca **Agregar Evento**.
3. Completa:
   - **Nombre del evento**: por ejemplo "Cumpleanos de Maria", "Aniversario de casamiento".
   - **Fecha**: cuando es.
   - **Recurrente**: si se repite cada ano (como un cumpleanos) o es por unica vez.
   - **Notas**: detalles adicionales.

Los eventos proximos aparecen en el **Dashboard** como alertas, asi podes contactar al cliente con anticipacion para ofrecerle algo especial. Podes configurar con cuantos dias de anticipacion te avisa (por defecto 7 dias) en Configuraciones.

## Portal del cliente (Plan Profesional)

El portal del cliente es una pagina exclusiva donde cada cliente puede ver sus pedidos y cuenta sin necesidad de preguntarte por WhatsApp.

### Como funciona

1. En el perfil del cliente, anda a **Portal del Cliente**.
2. Toca **Generar Link de Acceso**. Se crea un link magico unico para ese cliente.
3. Envia el link al cliente por WhatsApp.
4. El cliente abre el link y puede ver:
   - **Mis Pedidos**: todos sus pedidos con estado actualizado en tiempo real.
   - **Mi Cuenta**: su saldo pendiente y el historial de pagos.

No necesita crear una cuenta ni recordar contraseñas. El acceso es por link magico.

### Revocar acceso

Si necesitas desactivar el portal de un cliente, podes revocar el link desde su perfil. El link anterior deja de funcionar.

### Configuracion del portal

En **Configuraciones > Catalogo**, podes activar o desactivar el portal de clientes para toda tu organizacion.

## Precios personalizados por cliente

Podes asignar precios especiales a un cliente para ciertos productos o recetas. Cuando crees un pedido para ese cliente, los precios personalizados se aplican automaticamente.

## Comunicacion por WhatsApp

Desde el perfil de un cliente podes:

- Abrir una conversacion de WhatsApp directamente (tocando el telefono).
- Enviar detalles de pedidos, recordatorios y cambios de estado.

## Editar y eliminar clientes

- Para editar un cliente, abri su perfil y modifica los datos.
- Para eliminar un cliente, toca el boton de eliminar en la lista. Se borran tambien sus pedidos asociados.
