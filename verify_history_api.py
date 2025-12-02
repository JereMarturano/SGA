import requests
import json
import time

BASE_URL = "http://localhost:8080/api"

def create_client():
    client_data = {
        "NombreCompleto": "Test Client History",
        "Direccion": "123 Test St",
        "Estado": "Activo",
        "Deuda": 0,
        "VentasTotales": 0,
        "RequiereFactura": False
    }
    try:
        res = requests.post(f"{BASE_URL}/clientes", json=client_data)
        if res.status_code == 201:
            print("Client created")
            return res.json()["clienteId"]
        else:
            print(f"Failed to create client: {res.text}")
            return None
    except Exception as e:
        print(f"Error creating client: {e}")
        return None

def create_user():
    user_data = {
        "Nombre": "Vendedor Test",
        "Rol": 4, # Vendedor
        "ContrasenaHash": "password",
        "Estado": "Activo"
    }
    try:
        # Check if users exist first
        res_get = requests.get(f"{BASE_URL}/empleados")
        # EmpleadosController usually returns UsuarioDTO which has 'id', not 'usuarioId' often.
        if res_get.status_code == 200 and len(res_get.json()) > 0:
            return res_get.json()[0]["usuarioId"]

        res = requests.post(f"{BASE_URL}/empleados", json=user_data)
        if res.status_code == 201:
            print("User created")
            # The create response might return DTO with 'id' or Entity with 'usuarioId'
            data = res.json()
            if "id" in data: return data["id"]
            if "usuarioId" in data: return data["usuarioId"]
            return 1 # Fallback
        else:
             # Try getting all users and picking one
            res_get = requests.get(f"{BASE_URL}/empleados")
            if res_get.status_code == 200 and len(res_get.json()) > 0:
                return res_get.json()[0]["usuarioId"]
            print(f"Failed to create/find user: {res.text}")
            return None
    except Exception as e:
        print(f"Error creating user: {e}")
        return None

def get_product_and_vehicle():
    try:
        # Need a product and a vehicle with stock
        # 1. Get Products
        prods = requests.get(f"{BASE_URL}/productos").json()
        if not prods:
            # Create product
            p_data = {
                "Nombre": "Huevo Test",
                "TipoProducto": 0,
                "UnidadDeMedida": "Maple",
                "UnidadesPorBulto": 12,
                "StockActual": 100,
                "StockMinimoAlerta": 10,
                "CostoUltimaCompra": 100,
                "EsHuevo": True
            }
            res_p = requests.post(f"{BASE_URL}/productos", json=p_data)
            prod_id = res_p.json()["productoId"]
        else:
            prod_id = prods[0]["productoId"]

        # 2. Get Vehicles
        vehs = requests.get(f"{BASE_URL}/vehiculos").json()
        if not vehs:
            # Create vehicle
            v_data = {
                "Patente": "AA111AA",
                "Marca": "Ford",
                "Modelo": "F100",
                "CapacidadCarga": 1000,
                "Kilometraje": 10000,
                "ConsumoPromedioLts100Km": 10,
                "EnRuta": False
            }
            res_v = requests.post(f"{BASE_URL}/vehiculos", json=v_data)
            veh_id = res_v.json()["vehiculoId"]
        else:
            veh_id = vehs[0]["vehiculoId"]

        # 3. Add Stock to Vehicle (Inventory)
        # Check current stock
        stock_res = requests.get(f"{BASE_URL}/inventario/vehiculo/{veh_id}")
        has_stock = False
        if stock_res.status_code == 200:
            for s in stock_res.json():
                if s["productoId"] == prod_id and s["cantidad"] > 10:
                    has_stock = True
                    break

        if not has_stock:
            # Load stock
            load_data = {
                "VehiculoId": veh_id,
                "Items": [{"ProductoId": prod_id, "Cantidad": 50}]
            }
            requests.post(f"{BASE_URL}/inventario/cargar", json=load_data)
            print("Stock loaded to vehicle")

        return prod_id, veh_id
    except Exception as e:
        print(f"Error getting product/vehicle: {e}")
        return None, None

def create_sale(client_id, user_id, veh_id, prod_id):
    sale_data = {
        "Fecha": "2024-05-20T10:00:00",
        "ClienteId": client_id,
        "UsuarioId": user_id,
        "VehiculoId": veh_id,
        "MetodoPago": 0, # Efectivo
        "DescuentoPorcentaje": 0,
        "Items": [
            {
                "ProductoId": prod_id,
                "Cantidad": 5,
                "PrecioUnitario": 1500
            }
        ]
    }

    try:
        res = requests.post(f"{BASE_URL}/ventas", json=sale_data)
        if res.status_code in [200, 201]:
            print("Sale created")
            return res.json()
        else:
            print(f"Failed to create sale: {res.text}")
            return None
    except Exception as e:
        print(f"Error creating sale: {e}")
        return None

def verify_history(client_id):
    print(f"Checking history for client {client_id}...")
    try:
        res = requests.get(f"{BASE_URL}/clientes/{client_id}/historial-ventas")
        if res.status_code == 200:
            history = res.json()
            print(f"History count: {len(history)}")
            print(json.dumps(history, indent=2))
        else:
            print(f"Failed to fetch history: {res.text}")
    except Exception as e:
        print(f"Error fetching history: {e}")

def run():
    try:
        cid = create_client()
        if not cid: return

        uid = create_user()
        if not uid: return

        pid, vid = get_product_and_vehicle()
        if not pid or not vid: return

        create_sale(cid, uid, vid, pid)

        # Verify
        verify_history(cid)

    except Exception as e:
        print(e)

if __name__ == "__main__":
    run()
