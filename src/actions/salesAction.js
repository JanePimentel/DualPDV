export const setLoadingStore = (value) => ({
    type: 'setLoadingStore',
    payload: value
})

export const setLoadingAdd = (value) => ({
    type: 'setLoadingAdd',
    payload: value
})

export const setLoadingCloseSale = (value) => ({
    type: 'setLoadingCloseSale',
    payload: value
})

export const setClient = (value) => ({
    type: 'setClient',
    payload: value
})

export const setPedido = (value) => ({
    type: 'setPedido',
    payload: value
})


export const addSacola = (value) => ({
    type: 'addSacola',
    payload: value
})

export const addFormaPagamento = (value) => ({
    type: 'addFormaPagamento',
    payload: value
})

export const calcularTotaisSacola = () => ({
    type: 'calcularTotaisSacola'
})

export const delItemSacola = (value) => ({
    type: 'delItemSacola',
    payload: value
})

export const delFormaPagamento = (value) => ({
    type: 'delFormaPagamento',
    payload: value
})

export const setIsVendaDireta = (value) => ({
    type: 'setIsVendaDireta',
    payload: value
})

export const setDesconto = (value) => ({
    type: 'setDesconto',
    payload: value
})

export const totalItensSacola = (value) => ({
    type: 'totalItensSacola',
    payload: value
})

export const limparSacola = () => ({
    type: 'limparSacola',
})

export const limpar = () => ({
    type: 'limpar',
})

export const limparRecebimentos = () => ({
    type: 'limparRecebimentos',
})

export const calcularTotalRecebimentos = (value) => ({
    type: 'calcularTotalRecebimentos',
    payload: value
})
