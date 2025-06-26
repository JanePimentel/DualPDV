import { 
    TB_Caixa,
    TB_Clientes, 
    TB_Estoque, 
    TB_InfoSistema, 
    TB_OperacoesCaixa, 
    TB_Usuarios, 
    TB_Pedidos, 
    TB_Vendas, 
    TB_ContasAReceber, 
    TB_PlanoFinanceiro, 
    TB_CentroCusto,
    TB_FormasPagamento, 
    TB_ConfigPrint,
    TB_Cheques,
    TB_Municipios,
    TB_ConfigComercial
} from "../database/DBTables";
import Realm from 'realm'


const DBParameters = {
    version: 1
}

export default ConDB = new Realm({
    schema: [
        TB_Caixa, 
        TB_ContasAReceber, 
        TB_Clientes, 
        TB_Estoque, 
        TB_InfoSistema, 
        TB_OperacoesCaixa, 
        TB_Usuarios, 
        TB_Pedidos, 
        TB_Vendas, 
        TB_PlanoFinanceiro, 
        TB_CentroCusto, 
        TB_FormasPagamento, 
        TB_ConfigPrint, 
        TB_ConfigComercial, 
        TB_Cheques, 
        TB_Municipios, 
    ], 
    schemaVersion: DBParameters.version
})