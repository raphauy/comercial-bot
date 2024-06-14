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

const getClientsByDepartamento=
{
    "name": "getClientsByDepartamento",
    "description": "Devuelve un array de clientes asociados de un determinado departamento. Ej: Montevideo, Canelones, Paysandú, etc. Importante: si el usuario escribe con tilde, debes modificar para que sea sin tilde. Ej: Paysandú cambia a Paysandu",
    "parameters": {
        "type": "object",
        "properties": {
            "departamento": {
                "type": "string",
                "description": "Nombre del departamento"
            }
        },
        "required": ["departamento"]
    }
}

const getClientsByLocalidad=
{
    "name": "getClientsByLocalidad",
    "description": "Devuelve un array de clientes de una determinada localidad. Las localidades son regiones de los departamentos. Algunas coinciden con los nombres de los departamentos y otras no. Ej: Montevideo, Canelones, Paysandú, Balneario Buenos Aires, Bello Horizonte,etc.",
    "parameters": {
        "type": "object",
        "properties": {
            "localidad": {
                "type": "string",
                "description": "Nombre de la localidad"
            }
        },
        "required": ["localidad"]
    }
}

const getProductsRecomendationsForClient=
{
    "name": "getProductsRecomendationsForClient",
    "description": "Devuelve un array de productos recomendados para un cliente en función de su historial de compras",
    "parameters": {
        "type": "object",
        "properties": {
            "clientName": {
                "type": "string",
                "description": "Nombre del cliente"
            }
        },
        "required": ["clientName"]
    }
}
  
const getTopBuyers=
{
    "name": "getTopBuyers",
    "description": "Devuelve un array de clientes ordenados por la cantidad de ventas totales.",
    "parameters": {}
}

const getTopBuyersByDepartamento=
{
    "name": "getTopBuyersByDepartamento",
    "description": "Devuelve un array de clientes de un determinado departamento ordenados por la cantidad de ventas.",
    "parameters": {
        "type": "object",
        "properties": {
            "departamento": {
                "type": "string",
                "description": "Nombre del departamento"
            }
        },
        "required": ["departamento"]
    }
}

const getTopBuyersByDepartamentoAndVendor=
{
    "name": "getTopBuyersByDepartamentoAndVendor",
    "description": "Devuelve un array de clientes de un determinado departamento y vendedor ordenados por la cantidad de ventas.",
    "parameters": {
        "type": "object",
        "properties": {
            "departamento": {
                "type": "string",
                "description": "Nombre del departamento"
            },
            "vendorName": {
                "type": "string",
                "description": "Nombre del vendedor"
            }
        },
        "required": ["departamento", "vendorName"]
    }
}

const insertLead= 
{
    "name": "insertLead",
    "description": "Inserta un nuevo lead en la base de datos",
    "parameters": {
        "type": "object",
        "properties": {
            "conversationId": {
                "type": "string",
                "description": "Identificador de la conversación que va en el prompt."
            },
            "name": {
                "type": "string",
                "description": "Nombre del usuario"
            },
            "companyName": {
                "type": "string",
                "description": "Nombre de la empresa si el usuario tiene una. También se le llama Razón Social. Se debe manejar el término Razón Social al dialogar con el usuario"
            },
            "rutOrCI": {
                "type": "string",
                "description": "RUT de la empresa si el usuario tiene una, en caso contrario solicitar la CI (cédula de identidad)"
            },
            "phone": {
                "type": "string",
                "description": "Teléfono el usuario, este campo no se debe preguntar al usuario ya que está en el prompt, pero se debe llenar este campo con el número de teléfono del usuario"
            },
            "address": {
                "type": "string",
                "description": "Dirección de la empresa si el usuario tiene una, en caso contrario será la dirección del usuario"
            }
        },
        "required": ["conversationId", "name", "rutOrCI", "phone", "address"]
    }
}

const addItemToOrder= 
{
    "name": "addItemToOrder",
    "description": "Añade un producto a un pedido y devuelve el pedido actualizado. Esta función es exclusiva para clientes existentes en el sistema.",
    "parameters": {
        "type": "object",
        "properties": {
            "orderId": {
                "type": "string",
                "description": "Identificador del pedido. Si se quiere crear un nuevo pedido, se debe utilizar el valor 'new'"
            },
            "comClientId": {
                "type": "string",
                "description": "Identificador del comClient que estará disponible en el prompt"
            },
            "productCode": {
                "type": "string",
                "description": "Código del producto"
            },
            "quantity": {
                "type": "string",
                "description": "Cantidad del producto para esta orden"
            }
        },
        "required": ["orderId", "comClientId", "productCode", "quantity"]
    }
}

const removeItemFromOrder=
{
    "name": "removeItemFromOrder",
    "description": "Elimina un producto de un pedido y devuelve el pedido actualizado.",
    "parameters": {
        "type": "object",
        "properties": {
            "orderId": {
                "type": "string",
                "description": "Identificador del pedido"
            },
            "productCode": {
                "type": "string",
                "description": "Código del producto"
            }
        },
        "required": ["orderId", "productCode"]
    }
}

const changeQuantityOfItemInOrder=
{
    "name": "changeQuantityOfItemInOrder",
    "description": "Cambia la cantidad de un producto en un pedido y devuelve el pedido actualizado.",
    "parameters": {
        "type": "object",
        "properties": {
            "orderId": {
                "type": "string",
                "description": "Identificador del pedido"
            },
            "productCode": {
                "type": "string",
                "description": "Código del producto"
            },
            "quantity": {
                "type": "string",
                "description": "Cantidad del producto para esta orden"
            }
        },
        "required": ["orderId", "productCode", "quantity"]
    }
}

const confirmOrder= 
{
    "name": "confirmOrder",
    "description": "Confirma un pedido y devuelve el pedido actualizado",
    "parameters": {
        "type": "object",
        "properties": {
            "orderId": {
                "type": "string",
                "description": "Identificador del pedido"
            },
            "note": {
                "type": "string",
                "description": "Pregunta esto al usuario: '¿Te gustaría agregar alguna nota al pedido?'. Si no quiere puedes omitir este parámetro"
            }
        },
        "required": ["orderId"]
    }
}

const cancelOrder= 
{
    "name": "cancelOrder",
    "description": "Cancela un pedido y devuelve el pedido actualizado",
    "parameters": {
        "type": "object",
        "properties": {
            "orderId": {
                "type": "string",
                "description": "Identificador del pedido"
            },
            "note": {
                "type": "string",
                "description": "Pregunta esto al usuario: '¿Te gustaría agregar alguna nota a esta cancelación?'. Si no quiere puedes omitir este parámetro"
            }
        },
        "required": ["orderId"]
    }
}

const addBulkItemsToOrder = 
{
    "name": "addBulkItemsToOrder",
    "description": "Añade múltiples productos a un pedido y devuelve el pedido actualizado. Esta función es exclusiva para clientes existentes en el sistema.",
    "parameters": {
        "type": "object",
        "properties": {
            "orderId": {
                "type": "string",
                "description": "Identificador del pedido. Si se quiere crear un nuevo pedido, se debe utilizar el valor 'new'"
            },
            "comClientId": {
                "type": "string",
                "description": "Identificador del comClient que estará disponible en el prompt"
            },
            "products": {
                "type": "array",
                "description": "Array de productos para añadir al pedido",
                "items": {
                    "type": "object",
                    "properties": {
                        "productCode": {
                            "type": "string",
                            "description": "Código del producto"
                        },
                        "quantity": {
                            "type": "string",
                            "description": "Cantidad del producto para esta orden"
                        }
                    },
                    "required": ["productCode", "quantity"]
                }
            }
        },
        "required": ["orderId", "comClientId", "products"]
    }
}
