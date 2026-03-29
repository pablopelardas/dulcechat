# Catalogo Publico

El catalogo publico es una pagina web donde tus clientes pueden ver tus productos y hacer pedidos directamente. Es como tu propia tienda online, personalizada con tu marca.

Esta funcion esta disponible en el **Plan Profesional**.

## Configurar el catalogo

1. Anda a **Configuraciones > Catalogo**.
2. Activa la opcion **Catalogo habilitado**.
3. Configura tu **slug** (la URL personalizada). Por ejemplo, si tu slug es "dulcesmaria", tu catalogo se ve en `dulcegestion.ar/catalogo/dulcesmaria`. El slug debe ser unico, solo puede tener letras minusculas, numeros y guiones.

## Personalizar la apariencia

Podes personalizar como se ve tu catalogo:

- **Titulo**: el nombre que aparece en la parte superior del catalogo (por defecto, el nombre de tu negocio).
- **Introduccion**: un texto de bienvenida que se muestra arriba de los productos. Podes usar formato enriquecido (negritas, listas, etc.).
- **Logo**: subi el logo de tu negocio para que aparezca en el catalogo.
- **Color primario**: el color principal de tu catalogo (botones, encabezados).
- **Color de acento**: un color secundario para detalles visuales.

## Formatos de catalogo (layouts)

Tenes tres opciones de presentacion:

- **Grilla (grid)**: los productos se muestran en tarjetas tipo cuadricula. Ideal para catalogos con fotos.
- **Carta**: formato tipo menu de restaurante, con productos listados por categoria. Ideal para carta de precios.
- **Magazine**: un formato visual mas vistoso, con imagenes grandes.

Podes cambiar el formato en cualquier momento desde Configuraciones.

## Que productos aparecen en el catalogo

Solo aparecen los productos que tengan marcada la opcion **Es publico** en su ficha de producto. Los productos privados no se muestran.

**Importante**: las recetas no aparecen directamente en el catalogo. Primero tenes que crear un Producto (en la seccion **Productos**), vincularle las recetas que lo componen, y marcarlo como publico. Para el paso a paso de como crear productos, consulta [productos.md](productos.md).

Cada producto del catalogo muestra:
- Nombre y descripcion.
- Imagen (si tiene).
- Categoria.
- Precio (calculado automaticamente o manual). Si el producto tiene la opcion "Ocultar precio", se muestra sin precio (util para pedidos a consultar).

## Pedidos desde el catalogo

Si queres que tus clientes puedan hacer pedidos directamente desde el catalogo:

1. Activa la opcion **Pedidos habilitados** en Configuraciones > Catalogo.
2. Configura los **dias minimos de anticipacion**: cuantos dias antes necesitas que te hagan el pedido (por defecto 1 dia). Tambien cada producto o categoria puede tener su propio tiempo de anticipacion.

### Como pide el cliente

1. El cliente entra a tu catalogo publico.
2. Agrega productos al carrito.
3. Completa sus datos: nombre, telefono.
4. Elige la fecha de entrega (respetando los dias minimos).
5. Opcionalmente aplica un codigo de descuento.
6. Agrega notas si necesita algo especial.
7. Confirma el pedido.

### Que pasa cuando llega un pedido

- Recibis una **notificacion por email** con el detalle del pedido.
- El pedido aparece en tu lista de pedidos con origen **Catalogo** y estado **Pendiente**.
- El pedido llega sin cliente asignado (porque el cliente del catalogo puede ser alguien nuevo).

### Aceptar un pedido del catalogo

1. Abri el pedido del catalogo.
2. Toca **Aceptar**.
3. Asigna un cliente:
   - Selecciona un cliente existente si ya lo tenes en tu base.
   - O crea un cliente nuevo con el nombre y telefono que el cliente ingreso.
4. El pedido pasa a funcionar como un pedido normal (podes cambiar estado, registrar pagos, etc.).

### Rechazar un pedido del catalogo

Si no podes cumplir con el pedido:

1. Abri el pedido del catalogo.
2. Toca **Rechazar**.
3. El pedido se marca como **Cancelado**.

## Codigos de descuento (Plan Profesional)

Podes crear codigos de descuento que tus clientes aplican en el catalogo:

- Descuento por porcentaje o monto fijo.
- Con fecha de vigencia.
- Con limite de usos.
- Funcionan tanto en el catalogo publico como en pedidos manuales.

## Compartir tu catalogo

Comparte el link de tu catalogo en tus redes sociales, bio de Instagram, grupos de WhatsApp, etc. La URL es tu slug personalizado bajo el dominio de DulceGestion.
