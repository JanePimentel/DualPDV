import { Buffer } from "buffer";


export const criptografar = (text) => {
    var value = Buffer.from(text).toString('base64');
    // console.log(value);
    return value;
}

export const descriptografar = (text) => {
    var value = Buffer.from(text).toString('utf-8');
    // console.log(value);
    return value;
}


export default class Base64 {
    criptografar(text) {
        var value = Buffer.from(text).toString('base64');
        // console.log(value);
        return value;
    }

    descriptografar(text) {
        var value = Buffer.from(text).toString('utf-8');
        console.log(value);
        return value;
    }
}