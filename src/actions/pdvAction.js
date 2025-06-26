export const setLoading = (value) => {
    return ({
        type: 'setLoading', 
        payload: value
    })
}

export const setLoadingParcial = (value) => {
    return ({
        type: 'setLoadingParcial', 
        payload: value
    })
}

export const setLoadingTransacao = (value) => {
    return ({
        type: 'setLoadingTransacao', 
        payload: value
    })
}

export const setLoadingTotal = (value) => {
    return ({
        type: 'setLoadingTotal', 
        payload: value
    })
}
export const setSincronizando = (value) => {
    return ({
        type: 'setSincronizando', 
        payload: value
    })
}

export const setLancamentosTesouraria = (value) => {
    return ({
        type: 'setLancamentosTesouraria', 
        payload: value
    })
}

export const setCaixa = (value) => {
    return ({
        type: 'setCaixa', 
        payload: value
    })
}

export const setConectado = (value) => {
    return ({
        type: 'setConectado', 
        payload: value
    })
}

export const addTransacao = (value) => ({
    type: 'addTransacao', 
    payload: value
})

export const addTransacaoSync = (value) => ({
    type: 'addTransacaoSync', 
    payload: value
})

export const limpaTransacaoSync = () => ({
    type: 'addTransacaoSync', 
})


export const abrirCaixa = (value) => ({
    type: 'abrirCaixa', 
    payload: value
})

export const fecharCaixa = (value) => ({
    type: 'fecharCaixa', 
    payload: value
})

export const setCaixaAberto = (value) => {
    return ({
        type: 'setCaixaAberto', 
        payload: value
    })
}