import Base64 from "./base64"
import { getDataAtual, getHoraAtual } from "./dateAndHour/dateHour"

export const getToken = (idUsuario, idTransacion) => {
    return new Base64().criptografar(`${idUsuario}${idTransacion}${getDataAtual}${getHoraAtual()}`)
}