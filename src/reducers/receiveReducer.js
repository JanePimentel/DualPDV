const INITIAL_STATE = {
    loadingReceiveBill: false,
    transacoes: [],
    total: 0.0,
    formasRecebimento: [],
    titulos: [],
}

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'setLoadingReceive':
            return { ...state, loadingReceiveBill: action.payload }
        case 'addTransacoes':
            let transactions = []
            if (state.transacoes) transactions = JSON.parse(JSON.stringify(state.transacoes))
            transactions.push(action.payload)
            state.transacoes = transactions
            return { ...state }
        case 'addTitulo':
            let exist = false;
            for (let i = 0; i < state.titulos.length; i++) {
                let v = state.titulos[i];
                if (v.titulo.idConta == action.payload.titulo.idConta && v.titulo.titulo == action.payload.titulo.titulo) {
                    exist = true;
                }
            }
            if (!exist) {
                state.titulos.push(action.payload)
            }
            return { ...state }
        case 'delTitulo':
            let arrayTitulos = JSON.parse(JSON.stringify(state.titulos));

            for (let i = 0; i < arrayTitulos.length; i++) {
                if (arrayTitulos[i].titulo.idConta == action.payload.idConta && arrayTitulos[i].titulo.titulo == action.payload.titulo) {

                    arrayTitulos.splice(i, 1);
                    break;
                }
            }
            return { ...state, titulos: arrayTitulos };
        case 'setTotal':
            let t = 0;
            for (let i = 0; i < state.titulos.length; i++) {
                t += state.titulos[i].total
            }
            return { ...state, total: t }
        case 'addFormaRecebimento':
            state.formasRecebimento.push(action.payload)
            return { ...state }
        case 'delFormaRecebimento':
            state.formasRecebimento.splice(action.payload, 1)
            return { ...state }
        case 'limparTitulos':
            return { ...state, total: 0.0, formasRecebimento: [], titulos: [], transacoes: [] };
        case 'limparDados':
            return {
                ...state,
                loadingReceiveBill: false,
                transacoes: [],
                total: 0.0,
                formasRecebimento: [],
                titulos: [],
            };
        default:
            return state
    }
}

