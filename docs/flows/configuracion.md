# Configuracion

Desde la seccion de Configuraciones podes personalizar DulceGestion para que se adapte a tu negocio. Las configuraciones estan organizadas en pestanas.

## Pestana General

### Plan y suscripcion

En la parte superior ves la informacion de tu plan actual:

- **Plan Emprendedor (gratis)**: incluye hasta 20 recetas, 50 ingredientes, 10 productos, 30 pedidos por mes y 1 usuario. Tiene las funciones basicas de gestion.
- **Plan Profesional**: todo ilimitado, mas las funciones avanzadas: dashboard financiero, reportes, catalogo publico, proveedores, produccion, venta rapida (POS), codigos de descuento, portal del cliente y soporte prioritario.

#### Prueba gratuita

Si estas en el plan Emprendedor, podes activar una **prueba gratuita de 14 dias** del plan Profesional. Solo el administrador de la organizacion puede activarla y se usa una sola vez.

#### Suscripcion

Para suscribirte al plan Profesional, podes elegir el periodo de facturacion:

- **Mensual**: precio completo.
- **Trimestral**: 5% de descuento.
- **Semestral**: 10% de descuento.
- **Anual**: 20% de descuento.

El pago se procesa a traves de MercadoPago. Podes cancelar tu suscripcion en cualquier momento.

### Nombre del negocio

Podes cambiar el nombre de tu organizacion/negocio.

### Modo oscuro

Activa o desactiva el modo oscuro de la interfaz.

### Redondeo de precios

Configura como se redondean los precios calculados automaticamente. Las opciones son:

- Sin redondeo ($1)
- A $10
- A $50
- A $100
- A $500
- A $1.000
- A $10.000

Por ejemplo, si elegis redondeo a $100 y el precio calculado es $4.350, se redondea a $4.400.

### Alertas de stock

- **Activar alertas de stock**: si esta activado, te muestra avisos cuando los ingredientes bajan del umbral.
- **Umbral minimo general**: la cantidad minima antes de que se considere "stock bajo". Cada ingrediente puede tener su propio umbral que sobreescribe este.

### Alertas de margen

- **Activar alertas de margen**: te avisa cuando una receta con precio fijo pierde margen porque subieron los ingredientes.
- **Umbral de margen**: el porcentaje minimo de margen antes de que se dispare la alerta (por defecto 20%).

### Tarifas de trabajadores

Aca configuras las tarifas por hora de las personas que trabajan en tu negocio:

1. Toca **Agregar Tarifa**.
2. Completa el nombre (por ejemplo, "Pastelera senior") y la tarifa por hora.
3. Estas tarifas se usan para calcular automaticamente el costo de mano de obra en las recetas.

Podes tener varias tarifas (por ejemplo, una para la pastelera principal y otra para un ayudante).

## Pestana Catalogo

### Catalogo publico (Plan Profesional)

- **Habilitar catalogo**: activa o desactiva tu catalogo publico.
- **Slug (URL)**: la direccion personalizada de tu catalogo.
- **Titulo del catalogo**: el nombre que aparece en la pagina.
- **Introduccion**: texto de bienvenida con formato enriquecido.
- **Logo**: subi el logo de tu marca.
- **Color primario y color de acento**: personaliza los colores de tu catalogo.
- **Formato de visualizacion**: elegis entre grilla, carta o magazine.

### Pedidos por catalogo

- **Habilitar pedidos**: permite que los clientes hagan pedidos desde el catalogo.
- **Dias minimos de anticipacion**: cuantos dias antes tiene que pedir el cliente (por defecto 1).

### Portal del cliente (Plan Profesional)

- **Habilitar portal del cliente**: activa la posibilidad de generar links magicos para que los clientes vean sus pedidos y cuenta corriente.

### Alertas de eventos

- **Dias de anticipacion para eventos**: con cuantos dias de antelacion te avisa de cumpleanos y eventos de clientes (por defecto 7 dias).

## Pestana Notificaciones

### Plantillas de WhatsApp

Personaliza los mensajes que se envian por WhatsApp a tus clientes:

- **Plantilla de pedido**: el mensaje que se envia cuando compartis un pedido con el cliente. Podes usar variables como el nombre del cliente, detalle del pedido, total, etc.
- **Plantilla de recordatorio**: el mensaje que se envia como recordatorio de entrega.

### Notificaciones push

- **Recordatorios de pedidos proximos**: DulceGestion puede enviarte notificaciones push (en el navegador o en la app instalada como PWA) para avisarte de entregas proximas.
- **Horas de anticipacion**: configura con cuantas horas de anticipacion te avisa (por defecto 24 horas y 3 horas antes de la entrega).

## Pestana Equipo (solo administradores)

### Gestionar equipo

Si tenes el plan Profesional, podes invitar a otras personas a tu organizacion:

1. En la pestana **Equipo**, ingresa el email de la persona que queres invitar.
2. Selecciona el rol: **usuario** o **admin**.
3. Toca **Invitar**.
4. La persona recibe un email con un link para unirse a tu organizacion.

Los miembros del equipo pueden:
- Acceder a todas las funciones de la app.
- Los administradores pueden gestionar configuraciones e invitar mas miembros.

### Invitaciones pendientes

Podes ver las invitaciones que enviaste y todavia no fueron aceptadas. Tambien podes cancelar invitaciones pendientes.

### Usuarios activos

Ves la lista de todos los miembros de tu organizacion con su email, nombre y rol.

## Limites del plan

- **Plan Emprendedor**: 1 usuario por organizacion.
- **Plan Profesional**: usuarios ilimitados.
