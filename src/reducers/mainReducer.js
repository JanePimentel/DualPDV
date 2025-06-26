const INITIAL_STATE = {
    loadingTotal: false,
    loadingParcial: false,
}

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'setLoadingTotal':
            return { ...state, loadingTotal: action.payload }
        case 'setLoadingParcial':
            return { ...state, loadingParcial: action.payload }
        default:
            return state
    }
}