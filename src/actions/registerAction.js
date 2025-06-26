export const setChave = (value) => {
    return ({
        type: 'setChave',
        payload: value
    })
}

export const setLoading = (value) => {
    return ({
        type: 'setLoading',
        payload: value
    })
}

export const setInfoSistema = (value) => {
    return ({
        type: 'setInfoSistema',
        payload: value
    })
}

export const setRealm = (realm) => {
    return {
        type: 'setRealm', 
        value: realm
    }
}