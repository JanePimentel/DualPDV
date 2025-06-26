const INITIAL_STATE = {
    print: null,
    loading: false,
    connected: false,
    configComercial: null,
    isVersaoIncompativel: false,
}

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'setPrint':
            return { ...state, print: action.payload }
        case 'setVersaoIncompativel':
            return { ...state, isVersaoIncompativel: action.payload }
        case 'setLoading':
            return { ...state, loading: action.payload }
        case 'setConnected':
            return { ...state, connected: action.payload }
        case 'setConfigComercial':
            return { ...state, configComercial: action.payload }
        default:
            return state
    }
}