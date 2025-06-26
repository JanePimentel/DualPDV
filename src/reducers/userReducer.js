const INITIAL_STATE = {
    login: '',
    senha: '',
    usuario: null,
    unidade: null,
    loadingUser: false,
}

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'setLoadingUser':
            return { ...state, loadingUser: action.payload }
        case 'setLogin':
            return { ...state, login: action.payload }
        case 'setSenha':
            return { ...state, senha: action.payload }
        case 'setUsuario':
            return { ...state, usuario: action.payload }
        case 'setUnidade':
            return { ...state, unidade: action.payload }
        default:
            return state;
    }
}