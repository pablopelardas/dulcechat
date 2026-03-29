# Productos

Los productos son lo que tus clientes ven y compran. Una receta es tu "formula" interna (ingredientes, costos, procedimiento), pero un producto es lo que publicasen tu catalogo. Pensa en la receta como la receta de cocina y el producto como el articulo terminado que vendes.

Un producto puede contener una o varias recetas. Por ejemplo:

- Un producto "Torta de Chocolate x12 porciones" puede tener una sola receta (la torta de chocolate).
- Un producto "Caja Regalo Navidad" puede tener 3 recetas adentro: alfajores, budines y galletitas.
- Un producto "Combo Cumple" puede tener la torta + las cookies + los cupcakes.

Las recetas nunca se publican directamente en el catalogo. Siempre necesitas crear un producto que las contenga.

## El flujo completo

1. Primero creas tus **recetas** con ingredientes, costos y rendimientos (ver [recetas.md](recetas.md)).
2. Despues creas un **producto** y le agregas una o varias recetas.
3. Marcas el producto como **publico** si queres que aparezca en tu catalogo.
4. Tus clientes ven el producto en el catalogo y pueden pedirlo.

## Crear un producto

1. Anda a **Productos** en el menu principal.
2. Toca el boton **Nuevo Producto**.
3. Completa los campos del formulario:

### Nombre y categoria

- **Nombre del Producto** (obligatorio): como se va a llamar el producto. Por ejemplo "Torta de Chocolate x12 porciones", "Box de Alfajores x6", "Combo Cumple Infantil".
- **Categoria**: podes elegir una categoria existente o crear una nueva. Las categorias organizan tus productos y tambien se usan para agrupar en el catalogo publico.

### Descripcion

Escribi una descripcion del producto para el catalogo. Tiene editor de texto enriquecido (negritas, listas, etc.), asi que podes detallar bien lo que incluye. Esta descripcion la van a ver tus clientes si publicasen el producto en el catalogo.

### Imagenes

Podes subir hasta 10 imagenes por producto. Cuando subis una imagen se abre un recortador para que quede con las proporciones adecuadas segun el formato de tu catalogo (grilla, carta o magazine).

- Podes reordenar las imagenes arrastrando. La primera imagen es la principal.
- Podes eliminar imagenes que ya no quieras.

### Composicion (recetas)

Aca es donde vinculas las recetas al producto:

1. Toca **Agregar receta**.
2. Busca la receta por nombre en el selector (tiene buscador).
3. Indica la **cantidad** que lleva el producto de esa receta (en la unidad de rendimiento de la receta). Por ejemplo, si la receta rinde "12 porciones" y tu producto es una torta entera, pones 12.
4. Podes agregar varias recetas si el producto es un combo o caja.
5. El sistema te muestra el costo proporcional de cada receta segun la cantidad que indicaste.

El costo del producto se calcula automaticamente sumando el costo proporcional de todas las recetas vinculadas.

### Insumos adicionales

Si el producto lleva insumos que no estan en ninguna receta (por ejemplo, la caja de regalo, la cinta, el sticker), podes agregarlos directamente al producto. Su costo se suma al costo total.

### Precios

El panel de precios te muestra:

- **Costo calculado**: la suma del costo de todas las recetas + insumos del producto.
- **Margen (%)**: el porcentaje de ganancia que queres sobre el costo. Por defecto es 30%.
- **Precio manual**: si queres poner un precio fijo en vez de calcularlo con el margen, ponelo aca. Si lo dejas vacio, el precio se calcula automaticamente.
- **Ganancia**: cuanto ganas por producto (precio - costo) y el margen real en porcentaje.
- **Precio de venta**: el precio final, redondeado segun la configuracion de redondeo de tu organizacion.

Tambien podes activar **Ocultar precio en catalogo** si queres que en vez del precio se muestre "Consultar". Util para productos que cotizan segun el pedido.

### Rastrear stock de produccion

Si activas la opcion **Rastrear stock de produccion**, el sistema lleva la cuenta de cuantas unidades de este producto tenes listas. Cuando "producis" el producto (desde la seccion de Produccion), se incrementa el stock del producto y se descuenta el stock de las recetas que lo componen. Cuando se vende, se descuenta el stock del producto.

Esta funcion es parte del plan Profesional.

### Publicar en el catalogo ("Es publico")

El checkbox **Publicar en catalogo publico** controla si el producto se muestra en tu catalogo compartido con clientes:

- **Activado**: el producto aparece en el catalogo publico y tus clientes pueden verlo y pedirlo.
- **Desactivado**: el producto existe en tu sistema (para pedidos manuales, costeo, etc.) pero no se ve en el catalogo.

Podes cambiar esto en cualquier momento, incluso desde la lista de productos con un toggle rapido sin tener que abrir el formulario.

### Dias de anticipacion

Cuando el producto esta marcado como publico, podes configurar los **dias de anticipacion**: cuantos dias antes necesitas que te hagan el pedido para este producto en particular. Si lo dejas vacio, se usa el valor de la categoria o el general de tu organizacion.

## Editar un producto

1. En la lista de productos, busca el producto que queres editar.
2. Toca el boton de editar.
3. Modifica lo que necesites: nombre, recetas, precios, imagenes, etc.
4. Guarda los cambios.

Los costos y precios se recalculan automaticamente si cambiaste las recetas o cantidades.

## Duplicar un producto

Si queres crear un producto parecido a uno que ya tenes:

1. En la lista de productos, busca el producto original.
2. Toca el boton de **duplicar**.
3. Se crea una copia con el nombre "Nombre (Copia)" y con **Es publico desactivado** (para que no se publique accidentalmente).
4. Edita la copia para ajustar lo que necesites.

Se copian las recetas vinculadas, imagenes, insumos, precios y todas las configuraciones.

## Eliminar un producto

Para eliminar un producto, toca el boton de eliminar en la lista de productos. Si el producto esta referenciado en pedidos existentes, puede que no se pueda eliminar directamente.

## Filtrar y buscar productos

La lista de productos tiene:

- **Buscador** por nombre.
- **Filtro por categoria**.
- **Filtro por estado de catalogo** (publicos, privados, todos).
- **Ordenamiento** (por nombre A-Z, Z-A, etc.).
- **Vista en tabla o tarjetas**.

## Limites del plan

- **Plan Emprendedor (gratis)**: hasta 10 productos.
- **Plan Profesional**: productos ilimitados.
