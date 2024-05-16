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