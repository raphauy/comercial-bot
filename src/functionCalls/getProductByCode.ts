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