# Conecta Turismo

Esta prueba técnica ha sido concebida lo más parecido a un ejemplo real, con la idea de valorar tanto el desarrollo de la lógica de negocio, como la calidad del código y las buenas prácticas.

### Requisitos a valorar
- Desarrollo de la lógica de negocio correcta
- Se cumplen las directrices otorgadas
- Código limpio, fácil de entender, y reutilizable

### Puntos opcionales a valorar
- Generar un tipado correcto
- Test unitarios

----------------------
# Prueba técnica

## Descripccion
Como desarrollador se te ha encargado integrar un nuevo proveedor en nuestro motor de búsquedas turístico, el cual se encarga de recibir las búsquedas de los usuarios, y devolverle todos los resultados para dicho viaje con sus diferentes opciones.

En este caso se trata de un proveedor ya conocido que está ampliando su oferta de productos turísticos, dentro de los cuales acaba de añadir la reserva de trenes a través de Renfe.

Tu trabajo será desarrollar un backend en Node con Typescript, que recibiendo unos parámetros de entrada, debe comunicarse con el proveedor para traer los resultados, organizarlos, tratarlos y limpiarlos, para así devolver estos resultados al supuesto cliente que está realizando la llamada a nuestra API.

### Proveedor: **SERVIVUELO**
### EndPoint: http://localhost/servivuelo/
### Documentación: servivuelo.pdf
### Engine: **Trenes**
### Servicio: **Busquedas**
----------------------

## Arquitectura
El proyecto ya tiene todo lo necesario para levantar un backend en typescript, un entorno de recarga en caliente para el desarrollo, un linter, un formateador de código, una base de datos, y un microservicio de mocks para simular el proveedor de Servivuelo.

Respecto al backend tiene que ser realizado en Typescript, y tiene ya preinstalado el framework de express.js, pero siéntete libre de usar cualquier otro, o node nativo si es más confortable para ti.

### Levantar el proyecto
- Instalar librerías
- `npm run docker:on` Levanta la base de datos y el proveedor (necesitas Docker)
- `npm run docker:off` Apaga y destruye todos los contenedores (necesitas Docker)
- `npm start` Arranca el backend con recarga en caliente
- `npm run lint` Ejecuta el linter para mostrar errores
- `npm run test` En este comando debes implementar los test unitarios (Opcional)

### Directorio de archivos
- `examples`: Aquí se encuentran las 2 peticiones de ejemplo que recibirá tu backend
- `mocks`: Lógica de negocio del proveedor (No tocar)
- `src`: Carpeta del proyecto donde realizar la prueba
- `src/types`: Carpeta con el tipado de los parámetros de entrada o el objeto que guardamos en la DB
----------------------

## Directrices de Negocio
### Pasos a seguir
- Sacar todas las estaciones de tren por cada destino `trainEngine.journey_destination_tree`
- Cambiar nuestros códigos de estaciones por los códigos de estaciones del proveedor `trainEngine.supplier_station_correlation`
- Pedir al proveedor los trenes disponibles (horarios), las acomodaciones disponibles (turista, primera clase, ...) y los precios de cada una (ver documentación servivuelo.pdf). Hay que tener en cuenta los bonus, porque cambia el precio.
- Sacar todas las combinaciones posibles de entre los resultados, por ejemplo, en un viaje Madrid - Barcelona, tenemos varias estaciones como Atocha y Chamartin, habrá varios horarios, y varios tipos de acomodación, una combinación sería: Madrid/Atocha/11:00/Turista - Barcelona/Sans/14:00/Premium
- Guardar en la base de datos los resultados según nuestra estructura interna, la cual esta tipada como CTSearch en el directorio de types, ahí mismo encontraras cada parámetro explicado.

### Ejemplo
Para un viaje Madrid - Baercelona, el resultados seria:
Combinacion1 = Madrid/Atocha/11:00 - Barcelona/Sans/14:00, opciones: [Butaca Premium -> precio 112€, Estandar -> precio 89€]
Combinacion2 = ....

### Parámetros de entrada
- `journeys`: este parámetro tiene un listado de todos los viajes pedidos por el usuario, por ejemplo: si un usuario quiere ir de Madrid a Barcelona unos dias y volver, vendra un array con 2 elementos, el primero de ida, y el segundo de vuelta
- `passenger`: Aquí están reflejados la cantidad y tipo de pasajeros
- `bonus`: Es un array de strings con bonus o descuentos especiales, ejemplo: `['retired']`.

Los journey tienen una estación de salida y una de llegada para poder pedir al proveedor, además de una fecha, pero `OJO CUIDADO`, porque no siempre la salida y la llegada son estaciones de tren, a veces, son ciudades, y esto no lo entiende el proveedor.

### Base de datos (MongoDB)
- Endpoint: `mongodb://localhost:27017`
- `trainEngine`: Base de datos con toda la información necesaria para realizar los mappeos de los puertos, tanto por ciudades como códigos del proveedor
- `trainEngine.journey_destination_tree`: Aquí están los mappeos de ciudades y puertos, destinationCode y arrivalCode, es lo que necesitamos para el siguiente paso, y en destinationTree y arrivalTree están las ciudades a las que pertenecen, tendrás que ejecutar una consulta a mongo que busque por ciudades o estaciones, para sacar los destinationCode y arrivalCode de cada estación. EJ: si busco ATCH (atocha) como ida, me devolverá ATCH, pero si busco MAD (Madrid) me tiene que devolver ATCH y CHAM, las 2 estaciones de tren en Madrid.
- `trainEngine.supplier_station_correlation`: Aquí está la correlación de nuestros códigos de estación con los del proveedor, tendrás que buscar por nuestro código `code`, y de entre resultados, filtrar el proveedor SERVIVUELO. Ten en cuenta que los proveedores se escriben así PROVEEDOR#CodigoDelProveedor ej: SERVIVUELO#MAD1
- `searches.train_results`: Base de datos y colección donde guardar los resultados



