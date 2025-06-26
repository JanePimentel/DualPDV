export const TB_Usuarios = {
    name: 'usuarios', 
    primaryKey: 'id', 
    properties: {
        id: {type: 'int', default: 0}, 
        login: 'string', 
        senha: 'string', 
        jsonObjeto: 'string'
    }
}

export const TB_InfoSistema = {
    name: 'infosistema', 
    primaryKey: 'licenca', 
    properties: {
        hostServidor: 'string', 
        dbName: 'string', 
        licenca: 'string', 
        jsonUnidade: 'string'
    }
}

export const TB_Vendas = {
    name: 'vendas', 
    primaryKey: 'id', 
    properties: {
        id: 'int',
        json: 'string'
    }
}

export const TB_Caixa = {
    name: 'caixa', 
    primaryKey: 'id', 
    properties: {
        id: 'int', 
        json: 'string', 
        sincronizado: {type: 'bool', default: false}
    }
}

export const TB_OperacoesCaixa = {
    name: 'transacoescaixa', 
    primaryKey: 'id', 
    properties: {
        id: 'int', 
        idCaixa: 'int', 
        json: 'string', 
        sincronizado: {type: 'bool', default: false}
    }
} 

export const TB_ContasAReceber = {
    name: 'contasAReceber', 
    properties: {
        id: 'int', 
        parcela: 'int', 
        json: 'string'
    }
}

export const TB_PlanoFinanceiro = {
    name: 'planoFinanceiro', 
    primaryKey: 'id',
    properties: {
        id: 'int', 
        json: 'string'
    }
}

export const TB_CentroCusto = {
    name: 'centroCusto', 
    primaryKey: 'id',
    properties: {
        id: 'int', 
        json: 'string'
    }
}

export const TB_Cheques = {
    name: 'cheques', 
    primaryKey: 'id',
    properties: {
        id: 'int', 
        sincronizado: {type: 'bool', default: true}, 
        json: 'string'
    }
}

export const TB_Clientes = {
    name: 'clientes', 
    primaryKey: 'id', 
    properties: {
        id: 'int', 
        json: 'string'
    }
}

export const TB_FormasPagamento = {
    name: 'formasPagamento', 
    primaryKey: 'id', 
    properties: {
        id: 'int', 
        json: 'string'
    }
}

export const TB_Estoque = {
    name: 'estoque', 
    primaryKey: 'id', 
    properties: {
        id: 'int', 
        json: 'string'
    }
}

export const TB_Pedidos = {
    name: 'pedidos', 
    primaryKey: 'id', 
    properties: {
        id: 'int', 
        json: 'string'
    }
}

export const TB_ConfigPrint = {
    name: 'config_print', 
    primaryKey: 'id', 
    properties: {
        id: 'int',
        name: 'string', 
        mac: 'string',
    }
}
export const TB_ConfigComercial = {
    name: 'config_comercial', 
    primaryKey: 'und', 
    properties: {
        und: 'int',
        json: 'string'
    }
}

export const TB_Municipios = {
    name: 'municipios', 
    primaryKey: 'id', 
    properties: {
        id: 'int', 
        json: 'string'
    }
}