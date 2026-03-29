# Recetas

Las recetas son el corazon de DulceGestion. Aca vas a cargar todo lo que producis: tortas, galletas, panes, viandas, lo que sea. El sistema calcula automaticamente el costo de cada receta segun los ingredientes, sub-recetas, insumos y mano de obra que le cargues.

## Crear una receta

1. Anda a **Recetas** en el menu principal.
2. Toca el boton **Nueva Receta**.
3. Completa los campos del formulario:
   - **Nombre** (obligatorio): el nombre de la receta, por ejemplo "Torta de Chocolate".
   - **Imagen principal**: podes subir una foto de tu receta. Se abre un recortador para que quede prolija.
   - **Descripcion corta**: un texto breve para identificar la receta.
   - **Categoria**: podes elegir una categoria existente o crear una nueva en el momento. Las categorias te ayudan a organizar tus recetas y tambien se usan en el catalogo publico.
   - **Rendimiento**: cuanto produce esta receta. Por ejemplo, "1 torta", "12 porciones", "500 gramos". Esto es importante para que el sistema calcule correctamente los costos cuando uses esta receta como sub-receta de otra.
   - **Tiempo de preparacion**: en minutos. Te sirve para planificar tu produccion.

## Ingredientes de la receta

En la seccion de ingredientes, agrega cada ingrediente que necesitas y la cantidad exacta para una tanda completa (el rendimiento que pusiste arriba).

- Busca el ingrediente por nombre en el selector.
- Indica la cantidad que usas (en la unidad del ingrediente).
- Podes reordenar los ingredientes arrastrando.
- El sistema calcula automaticamente el costo de cada ingrediente segun el precio que tengas cargado.

## Sub-recetas (componentes)

Si tu receta lleva dentro otra receta (por ejemplo, una torta que lleva un buttercream que ya tenias cargado como receta aparte), podes agregarlo como componente:

1. En la seccion **Componentes**, busca la receta que queres incluir.
2. Indica cuantas unidades de esa sub-receta necesitas (en la unidad de rendimiento de la sub-receta).
3. El costo se calcula recursivamente: si la sub-receta tiene sus propios ingredientes y sub-recetas, todo se suma automaticamente.

Esto te permite armar recetas complejas sin repetir ingredientes manualmente. Por ejemplo: Torta de boda = 1 bizcochuelo + 1 buttercream + 1 ganache.

## Insumos

Ademas de ingredientes (materias primas), podes agregar insumos (packaging, decoraciones, etc.) que tambien tienen costo y se suman al precio final.

## Costo de mano de obra

DulceGestion calcula el costo de mano de obra a partir de las tarifas de trabajadores que configures en Ajustes:

1. Selecciona la **tarifa de trabajador** que corresponda (podes tener varias, por ejemplo "Pastelera senior" y "Ayudante").
2. Indica el **tiempo de preparacion** de la receta en minutos.
3. El sistema calcula automaticamente: (tarifa por hora / 60) x minutos = costo de mano de obra.

Tambien podes poner un monto fijo de mano de obra si preferis.

## Margen de ganancia y precio sugerido

- Indica el **porcentaje de margen** que queres ganar sobre el costo total.
- El sistema calcula en tiempo real el **precio sugerido** = costo total x (1 + margen%).
- El costo total incluye: ingredientes + sub-recetas + insumos + mano de obra.
- El precio se redondea segun la configuracion de redondeo que tengas en Ajustes (puede ser al peso, a $10, $50, $100, etc.).

## Costeo automatico (auto-costing)

El panel de resumen de costos te muestra en tiempo real:

- **Costo de ingredientes**: suma de (cantidad x precio unitario) de cada ingrediente.
- **Costo de componentes**: costo calculado recursivamente de cada sub-receta.
- **Costo de insumos**: suma del costo de insumos.
- **Costo de mano de obra**: calculado segun tarifa y tiempo.
- **Costo total**: la suma de todo lo anterior.
- **Costo por unidad**: costo total / rendimiento.
- **Precio sugerido**: costo por unidad x (1 + margen%).

Si mas adelante sube el precio de un ingrediente, el costo de todas las recetas que lo usan se actualiza automaticamente.

## Instrucciones de preparacion

Podes escribir las instrucciones paso a paso en un editor de texto enriquecido (con negritas, listas, etc.). Esto es para tu referencia interna y la de tu equipo.

## Seguimiento de stock de recetas

Si activas la opcion **Rastrear stock**, el sistema lleva la cuenta de cuantas unidades de esta receta tenes producidas. Cada vez que "cocinas" una receta, se incrementa el stock. Cada vez que se vende (por pedido o venta rapida), se descuenta. Esta funcion es parte del plan Profesional.

## Editar una receta

1. En la lista de recetas, toca la receta que queres editar.
2. Modifica los campos que necesites.
3. Guarda los cambios.

Todos los costos se recalculan automaticamente.

## Duplicar una receta

Si queres crear una receta parecida a una que ya tenes:

1. En la lista de recetas, busca la receta original.
2. Toca el boton de **duplicar** (icono de copiar).
3. Se crea una copia exacta con el nombre "Nombre (Copia)".
4. Edita la copia para hacer los ajustes que necesites.

Se copian todos los ingredientes, componentes, insumos, margenes y configuraciones.

## Eliminar una receta

Solo podes eliminar una receta si no esta siendo usada en:
- Pedidos existentes.
- Productos (combos/bundles).
- Otras recetas como sub-receta.

Si la receta esta en uso, el sistema te va a indicar donde esta referenciada para que decidas que hacer.

## Alertas de margen

Si le pusiste un precio fijo (manual) a un producto que usa esta receta, y el costo de los ingredientes sube, el sistema te avisa que el margen real bajo. Esto aparece en el dashboard como "recetas en riesgo". Las recetas con margen porcentual no tienen este problema porque el precio sugerido sube automaticamente con el costo.

## Recetas y el catalogo

Una duda comun: "cargue mi receta, pero no aparece en el catalogo". Esto es porque las recetas no se publican directamente en el catalogo. Las recetas son tu herramienta interna de costeo y produccion.

Para que algo aparezca en el catalogo, necesitas crear un **Producto** que contenga esa receta (o varias). El producto es lo que ven tus clientes: tiene su propio nombre, descripcion, imagenes, precio y la opcion "Es publico" que lo hace visible en el catalogo.

El flujo es:

1. Creas la receta (aca en Recetas).
2. Creas un producto en **Productos** y le vinculas la receta.
3. Marcas el producto como publico.
4. Listo, aparece en tu catalogo.

Para mas detalles sobre como crear y configurar productos, consulta [productos.md](productos.md).

## Limites del plan

- **Plan Emprendedor (gratis)**: hasta 20 recetas.
- **Plan Profesional**: recetas ilimitadas.
