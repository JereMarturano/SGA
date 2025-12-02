# 📚 Tutorial: Cómo Arrancar la Aplicación SGA

## 📋 Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Arrancar la Base de Datos](#arrancar-la-base-de-datos)
4. [Arrancar el Backend](#arrancar-el-backend)
5. [Arrancar el Frontend](#arrancar-el-frontend)
6. [Verificación](#verificación)
7. [Solución de Problemas](#solución-de-problemas)

---

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Docker Desktop** (para Windows)
  - Descarga: https://www.docker.com/products/docker-desktop
  - Versión recomendada: 4.0 o superior
  
- **.NET SDK 8.0** o superior
  - Descarga: https://dotnet.microsoft.com/download
  - Verifica con: `dotnet --version`
  
- **Node.js** (versión 18 o superior)
  - Descarga: https://nodejs.org/
  - Verifica con: `node --version`
  
- **npm** (viene con Node.js)
  - Verifica con: `npm --version`

---

## ⚙️ Configuración Inicial

### 1. Clonar o Ubicar el Proyecto

Asegúrate de estar en el directorio del proyecto:

```powershell
cd c:\Users\Jerem\source\repos\SGA
```

### 2. Instalar Dependencias del Frontend

```powershell
cd client-web
npm install
cd ..
```

---

## 🗄️ Arrancar la Base de Datos

### Opción 1: Usar Docker Compose (Recomendado)

El proyecto incluye un archivo `docker-compose.yml` que configura SQL Server automáticamente.

```powershell
# Iniciar la base de datos
docker-compose up -d db
```

Esto iniciará un contenedor de SQL Server con:
- **Puerto**: 1433
- **Usuario**: sa
- **Contraseña**: Password123!
- **Base de datos**: SGA_Avicola

### Opción 2: Verificar que el Contenedor Esté Corriendo

```powershell
# Ver contenedores activos
docker ps

# Deberías ver algo como:
# CONTAINER ID   IMAGE                                        PORTS
# xxxxx          mcr.microsoft.com/mssql/server:2022-latest   0.0.0.0:1433->1433/tcp
```

### Esperar a que SQL Server esté listo

SQL Server puede tardar 20-30 segundos en estar completamente listo. Puedes verificar los logs:

```powershell
docker logs sga_db
```

Busca el mensaje: **"SQL Server is now ready for client connections"**

---

## 🚀 Arrancar el Backend

### 1. Navegar al Directorio del Backend

```powershell
cd SGA
```

### 2. Aplicar Migraciones de Base de Datos

**IMPORTANTE**: Esto debe hacerse la primera vez o cuando haya cambios en el modelo de datos.

```powershell
dotnet ef database update
```

Si ves errores, asegúrate de que:
- Docker esté corriendo
- El contenedor de SQL Server esté activo
- La conexión en `appsettings.json` sea correcta

### 3. Ejecutar el Backend

```powershell
dotnet run
```

El backend debería iniciar en:
- **URL**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger (para probar APIs)

**Señales de que está funcionando correctamente:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:8080
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

---

## 🎨 Arrancar el Frontend

### 1. Abrir una Nueva Terminal

**No cierres la terminal del backend**. Abre una nueva ventana de PowerShell.

### 2. Navegar al Directorio del Frontend

```powershell
cd c:\Users\Jerem\source\repos\SGA\client-web
```

### 3. Ejecutar el Frontend en Modo Desarrollo

```powershell
npm run dev
```

El frontend debería iniciar en:
- **URL**: http://localhost:3000

**Señales de que está funcionando correctamente:**
```
  ▲ Next.js 16.0.5
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

---

## ✅ Verificación

### 1. Verificar que Todo Esté Corriendo

Deberías tener **3 procesos activos**:

| Componente | Puerto | URL |
|------------|--------|-----|
| Base de Datos (Docker) | 1433 | - |
| Backend (ASP.NET) | 8080 | http://localhost:8080 |
| Frontend (Next.js) | 3000 | http://localhost:3000 |

### 2. Probar la Aplicación

1. **Abre tu navegador** en http://localhost:3000
2. Deberías ver la **pantalla de login**
3. Credenciales por defecto:
   - **Usuario**: admin
   - **Contraseña**: admin123

### 3. Verificar la API

Visita http://localhost:8080/swagger para ver la documentación interactiva de la API.

---

## 🛠️ Solución de Problemas

### ❌ Error: "No se puede conectar a la base de datos"

**Solución:**
```powershell
# Reiniciar el contenedor de Docker
docker-compose down
docker-compose up -d db

# Esperar 30 segundos y volver a intentar
```

### ❌ Error: "Puerto 8080 ya está en uso"

**Solución:**
```powershell
# Encontrar el proceso que usa el puerto
netstat -ano | findstr :8080

# Matar el proceso (reemplaza PID con el número que aparece)
taskkill /PID <PID> /F
```

### ❌ Error: "Puerto 3000 ya está en uso"

**Solución:**
```powershell
# Encontrar el proceso que usa el puerto
netstat -ano | findstr :3000

# Matar el proceso
taskkill /PID <PID> /F
```

### ❌ Error: "dotnet ef no se reconoce como comando"

**Solución:**
```powershell
# Instalar Entity Framework CLI
dotnet tool install --global dotnet-ef

# O actualizar si ya está instalado
dotnet tool update --global dotnet-ef
```

### ❌ Error: "npm install falla"

**Solución:**
```powershell
# Limpiar caché de npm
cd client-web
npm cache clean --force
rm -r node_modules
rm package-lock.json
npm install
```

### ❌ La aplicación se ve pero no carga datos

**Verificar:**
1. Que el backend esté corriendo (http://localhost:8080/swagger)
2. Que no haya errores en la consola del navegador (F12)
3. Que las migraciones se hayan aplicado correctamente

---

## 🔄 Comandos Rápidos de Referencia

### Iniciar Todo desde Cero

```powershell
# Terminal 1: Base de datos
docker-compose up -d db

# Terminal 2: Backend (esperar 30 segundos después del paso anterior)
cd SGA
dotnet ef database update
dotnet run

# Terminal 3: Frontend
cd client-web
npm run dev
```

### Detener Todo

```powershell
# Detener frontend: Ctrl+C en la terminal del frontend
# Detener backend: Ctrl+C en la terminal del backend

# Detener base de datos
docker-compose down
```

### Reiniciar la Base de Datos (Borrar Todos los Datos)

```powershell
docker-compose down -v
docker-compose up -d db
cd SGA
dotnet ef database update
```

---

## 📝 Notas Adicionales

### Datos de Prueba

La aplicación crea automáticamente un usuario administrador:
- **Usuario**: admin
- **Contraseña**: admin123

### Puertos Utilizados

- **1433**: SQL Server
- **8080**: Backend API
- **3000**: Frontend Next.js

### Estructura del Proyecto

```
SGA/
├── SGA/                    # Backend (ASP.NET Core)
│   ├── Controllers/        # Endpoints de la API
│   ├── Models/            # Modelos de datos
│   ├── Services/          # Lógica de negocio
│   └── Program.cs         # Punto de entrada
├── client-web/            # Frontend (Next.js)
│   ├── app/               # Páginas y rutas
│   ├── components/        # Componentes React
│   └── package.json       # Dependencias
└── docker-compose.yml     # Configuración de Docker
```

---

## 🎯 Próximos Pasos

Una vez que la aplicación esté corriendo:

1. **Explora las funcionalidades**:
   - Gestión de inventario
   - Carga de vehículos
   - Simulación de ventas
   - Reportes y estadísticas

2. **Revisa la documentación de la API**:
   - http://localhost:8080/swagger

3. **Personaliza la aplicación** según tus necesidades

---

## 📞 Soporte

Si encuentras problemas no cubiertos en este tutorial:

1. Revisa los logs del backend en la terminal
2. Revisa la consola del navegador (F12)
3. Verifica los logs de Docker: `docker logs sga_db`

---

**¡Listo! Tu aplicación SGA debería estar funcionando correctamente.** 🎉
