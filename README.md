
# CT Backend Test Lali

Este repositorio contiene la solución completa a la prueba técnica de integración del proveedor **SERVIVUELO** en el motor de búsquedas de Conecta Turismo. Está desarrollado en Node.js + TypeScript, con arquitectura modular y algunas buenas prácticas extra:

## 📝 Notas sobre desarrollo

### Decisiones técnicas relevantes

- **Zod** se utiliza para validar y transformar los parámetros de entrada en los controladores, asegurando que los datos recibidos cumplen el formato esperado y facilitando la gestión de errores de validación.
- **class-validator** se emplea para validar las variables de entorno en el arranque de la aplicación, evitando errores de configuración y facilitando el despliegue en distintos entornos.
- **Redis** se integra como sistema de cache para acelerar las respuestas en llamadas repetidas a horarios, acomodaciones y precios, reduciendo la latencia y la carga sobre el proveedor mock.
- **Arquitectura modular (DDD)**: Cada dominio (`search`, `servivuelo`) tiene su propio controller, service, types y herramientas, lo que facilita la escalabilidad y el mantenimiento.
- **Jest + ts-jest** para los tests unitarios, permitiendo asegurar la calidad y el correcto funcionamiento de los módulos y funciones puras.

### Decisión sobre el formato de respuesta

He decidido que el valor retornado al realizar la búsqueda sea un **array** con cada una de las combinaciones posibles, utilizando el formato tipado de **CTSearch**. Considero que este enfoque se asemeja al funcionamiento de una aplicación de búsqueda de viajes, donde el usuario espera ver todas las opciones disponibles de forma clara y estructurada. Además, este formato facilita que el frontend pueda mostrar fácilmente la información de cada combinación (horario, acomodación, precio, etc.) y permite escalar o modificar la presentación de resultados sin cambios en la lógica de backend.

### Decisión sobre la ruta del endpoint

En lugar de exponer la búsqueda directamente en la raíz (`/`), decidí que el endpoint fuera `/search`. Esto es más coherente con la estructura modular del proyecto, ya que cada dominio puede tener su propio controlador y rutas agrupadas bajo un prefijo claro. Así, se facilita la escalabilidad y el mantenimiento, permitiendo añadir fácilmente nuevos módulos o dominios en el futuro sin mezclar responsabilidades en la raíz de la API.

### Mejoras futuras y limitaciones conocidas

- **Mejoras posibles**:
  - Implementar tests de integración para cubrir el flujo completo de búsqueda y persistencia.
  - Añadir documentación OpenAPI/Swagger para facilitar el consumo de la API.
  - Mejorar la gestión de errores y logging para facilitar el diagnóstico en producción.
  - Añadir soporte para otros proveedores.

- **Limitaciones actuales**:
  - El mock del proveedor Servivuelo es estático y no simula todos los posibles errores o casos reales.
  - La validación de bonus y pasajeros es básica y podría ampliarse para casos más complejos.
  - La estructura de CTSearch está pensada para el caso de uso actual y puede requerir ajustes si se amplía el dominio.

---

## 🚀 Quick Start

### Prerrequisitos

- Node.js v18+  
- Docker & Docker Compose  

### 1. Clonar y preparar

```bash
git clone git@github.com:laliiosorio/ct-backend-test-lali.git
cd ct-backend-test-lali
```
## 2. Variables de entorno

Crea un fichero `.env` en la raíz:

```dotenv
# MongoDB
MONGO_URI=mongodb://localhost:27017
TRAIN_DB=trainEngine
SEARCH_DB=searches

# Servivuelo mock
SERVIVUELO_URL=http://localhost/servivuelo

# Redis cache
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# App
PORT=3000
```

## 3. Levantar Mongo, Redis y el mock de Servivuelo

```bash
npm run docker:on
```

Esto iniciará los siguientes contenedores:

- **mongo** en el puerto `27017`
- **redis** en el puerto `6379`
- **mock.servivuelo** (servicio de mocks de Servivuelo)

---

## 4. Instalar dependencias y arrancar el backend

```bash
npm install
npm start
```

- `npm install` instala todas las dependencias del proyecto.
- `npm start` arranca el servidor en [http://localhost:3000](http://localhost:3000) (con hot‑reload).

---

## 5. Estructura de carpetas

```
src/
├── main.ts                 
├── routes/                 
│   └── index.ts            
├── shared/                 
│   ├── env.ts              
│   ├── mongo.ts            
│   ├── redis.ts            
│   └── __tests__/          
│       └── mongo.test.ts   
├── modules/                
│   ├── servivuelo/         
│   │   ├── servivuelo.service.ts
│   │   ├── servivuelo.types.ts  
│   │   └── __tests__/          
│   │       └── servivuelo.service.test.ts
│   └── search/             
│       ├── search.controller.ts
│       ├── search.schema.ts      
│       ├── search.domain.ts      
│       ├── search.service.ts     
│       ├── search.cache.ts       
│       ├── search.types.ts       
│       ├── tools/                
│       │   ├── calculateDuration.ts
│       │   ├── calculateTotalPrice.ts
│       │   ├── detectTripType.ts
│       │   └── __tests__/          
│       │       ├── calculateDuration.test.ts
│       │       ├── calculateTotalPrice.test.ts
│       │       └── detectTripType.test.ts
│       └── __tests__/              
│           ├── search.service.test.ts
│           └── search.domain.test.ts
└── types/
    └── index.ts                   
```

---

## 6. Scripts disponibles

| Comando              | Descripción                                 |
|----------------------|---------------------------------------------|
| `npm start`          | Arranca el servidor (hot‑reload)            |
| `npm run docker:on`  | Levanta Mongo, Redis y mock.servivuelo      |
| `npm run docker:off` | Detiene y elimina los contenedores Docker   |
| `npm test`           | Ejecuta Jest + cobertura (`--coverage`)     |
| `npm run lint`       | Ejecuta ESLint


## 📖 Uso

Envía un POST a `/search` con un body JSON:

```json
{
  "journeys": [
    { "from": "MAD", "to": "BCN", "date": "2022-12-24" }
  ],
  "passenger": { "adults": 2, "children": 0, "total": 2 },
  "bonus": []
}
```

La respuesta será un array de objetos **CTSearch**, cada uno guardado en MongoDB en `searches.train_results`.

---

## ✅ Tests unitarios

Con Jest + ts‑jest:

```bash
npm test
```

Verás tests para todos los módulos y funciones puras (`tools/`), wrappers de servicio, validación de env, acceso a Mongo, dominio, caché…


---

## 📦 Cache con Redis

Se cachean tres tipos de llamadas externas:

- **Timetables**: TTL 60 s, key: `timetables:from:to:date:adults:children`
- **Accommodations**: TTL 300 s, key: `accommodations:shipId:departureDate`
- **Prices**: TTL 120 s, key: `prices:shipId:departureDate:accommodation:pax[:bonus]`

Para mejorar latencia y reducir presión sobre el mock proveedor.

---

## 🏗 Arquitectura y patrones

- Modular / DDD: cada dominio (`search`, `servivuelo`) con su propio controller, service, types y herramientas.
- **Zod** para validar y transformar parámetros de entrada (fechas → DD/MM/YYYY, bonus, cantidades).
- **class-validator** para asegurar la configuración de entorno.
- Wrappers **OrFail** que envuelven a Axios y añaden contexto al lanzar errores.

## 📚 Referencias y enlaces útiles

- [Repositorio original](https://github.com/conectaturismo/ct-recruitment-back-test)
- [Documentación del proveedor: `servivuelo.pdf`](https://github.com/laliiosorio/ct-backend-test-lali/blob/main/servivuelo-doc.pdf)
- [Express.js](https://expressjs.com/)
- [Jest](https://jestjs.io/)
- [Docker](https://docs.docker.com/)
- [MongoDB](https://www.mongodb.com/docs/)
- [Redis](https://redis.io/documentation)


----------------------
# Conecta Turismo

Esta prueba técnica ha sido concebida lo más parecido a un ejemplo real, con la idea de valorar tanto el desarrollo de la lógica de negocio, como la calidad del código y las buenas prácticas.

### Requisitos a valorar
- Desarrollo de la lógica de negocio correcta
- Se cumplen las directrices otorgadas
- Código limpio, fácil de entender, y reutilizable

### Puntos opcionales a valorar
- Generar un tipado correcto
- Test unitarios
- Implementar un sistema de cache con Redis

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



