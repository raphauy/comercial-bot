const getProductByCode = 
{
    "name": "getProductByCode",
    "description": "Devuelve un producto a partir de su código",
        "parameters": {
        "type": "object",
        "properties": {
            "code": {
                "type": "string",
                "description": "Código del producto"
            }
        },
        "required": ["code"]
    }
}

const getProductByRanking= 
{
    "name": "getProductByRanking",
    "description": "Devuelve un producto a partir de su número de ranking",
        "parameters": {
        "type": "object",
        "properties": {
            "ranking": {
                "type": "string",
                "description": "Número de Ranking del producto"
            }
        },
        "required": ["ranking"]
    }
}

const getProductsByName= 
{
    "name": "getProductsByName",
    "description": "Esta es una búsqueda semántica o vectorial. Devuelve un array de productos que tengan similaridad semántica con el nombre de la consulta",
        "parameters": {
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "Nombre o parte del nombre del producto"
            }
        },
        "required": ["name"]
    }
}

const getProductsByCategoryName= 
{
    "name": "getProductsByCategoryName",
    "description": "Devuelve un array con los primeros productos de la categoría especificada ordenados por ranking.",
        "parameters": {
        "type": "object",
        "properties": {
            "categoryName": {
                "type": "string",
                "description": "Nombre de la categoría"
            }
        },
        "required": ["categoryName"]
    }
}

const getClientByCode= 
{
    "name": "getClientByCode",
    "description": "Devuelve el cliente a partir de su código",
        "parameters": {
        "type": "object",
        "properties": {
            "code": {
                "type": "string",
                "description": "Código del cliente"
            }
        },
        "required": ["code"]
    }
}

const getClientsByName= 
{
    "name": "getClientsByName",
    "description": "Esta es una búsqueda semántica o vectorial. Devuelve un array de clientes que tengan similaridad semántica con el nombre de la consulta",
        "parameters": {
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "Nombre o parte del nombre del cliente"
            }
        },
        "required": ["name"]
    }
}

const getClientsOfVendor= 
{
    "name": "getClientsOfVendor",
    "description": "Devuelve un array de clientes asociados a un vendedor",
        "parameters": {
        "type": "object",
        "properties": {
            "vendorName": {
                "type": "string",
                "description": "Nombre del vendedor"
            }
        },
        "required": ["vendorName"]
    }
}

const getBuyersOfProductByCode=
{
    "name": "getBuyersOfProductByCode",
    "description": "Devuelve los principales compradores de un producto a partir del código del producto",
    "parameters": {
        "type": "object",
        "properties": {
            "code": {
                "type": "string",
                "description": "Código del producto"
            }
        },
        "required": ["code"]
    }
}

const getBuyersOfProductByRanking=
{
    "name": "getBuyersOfProductByRanking",
    "description": "Devuelve los principales compradores de un producto a partir del número de ranking del producto",
    "parameters": {
        "type": "object",
        "properties": {
            "ranking": {
                "type": "string",
                "description": "Número de Ranking del producto"
            }
        },
        "required": ["ranking"]
    }
}

const getBuyersOfProductByCategory=
{
    "name": "getBuyersOfProductByCategory",
    "description": "Devuelve los principales compradores de un producto a partir de la categoría del producto. Estas son las principales categorías: 12v, 20v, 220v, Consumibles, Explosion, Manuales",
    "parameters": {
        "type": "object",
        "properties": {
            "categoryName": {
                "type": "string",
                "description": "Nombre de la categoría del producto"
            }
        },
        "required": ["categoryName"]
    }
}