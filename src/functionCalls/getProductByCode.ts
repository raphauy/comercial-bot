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