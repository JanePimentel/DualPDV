const INITIAL_STATE = {
    loadingStore: false,
    loadingAdd: false,
    loadingCloseSale: false,
    cliente: null,
    pedido: null,
    sacola: [],
    recebimentos: [],
    totalRecebimentos: 0.0,
    total: 0.0,
    subtotal: 0.0,
    desconto: 0.0,
    totalItensSacola: 0,
    subtotalSemPerdas: 0,
    totalDescontoPerdas: 0,
    isVendaDireta: false,
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'setClient':
            return { ...state, cliente: action.payload };
        case 'setLoadingStore':
            return { ...state, loadingStore: action.payload };
        case 'setLoadingAdd':
            return { ...state, loadingAdd: action.payload };
        case 'setLoadingCloseSale':
            return { ...state, loadingCloseSale: action.payload };
        case 'setPedido':
            return { ...state, pedido: action.payload };
        case 'setIsVendaDireta':
            return { ...state, isVendaDireta: action.payload };
        case 'setDesconto':
            return { ...state, desconto: action.payload };
        case 'setTotalItens':
            return { ...state, totalItensSacola: state.sacola.length };
        case 'addSacola':
            let exist = false;
            for (let i = 0; i < state.sacola.length; i++) {
                let v = state.sacola[i];
                if (v.produto.id == action.payload.idProduto) {
                    v.precoVenda = action.payload.precoVenda,
                        v.precoUnitario = action.payload.precoUnitario,
                        v.qtd = action.payload.qtd,
                        v.pesoLiquido = action.payload.pesoLiquido,
                        v.subtotal = action.payload.subtotal,
                        v.total = action.payload.subtotal,
                        v.desperdicio = action.payload.desperdicio,
                        exist = true;
                }
            }
            if (!exist) {
                state.sacola.push(action.payload);
            }
            return { ...state };
        case 'delItemSacola':
            for (let i = 0; i < state.sacola.length; i++) {
                if (state.sacola[i].idProduto == action.payload.produto.id) {
                    state.sacola.splice(i, 1);
                    break;
                }
            }
            return { ...state };
        case 'calcularTotaisSacola':
            state.total = 0.0;
            state.subtotal = 0.0;
            state.subtotalSemPerdas = 0.0;
            state.totalDescontoPerdas = 0.0;
            let j = 0.0;

            for (let index = 0; index < state.sacola.length; index++) {
                let item = state.sacola[index];
                if (item) {
                    String(item.produto.undVenda.unidade).toLowerCase() === 'kg' | String(item.produto.precoVenda.valorSeraPorPeso) === 'true' ?
                        (item.subtotal = parseFloat(item.precoVenda) * parseFloat(item.pesoLiquido))
                        :
                        (item.subtotal = parseFloat(item.precoVenda) * parseFloat(item.qtd))
                    /** subtotal sem desconto e perdas */
                    state.subtotalSemPerdas += item.subtotal;

                    item.descontoDesperdicio = parseFloat(item.subtotal / item.qtd) * item.desperdicio;

                    /** total de desconto com perdas*/
                    state.totalDescontoPerdas += item.descontoDesperdicio;

                    item.total = parseFloat(item.subtotal - item.descontoDesperdicio);
                    state.subtotal += item.total;
                }
            }
            if (state.desconto < state.subtotal) {
                j = state.subtotal - state.desconto;
            }

            console.log(`subtotal: ${state.subtotal}  desconto: ${state.desconto}  total: ${j} semPerda:${state.subtotalSemPerdas} `)
            return { ...state, total: j, subtotal: state.subtotal, subtotalSemPerdas: state.subtotalSemPerdas, totalDescontoPerdas: state.totalDescontoPerdas }
        case 'limparSacola':
            return { ...state, 
                sacola: [],
                recebimentos: [],
                totalRecebimentos: 0.0,
                total: 0.0,
                subtotal: 0.0,
                desconto: 0.0,
                totalItensSacola: 0,
                subtotalSemPerdas: 0,
                totalDescontoPerdas: 0, 
            };
        case 'addFormaPagamento':
            state.recebimentos.push(action.payload);
            return { ...state };
        case 'calcularTotalRecebimentos':
            state.totalRecebimentos = 0.0;
            for (let index = 0; index < state.recebimentos.length; index++) {
                let item = state.recebimentos[index];
                state.totalRecebimentos += item.valorRecebimento;
            }
            return { ...state, totalRecebimentos: state.totalRecebimentos };
        case 'delFormaPagamento':
            for (let f = 0; f < state.recebimentos.length; f++) {
                if (Number(state.recebimentos[f].idFormaPagamento) == Number(action.payload.idFormaPagamento)
                ) {
                    state.recebimentos.splice(f, 1);
                    break;
                }
            }
            return { ...state };
        case 'limparRecebimentos':
            return { ...state, recebimentos: [] };
        case 'limpar':
            return {
                ...state,
                loadingStore: false,
                loadingAdd: false,
                loadingCloseSale: false,
                cliente: null,
                pedido: null,
                sacola: [],
                recebimentos: [],
                totalRecebimentos: 0.0,
                total: 0.0,
                subtotal: 0.0,
                desconto: 0.0,
                totalItensSacola: 0,
                subtotalSemPerdas: 0,
                totalDescontoPerdas: 0,
                isVendaDireta: false,
            };
        default:
            return state;
    }
};
