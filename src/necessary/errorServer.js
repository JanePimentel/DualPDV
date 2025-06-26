import Axios from "axios";
import { Alert } from "react-native";
import {headers} from'../config/security';

class GravarErro {
    constructor() {
        this.licenca = '';
        this.dbName = '';
		this.pc = '';
		this.sistema = '';
		this.versao = '1.0.0';
		this.erro = '';
		this.logErro = '';
		this.localErro = '';
		this.dataErro = '';
		this.horaErro = '';
		this.mobile = '';
		this.cliente = '';
		this.servidor = '';
    }

    async enviarLogErro() {
        const error = {
            licenca: this.licenca, 
            dbName: this.dbName, 
            pc: this.pc, 
            sistema: this.sistema, 
            versao: this.versao, 
            erro: this.erro, 
            logErro: this.logErro, 
            localErro: this.localErro, 
            dataErro: this.dataErro, 
            horaErro: this.horaErro, 
            mobile: true, 
            cliente: false, 
            servidor: false
        }
        let url = ""
        let response = await Axios.post(url, JSON.stringify(error),headers);
        if (response.status == 200 | response.status == 204) {
            return 
        } else {
            Alert.alert('Ops...', 'Falha ao enviar erro para o servidor')
        }
    }
}

export default GravarErro;