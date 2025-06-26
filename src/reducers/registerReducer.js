
import ConDB from "../config/database";

const INITIAL_STATE = {
    chave: '',
    infoSistema: {
        hostServidor: '',
        dbName: '',
        licenca: null
    },
    loading: false,
    realm: ConDB,
}

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'setChave':
            return { ...state, chave: action.payload }
        case 'setLoading':
            return { ...state, loading: action.payload }
        case 'setRealm':
            return { ...state, realm: action.realm }
        case 'setInfoSistema':
            let info = action.payload
            return { ...state, infoSistema: info }
        default:
            return state
    }
}