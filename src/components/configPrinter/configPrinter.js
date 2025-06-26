import React, { createRef } from 'react';
import { ScrollView, View, Platform, Alert, Dimensions, StatusBar } from 'react-native';
import { ListItem, Avatar } from 'react-native-elements';
import { connect } from 'react-redux';
import { Text,  Button,IconButton, TouchableRipple, Portal, Snackbar } from 'react-native-paper';
import styleMain from '../../necessary/style/styleMain';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import Spinner from 'react-native-loading-spinner-overlay';
import { Wave } from 'react-native-animated-spinkit';
import styleGlobal from '../../necessary/style/styleGlobal';
import {
    setLoadingCloseSale,
    limpar,
    setClient,
    addFormaPagamento,
    delFormaPagamento,
    setLoadingStore,
    setLoadingAdd,
    addSacola,
    setIsVendaDireta,
    delItemSacola,
    calcularTotaisSacola,
    limparSacola,
    limparRecebimentos,
    calcularTotalRecebimentos,
    setDesconto,
} from '../../actions/salesAction';
import { setPrint } from '../../actions/configAction';
import { TB_CentroCusto, TB_InfoSistema, TB_Cheques, TB_PlanoFinanceiro, TB_ConfigPrint, TB_Caixa, TB_Clientes, TB_ContasAReceber, TB_Estoque, TB_FormasPagamento, TB_OperacoesCaixa, TB_Usuarios, TB_Vendas, TB_Municipios } from '../../database/DBTables';
import {
    headers
} from '../../config/security';
import Axios from 'axios';
import style from '../../necessary/style/styleLogin';
import Toast from 'react-native-tiny-toast';
import pickerSelectStylesCloseSale from '../../necessary/style/stylePickerSelectSale';
import RNPickerSelect from 'react-native-picker-select';
import {bluetoothEnable, enableBluetooth } from '../../necessary/Print';
import {
    BluetoothManager,
} from 'react-native-bluetooth-escpos-printer'
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import ActionSheet from "react-native-actions-sheet";
import GravarErro from '../../necessary/errorServer';



const actionSheetRef = createRef();
const actionSheetRef_2 = createRef();
const actionSheetRef_3 = createRef();

class formConfig extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isVisible: true,
            loadingPrint: false,
            loadingRestore: false,
            status: '',
            printers: [],
            dispositivos: [],
            print: null,
            impressora: false,
            restore: false,
            devices: null,
            pairedDs: [],
            foundDs: [],
            bleOpend: false,
            boundAddress: '',
            debugMsg: '',
            loadingBackup: false,
        }
        this.getPrinters;
        this.verificarConexaoBlu();
    }


    componentDidMount() {
        setTimeout(() => this.setState({ isVisible: !this.state.isVisible }), 2500);
    }


    /**
     * Solicita ativação bluetooth e retorna lista de dispositivos emparelhados; atribui eles a um array formatado para seleção do usuário no RNPicker.*/
    async getPrinters() {
        let arrayFormatado = [];

        let bluetoothEnabled = await bluetoothEnable();
        let paired = await enableBluetooth();

        if (paired.length <= 0) {
            Toast.show('Nenhuma impressora conectada ao seu celular!', {
                position: Toast.position.CENTER,
                containerStyle: {
                    backgroundColor: '#D3D3D3',
                    borderRadius: 10,
                },
                textStyle: {
                    color: 'white',
                },
                imgStyle: {},
                mask: false,
                maskStyle: {},
                duration: 2000,
                animation: true,
            });
        } else {
            this.setState({
                printers: paired,
            });
        }
        //getDevicesPaired() inserido já após a listagem de dispositivo para gerar array formatado.
        if (this.state.printers != null && this.state.printers != undefined && this.state.printers.length > 0) {
            for (let i = 0; i < this.state.printers.length; i++) {
                arrayFormatado.push({
                    label: this.state.printers[i].name,
                    value: this.state.printers[i],
                });
            }
            this.setState({ dispositivos: arrayFormatado });
        }
    }

    /**
     * Sempre que o usuário perder a conexão(como desabilitar o bluetooth); deverá acessar menu Configuracoes para nova tentativa de conexao.*/
    async verificarConexaoBlu() {
        let size = await this.props.realm.objects(TB_ConfigPrint.name).length;
        const configPrint = (size > 0 ? JSON.parse(JSON.stringify(Array.from(await this.props.realm.objects(TB_ConfigPrint.name))[0])) : null)
        this.props.setPrint(configPrint);

        if (this.props.print != null) {
            BluetoothManager.connect(this.props.print.mac)
        }
    }


    /**Salva impressora escolhida */
    async salvarImpressora() {
        if (this.state.printers.length == 0) {
            Alert.alert('Ops...', 'Não foi encontrada nenhuma impressora conectada ao seu aparelho!');
        } else if (this.state.print == null && this.state.printers.length > 0) {
            Alert.alert('Atenção...', 'Selecione uma impressora!');
        } else {
            this.setState({ loadingPrint: true })
            await this.props.realm.write(() => {
                let size = this.props.realm.objects(TB_ConfigPrint.name).length;
                let i = Array.from(this.props.realm.objects(TB_ConfigPrint.name));
                if (size > 0) {
                    i[0].name = this.state.print.name;
                    i[0].mac = this.state.print.address;
                    this.props.realm.create(TB_ConfigPrint.name, i[0], true);
                } else {
                    this.props.realm.create(TB_ConfigPrint.name, {
                        id: 1,
                        name: this.state.print.name,
                        mac: this.state.print.address,
                    });
                }
            });
            Toast.showSuccess('Impressora gravada com sucesso!', {
                position: Toast.position.CENTER,
                containerStyle: {
                    backgroundColor: 'green',
                    borderRadius: 10,
                },
                textStyle: {
                    color: 'white',
                },
                imgStyle: {},
                mask: false,
                maskStyle: {},
                duration: 2000,
                animation: true,
            });
            this.setState({ loadingPrint: false });
            actionSheetRef.current?.hide();
        }
    }



    async backup() {
        let response = null;
        let aplicativo = 'Dual PDV';
        let versao = new GravarErro().versao;
        let versaoBanco = this.props.realm.schemaVersion;

        this.setState({ loadingBackup: true });
        /** * Backup TB_InfoSistema*/
        await this.setState({ status: '' });
        await this.setState({ status: `${this.state.status}\nEnviando infoSistema...` });
        try {
            let arrayInfo = [];
            let inf = await this.props.realm.objects(TB_InfoSistema.name);
            if (inf.length > 0) {
                for (let i = 0; i < inf.length; i++) {
                    arrayInfo.push(inf[i])
                }
                const ppd = {
                    objetoNovo: JSON.stringify({
                        aplicativo: aplicativo,
                        versaoAplicativo: versao,
                        versaoBanco: versaoBanco,
                        usuario: this.props.usuario.login,
                        tabela: TB_InfoSistema.name,
                        valor: JSON.stringify(arrayInfo),
                    }),
                    dbName: this.props.infoSistema.dbName,
                };

                response = await Axios.post(`${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/inserir/`, JSON.stringify(ppd), headers);
                console.log(response.status)
                await this.setState({ status: `${this.state.status}\nBackup do infoSistema concluído...` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao enviar backup do infoSistema...` });
        }

        /** * Backup cheques*/
        /*  await this.setState({ status: `${this.state.status}\nEnviando cheques...` });
         try {
             let arrayCh = [];
             let cheq = await this.props.realm.objects(TB_Cheques.name);
             if (cheq.length > 0) {
                 for (let i = 0; i < cheq.length; i++) {
                     arrayCh.push(cheq[i])
                 }
                 const ppd = {
                     objetoNovo: JSON.stringify({
                         aplicativo: aplicativo,
                         versaoAplicativo: versao,
                         versaoBanco: versaoBanco,
                         usuario: this.props.usuario.login,
                         tabela: TB_InfoSistema.name,
                         valor: JSON.stringify(arrayCh),
                     }),
                     dbName: this.props.infoSistema.dbName,
                 };
 
                 response = await Axios.post(`${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/inserir/`, JSON.stringify(ppd), headers);
                 console.log(response.status)
                 await this.setState({ status: `${this.state.status}\nBackup do infoSistema concluído...` });
             }
         } catch (error) {
             console.log(error);
             await this.setState({ status: `${this.state.status}\nFalha ao enviar backup do(s) cheque(s)...` });
         }
  */

        /** * Backup clientes*/
        await this.setState({ status: `${this.state.status}\nEnviando clientes...` });
        try {
            let arrayCl = [];
            let cli = await this.props.realm.objects(TB_Clientes.name);
            if (cli.length > 0) {
                for (let i = 0; i < cli.length; i++) {
                    arrayCl.push(cli[i])
                }
                const ppd = {
                    objetoNovo: JSON.stringify({
                        aplicativo: aplicativo,
                        versaoAplicativo: versao,
                        versaoBanco: versaoBanco,
                        usuario: this.props.usuario.login,
                        tabela: TB_InfoSistema.name,
                        valor: JSON.stringify(arrayCl),
                    }),
                    dbName: this.props.infoSistema.dbName,
                };

                response = await Axios.post(`${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/inserir/`, JSON.stringify(ppd), headers);
                console.log(response.status)
                await this.setState({ status: `${this.state.status}\nBackup dos clientes concluído...` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao enviar backup do(s) cliente(s)...` });
        }



        /** * Backup impressoras*/
        await this.setState({ status: `${this.state.status}\nEnviando impressoras...` });
        try {
            let arrayPrinter = [];
            let print = await this.props.realm.objects(TB_ConfigPrint.name);
            if (print.length > 0) {
                for (let i = 0; i < print.length; i++) {
                    arrayPrinter.push(print[i])
                }
                console.log(arrayPrinter)
                const ppd = {
                    objetoNovo: JSON.stringify({
                        aplicativo: aplicativo,
                        versaoAplicativo: versao,
                        versaoBanco: versaoBanco,
                        usuario: this.props.usuario.login,
                        tabela: TB_ConfigPrint.name,
                        valor: JSON.stringify(arrayPrinter),
                    }),
                    dbName: this.props.infoSistema.dbName,
                };
                response = await Axios.post(`${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/inserir/`, JSON.stringify(ppd), headers);
                await this.setState({ status: `${this.state.status}\nBackup das impressoras concluído ...` });
            } else {
                await this.setState({ status: `${this.state.status}\nNenhuma impressora encontrada para backup...` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao enviar backup das impressoras...` });
        }



        /** * Backup contas a receber*/
        await this.setState({ status: `${this.state.status}\nEnviando contas a receber...` });
        try {
            let arrayContas = [];
            let cont = await this.props.realm.objects(TB_ContasAReceber.name);
            if (cont.length > 0) {
                for (let i = 0; i < cont.length; i++) {
                    arrayContas.push(cont[i])
                }
                const ppd = {
                    objetoNovo: JSON.stringify({
                        aplicativo: aplicativo,
                        versaoAplicativo: versao,
                        versaoBanco: versaoBanco,
                        usuario: this.props.usuario.login,
                        tabela: TB_ConfigPrint.name,
                        valor: JSON.stringify(arrayContas),
                    }),
                    dbName: this.props.infoSistema.dbName,
                };
                response = await Axios.post(`${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/inserir/`, JSON.stringify(ppd), headers);
                await this.setState({ status: `${this.state.status}\nBackup das contas a receber concluído ...` });
            } else {
                await this.setState({ status: `${this.state.status}\nNenhuma conta a receber encontrada para backup...` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao enviar backup das contas a receber...` });
        }



        /** * Backup estoque*/
        await this.setState({ status: `${this.state.status}\nEnviando estoque...` });
        try {
            let arrayEstoque = [];
            let est = await this.props.realm.objects(TB_Estoque.name);
            if (est.length > 0) {
                for (let i = 0; i < est.length; i++) {
                    arrayEstoque.push(est[i])
                }
                const ppd = {
                    objetoNovo: JSON.stringify({
                        aplicativo: aplicativo,
                        versaoAplicativo: versao,
                        versaoBanco: versaoBanco,
                        usuario: this.props.usuario.login,
                        tabela: TB_ConfigPrint.name,
                        valor: JSON.stringify(arrayEstoque),
                    }),
                    dbName: this.props.infoSistema.dbName,
                };
                response = await Axios.post(`${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/inserir/`, JSON.stringify(ppd), headers);
                await this.setState({ status: `${this.state.status}\nBackup do estoque concluído ...` });
            } else {
                await this.setState({ status: `${this.state.status}\nNenhum estoque encontrado para backup...` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao enviar backup do estoque...` });
        }



        /** * Backup formas de pagamento*/
        await this.setState({ status: `${this.state.status}\nEnviando formas pagamentos...` });
        try {
            let arrayPg = [];
            let pg = await this.props.realm.objects(TB_FormasPagamento.name);
            if (pg.length > 0) {
                for (let i = 0; i < pg.length; i++) {
                    arrayPg.push(pg[i])
                }
                const ppd = {
                    objetoNovo: JSON.stringify({
                        aplicativo: aplicativo,
                        versaoAplicativo: versao,
                        versaoBanco: versaoBanco,
                        usuario: this.props.usuario.login,
                        tabela: TB_ConfigPrint.name,
                        valor: JSON.stringify(arrayPg),
                    }),
                    dbName: this.props.infoSistema.dbName,
                };
                response = await Axios.post(`${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/inserir/`, JSON.stringify(ppd), headers);
                await this.setState({ status: `${this.state.status}\nBackup das formas de pagamento concluído ...` });
            } else {
                await this.setState({ status: `${this.state.status}\nNenhuma forma de pagamento encontrada para backup...` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao enviar backup das formas de pagamento...` });
        }



        /** * Backup operacao de caixa*/
        await this.setState({ status: `${this.state.status}\nEnviando operações do caixa...` });
        try {
            let arrayCx = [];
            let cx = await this.props.realm.objects(TB_OperacoesCaixa.name);
            if (cx.length > 0) {
                for (let i = 0; i < cx.length; i++) {
                    arrayCx.push(cx[i])
                }
                const ppd = {
                    objetoNovo: JSON.stringify({
                        aplicativo: aplicativo,
                        versaoAplicativo: versao,
                        versaoBanco: versaoBanco,
                        usuario: this.props.usuario.login,
                        tabela: TB_ConfigPrint.name,
                        valor: JSON.stringify(arrayCx),
                    }),
                    dbName: this.props.infoSistema.dbName,
                };
                response = await Axios.post(`${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/inserir/`, JSON.stringify(ppd), headers);
                await this.setState({ status: `${this.state.status}\nBackup das operações de caixa concluído ...` });
            } else {
                await this.setState({ status: `${this.state.status}\nNenhuma operação de caixa encontrada para backup...` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao enviar backup das operações de caixa...` });
        }



        /** * Backup planos financeiros*/
        await this.setState({ status: `${this.state.status}\nEnviando planos financeiros...` });
        try {
            let arrayPlanoFn = [];
            let plFinan = await this.props.realm.objects(TB_PlanoFinanceiro.name);
            if (plFinan.length > 0) {
                for (let i = 0; i < plFinan.length; i++) {
                    arrayPlanoFn.push(plFinan[i])
                }
                const ppd = {
                    objetoNovo: JSON.stringify({
                        aplicativo: aplicativo,
                        versaoAplicativo: versao,
                        versaoBanco: versaoBanco,
                        usuario: this.props.usuario.login,
                        tabela: TB_ConfigPrint.name,
                        valor: JSON.stringify(arrayPlanoFn),
                    }),
                    dbName: this.props.infoSistema.dbName,
                };
                response = await Axios.post(`${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/inserir/`, JSON.stringify(ppd), headers);
                await this.setState({ status: `${this.state.status}\nBackup dos planos financeiros concluído ...` });
            } else {
                await this.setState({ status: `${this.state.status}\nNenhum plano financeiro encontrado para backup...` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao enviar backup dos planos financeiros...` });
        }



        /** * Backup usuarios*/
        await this.setState({ status: `${this.state.status}\nEnviando usuários...` });
        try {
            let arrayUsuarios = [];
            let user = await this.props.realm.objects(TB_Usuarios.name);
            if (user.length > 0) {
                for (let i = 0; i < user.length; i++) {
                    arrayUsuarios.push(user[i])
                }
                const ppd = {
                    objetoNovo: JSON.stringify({
                        aplicativo: aplicativo,
                        versaoAplicativo: versao,
                        versaoBanco: versaoBanco,
                        usuario: this.props.usuario.login,
                        tabela: TB_Usuarios.name,
                        valor: JSON.stringify(arrayUsuarios),
                    }),
                    dbName: this.props.infoSistema.dbName,
                };
                response = await Axios.post(`${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/inserir/`, JSON.stringify(ppd), headers);
                await this.setState({ status: `${this.state.status}\nBackup dos usuários concluído...` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao enviar backup dos usuários...` });
        }


        /** * Backup vendas*/
        await this.setState({ status: `${this.state.status}\nEnviando vendas...` });
        try {
            let arrayVenda = [];
            let venda = await this.props.realm.objects(TB_Vendas.name);
            if (venda.length > 0) {
                for (let i = 0; i < venda.length; i++) {
                    arrayVenda.push(venda[i])
                }
                const ppd = {
                    objetoNovo: JSON.stringify({
                        aplicativo: aplicativo,
                        versaoAplicativo: versao,
                        versaoBanco: versaoBanco,
                        usuario: this.props.usuario.login,
                        tabela: TB_Usuarios.name,
                        valor: JSON.stringify(arrayVenda),
                    }),
                    dbName: this.props.infoSistema.dbName,
                };
                response = await Axios.post(`${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/inserir/`, JSON.stringify(ppd), headers);
                await this.setState({ status: `${this.state.status}\nBackup das vendas concluído...` });
            } else {
                await this.setState({ status: `${this.state.status}\nNenhuma venda encontrada para backup...` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao enviar backup das vendas...` });
        }


        /** * Backup caixas*/
        await this.setState({ status: `${this.state.status}\nEnviando caixas...` });
        try {
            let arrayCaixa = [];
            let caixa = await this.props.realm.objects(TB_Caixa.name);
            if (caixa.length > 0) {
                for (let i = 0; i < caixa.length; i++) {
                    arrayCaixa.push(caixa[i])
                }
                const ppd = {
                    objetoNovo: JSON.stringify({
                        aplicativo: aplicativo,
                        versaoAplicativo: versao,
                        versaoBanco: versaoBanco,
                        usuario: this.props.usuario.login,
                        tabela: TB_Usuarios.name,
                        valor: JSON.stringify(arrayCaixa),
                    }),
                    dbName: this.props.infoSistema.dbName,
                };
                response = await Axios.post(`${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/inserir/`, JSON.stringify(ppd), headers);
                await this.setState({ status: `${this.state.status}\nBackup dos caixas concluído...` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao enviar backup dos caixas...` });
        }


        /** * Backup centros de custo*/
        await this.setState({ status: `${this.state.status}\nEnviando centros de custo...` });
        try {
            let arrayCusto = [];
            let custo = await this.props.realm.objects(TB_CentroCusto.name);
            if (custo.length > 0) {
                for (let i = 0; i < custo.length; i++) {
                    arrayCusto.push(custo[i])
                }
                const ppd = {
                    objetoNovo: JSON.stringify({
                        aplicativo: aplicativo,
                        versaoAplicativo: versao,
                        versaoBanco: versaoBanco,
                        usuario: this.props.usuario.login,
                        tabela: TB_Usuarios.name,
                        valor: JSON.stringify(arrayCusto),
                    }),
                    dbName: this.props.infoSistema.dbName,
                };
                response = await Axios.post(`${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/inserir/`, JSON.stringify(ppd), headers);
                await this.setState({ status: `${this.state.status}\nBackup dos centros de custo concluído...` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao enviar backup dos centros de custo...` });
        }
        await this.setState({ status: `${this.state.status}\nBackup do aplicativo finalizado!` });


        this.setState({ loadingBackup: false });

    }



    async restore() {

        let aplicativo = 'Dual PDV';
        let versao = new GravarErro().versao;
        let versaoBanco = this.props.realm.schemaVersion;


        this.setState({ loadingRestore: true });
        await this.setState({ status: '' });
        await this.setState({ status: `${this.state.status}\nRecuperando infoSistema ...` });
        try {
            let response = await Axios.get(
                `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_InfoSistema.name}`, headers
            );
            if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                // let valorServer = await JSON.parse(response.data.valor);
                console.log( JSON.parse(response.data.valor))
                let inf = await this.props.realm.objects(TB_InfoSistema.name);
                await this.props.realm.write(() => {
                    this.props.realm.delete(inf);
                    JSON.parse(response.data.valor).forEach(v =>
                        this.props.realm.create(TB_InfoSistema.name, JSON.parse(JSON.stringify(v)))
                    );
                });
                await this.setState({ status: `${this.state.status}\nRecuperação do infoSistema concluído!` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao recuperar infoSistema...` });
        }


        /* 
                await this.setState({ status: `${this.state.status}\nRecuperando cheques ...` });
                try {
                    let response = await Axios.get(
                        `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_Cheques.name}`, headers
                    );
                    if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                        let vl = await JSON.parse(response.data.valor);
        
                        let ch = await this.props.realm.objects(TB_Cheques.name);
                        await this.props.realm.write(() => {
                            this.props.realm.delete(ch);
                            for (let value of vl) {
                                this.props.realm.create(TB_Cheques.name, JSON.parse(JSON.stringify(value)))
                            }
                        });
                        await this.setState({ status: `${this.state.status}\nRecuperação dos cheques concluído!` });
                    }
                } catch (error) {
                    console.log(error);
                    await this.setState({ status: `${this.state.status}\nFalha ao recuperar cheques...` });
                } */


        await this.setState({ status: `${this.state.status}\nRecuperando clientes ...` });
        try {
            let response = await Axios.get(
                `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_Clientes.name}`, headers
            );

            if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                let cl = await JSON.parse(response.data.valor);

                let cli = await this.props.realm.objects(TB_Clientes.name);
                await this.props.realm.write(() => {
                    this.props.realm.delete(cli);
                    for (let value of cl) {
                        this.props.realm.create(TB_Clientes.name, JSON.parse(JSON.stringify(value)))
                    }
                });
                await this.setState({ status: `${this.state.status}\nRecuperação dos clientes concluído!` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao recuperar clientes...` });
        }


        //Recupera tabela impressoras.
        await this.setState({ status: `${this.state.status}\nRecuperando impressoras ...` });
        try {
            let response = await Axios.get(
                `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_ConfigPrint.name}`, headers
            );
            if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                // let valor = await JSON.parse(response.data.valor)
                let print = await this.props.realm.objects(TB_ConfigPrint.name);
                await this.props.realm.write(() => {
                    this.props.realm.delete(print);
                    JSON.parse(response.data.valor).forEach(v =>
                        this.props.realm.create(TB_ConfigPrint.name, JSON.parse(JSON.stringify(v)))
                    );
                });
                await this.setState({ status: `${this.state.status}\nRecuperação de impressoras concluída!` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao recuperar impressoras...` });
        }



        await this.setState({ status: `${this.state.status}\nRecuperando contas a receber...` });
        try {
            let response = await Axios.get(
                `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_ContasAReceber.name}`, headers
            );
            if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                let valor = await JSON.parse(response.data.valor)
                let cont = await this.props.realm.objects(TB_ContasAReceber.name);
                await this.props.realm.write(() => {
                    this.props.realm.delete(cont);
                    for (let value of valor) {
                        this.props.realm.create(TB_ContasAReceber.name, JSON.parse(JSON.stringify(value)))
                    }
                });
                await this.setState({ status: `${this.state.status}\nRecuperação das contas a receber concluída!` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao recuperar contas a receber...` });
        }



        await this.setState({ status: `${this.state.status}\nRecuperando estoque ...` });
        try {
            let response = await Axios.get(
                `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_Estoque.name}`, headers
            );
            if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                let valor = await JSON.parse(response.data.valor);
                let est = await this.props.realm.objects(TB_Estoque.name);
                await this.props.realm.write(() => {
                    this.props.realm.delete(est);
                    for (let value of valor) {
                        this.props.realm.create(TB_Estoque.name, JSON.parse(JSON.stringify(value)))
                    }
                });
                await this.setState({ status: `${this.state.status}\nRecuperação do estoque concluída!` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao recuperar estoque...` });
        }




        await this.setState({ status: `${this.state.status}\nRecuperando formas de pagamento ...` });
        try {
            let response = await Axios.get(
                `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_FormasPagamento.name}`, headers
            );
            if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                let valor = await JSON.parse(response.data.valor)
                let pg = await this.props.realm.objects(TB_FormasPagamento.name);
                await this.props.realm.write(() => {
                    this.props.realm.delete(pg);
                    for (let value of valor) {
                        this.props.realm.create(TB_FormasPagamento.name, JSON.parse(JSON.stringify(value)))
                    }
                });
                await this.setState({ status: `${this.state.status}\nRecuperação das formas de pagamento concluída!` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao recuperar formas de pagamento ...` });
        }




        await this.setState({ status: `${this.state.status}\nRecuperando municipios ...` });
        try {
            let response = await Axios.get(
                `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_Municipios.name}`, headers
            );
            if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                let valor = await JSON.parse(response.data.valor)
                let mun = await this.props.realm.objects(TB_Municipios.name);
                await this.props.realm.write(() => {
                    this.props.realm.delete(mun);
                    for (let value of valor) {
                        this.props.realm.create(TB_Municipios.name, JSON.parse(JSON.stringify(value)))
                    }
                });
                await this.setState({ status: `${this.state.status}\nRecuperação dos municípios concluída!` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao recuperar municípios...` });
        }



        await this.setState({ status: `${this.state.status}\nRecuperando  operações caixa ...` });
        try {
            let response = await Axios.get(
                `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_OperacoesCaixa.name}`, headers
            );
            if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                let valor = await JSON.parse(response.data.valor)
                let op = await this.props.realm.objects(TB_OperacoesCaixa.name);
                await this.props.realm.write(() => {
                    this.props.realm.delete(op);
                    for (let value of valor) {
                        this.props.realm.create(TB_OperacoesCaixa.name, JSON.parse(JSON.stringify(value)))
                    }
                });
                await this.setState({ status: `${this.state.status}\nRecuperação das operações de caixa concluída!` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao recuperar operações de caixa...` });
        }



        await this.setState({ status: `${this.state.status}\nRecuperando planos financeiros ...` });
        try {
            let response = await Axios.get(
                `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_PlanoFinanceiro.name}`, headers
            );
            if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                let valor = await JSON.parse(response.data.valor)
                let pl = await this.props.realm.objects(TB_PlanoFinanceiro.name);
                await this.props.realm.write(() => {
                    this.props.realm.delete(pl);
                    for (let value of valor) {
                        this.props.realm.create(TB_PlanoFinanceiro.name, JSON.parse(JSON.stringify(value)))
                    }
                });
                await this.setState({ status: `${this.state.status}\nRecuperação dos planos financeiros concluída!` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao recuperar planos financeiros...` });
        }


        await this.setState({ status: `${this.state.status}\nRecuperando centros de custo ...` });
        try {
            let response = await Axios.get(
                `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_CentroCusto.name}`, headers
            );
            if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                let valor = await JSON.parse(response.data.valor)
                let cc = await this.props.realm.objects(TB_CentroCusto.name);
                await this.props.realm.write(() => {
                    this.props.realm.delete(cc);
                    for (let value of valor) {
                        this.props.realm.create(TB_CentroCusto.name, JSON.parse(JSON.stringify(value)))
                    }
                });
                await this.setState({ status: `${this.state.status}\nRecuperação dos centros de custo concluída!` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao recuperar dos centros de custo...` });
        }



        //Recupera tabela usuários.
        await this.setState({ status: `${this.state.status}\nRecuperando usuários ...` });
        try {
            let response = await Axios.get(
                `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_Usuarios.name}`, headers
            );
            if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                let valor = await JSON.parse(response.data.valor)
                let user = await this.props.realm.objects(TB_Usuarios.name);
                await this.props.realm.write(() => {
                    this.props.realm.delete(user);
                    for (let value of valor) {
                        this.props.realm.create(TB_Usuarios.name, JSON.parse(JSON.stringify(value)))
                    }
                });
                await this.setState({ status: `${this.state.status}\nRecuperação de usuários concluída!` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao recuperar usuários...` });
        }



        await this.setState({ status: `${this.state.status}\nRecuperando vendas ...` });
        try {
            let response = await Axios.get(
                `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_Vendas.name}`, headers
            );
            if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                let valor = await JSON.parse(response.data.valor)
                let vd = await this.props.realm.objects(TB_Vendas.name);
                await this.props.realm.write(() => {
                    this.props.realm.delete(vd);
                    for (let value of valor) {
                        this.props.realm.create(TB_Vendas.name, JSON.parse(JSON.stringify(value)))
                    }
                });
                await this.setState({ status: `${this.state.status}\nRecuperação das vendas concluída!` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao recuperar vendas...` });
        }




        await this.setState({ status: `${this.state.status}\nRecuperando caixas ...` });
        try {
            let response = await Axios.get(
                `${this.props.infoSistema.hostServidor}seguranca/backupAplicativos/getBackup/${this.props.infoSistema.dbName}/${aplicativo}/${versao}/${versaoBanco}/${this.props.usuario.login}/${TB_Caixa.name}`, headers
            );
            if (response.status == 200 && response.data && Array.isArray(JSON.parse(response.data.valor))) {
                let valor = await JSON.parse(response.data.valor)
                let cx = await this.props.realm.objects(TB_Caixa.name);
                await this.props.realm.write(() => {
                    this.props.realm.delete(cx);
                    for (let value of valor) {
                        this.props.realm.create(TB_Caixa.name, JSON.parse(JSON.stringify(value)))
                    }
                });
                await this.setState({ status: `${this.state.status}\nRecuperação dos caixas concluída!` });
            }
        } catch (error) {
            console.log(error);
            await this.setState({ status: `${this.state.status}\nFalha ao recuperar caixas...` });
        }

        this.setState({ loadingRestore: false });
    }



    render() {
        const { height: DEVICE_HEIGHT } = Dimensions.get('window');
        if (this.state.isVisible == true) {
            return (
                DEVICE_HEIGHT > 1100 ?
                    <SkeletonPlaceholder highlightColor='#002269' backgroundColor='#d7d6e5'>
                        <SkeletonPlaceholder.Item marginTop={'8%'} width={'85%'} height={176} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={'12%'} width={'85%'} height={176} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={'12%'} width={'855%'} height={176} borderRadius={4} alignSelf={'center'} />
                    </SkeletonPlaceholder>
                    :
                    <SkeletonPlaceholder highlightColor='#002269' backgroundColor='#d7d6e5'>
                        <SkeletonPlaceholder.Item marginTop={'8%'} width={'55%'} height={146} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={'12%'} width={'55%'} height={146} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={'12%'} width={'55%'} height={146} borderRadius={4} alignSelf={'center'} />

                    </SkeletonPlaceholder>
            )
        } else {
            return (
                <View style={[styleMain.viewMain, { alignItems: 'center' }]}>
                    <StatusBar
                        hidden={false}
                        backgroundColor='#1e1e46' />
                    <ScrollView>
                        <Spinner
                            visible={this.state.loadingPrint}
                            // textContent={`...`}
                            textStyle={{ fontFamily: 'Montserrat-Regular', fontSize: RFPercentage(2.9) }}
                            customIndicator={<Wave size={Dimensions.get("screen").width * 2 / 11} color='#06686c' />}
                        />
                        {/*  <Spinner
                            visible={this.state.loadingRestore}
                            textContent={`Restaurando dados...`}
                            textStyle={{ fontFamily: 'Montserrat-Regular', fontSize: RFPercentage(2.9) }}
                            customIndicator={<Wave size={Dimensions.get("screen").width * 2 / 11} color='#06686c' />}
                        />
                         <Spinner
                            visible={this.state.loadingBackup}
                            textContent={`Enviando dados...`}
                            textStyle={{ fontFamily: 'Montserrat-Regular', fontSize: RFPercentage(2.9) }}
                            customIndicator={<Wave size={Dimensions.get("screen").width * 2 / 11} color='#06686c' />}
                        /> */}
                        <TouchableRipple
                            onPress={() => {
                                actionSheetRef.current?.setModalVisible();
                                // sheetRef.current.snapTo(0)
                            }}
                            rippleColor="rgba(0, 0, 0, .32)"
                        >
                            <View style={[style.viewDetailHorizontal, { marginTop: '12%' }]}>
                                <View style={styleGlobal.buttonStock}>
                                    <Avatar
                                        size={'large'}
                                        rounded
                                        icon={{ name: 'printer-search', type: 'material-community', color: '#1e1e46' }}
                                        activeOpacity={0.7}
                                        containerStyle={{ borderWidth: 0, borderColor: '#16273f' }}
                                    />
                                    <Text>Impressora</Text>
                                </View>
                            </View>
                        </TouchableRipple>

                        <TouchableRipple
                            onPress={() => {
                                actionSheetRef_2.current?.setModalVisible();
                            }}
                            rippleColor="rgba(0, 0, 0, .32)"
                        >
                            <View style={[style.viewDetailHorizontal, { marginTop: '12%' }]}>
                                <View style={styleGlobal.buttonStock}>
                                    <Avatar
                                        size={'large'}
                                        rounded
                                        icon={{ name: 'cloud-upload', type: 'material-community', color: '#1e1e46' }}
                                        activeOpacity={0.7}
                                        containerStyle={{ borderWidth: 0, borderColor: '#16273f' }}
                                    />
                                    <Text>Backup</Text>
                                </View>
                            </View>
                        </TouchableRipple>

                        <TouchableRipple
                            onPress={() => {
                                actionSheetRef_3.current?.setModalVisible();
                            }}
                            rippleColor="rgba(0, 0, 0, .32)"
                        >
                            <View style={[style.viewDetailHorizontal, { marginTop: '12%' }]}>
                                <View style={styleGlobal.buttonStock}>
                                    <Avatar
                                        size={'large'}
                                        rounded
                                        icon={{ name: 'cloud-download', type: 'material-community', color: '#1e1e46' }}
                                        activeOpacity={0.7}
                                        containerStyle={{ borderWidth: 0, borderColor: '#16273f' }}
                                    />
                                    <Text>Restore</Text>
                                </View>
                            </View>
                        </TouchableRipple>
                    </ScrollView >

                    {/**DEFINE IMPRESSORA PAREADA */}
                    <ActionSheet ref={actionSheetRef} containerStyle={{ backgroundColor: 'white' }}>
                        <View style={{ minHeight: 300 }}>
                            <View style={styleGlobal.viewTopLimit}>
                                <IconButton
                                    icon="printer"
                                    color={'#ffd700'}
                                    // size={Dimensions.get("screen").width * 2 / 32}
                                    style={{ borderWidth: 0.3, alignSelf: 'center' }}
                                />
                                <Text style={[styleGlobal.titleDetail, { borderBottomWidth: 0, alignSelf: 'center' }]}>{'Impressora'}</Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <RNPickerSelect
                                    placeholder={{
                                        label: 'Selecione a impressora',
                                        value: null,
                                    }}
                                    items={this.state.dispositivos}
                                    value={this.state.print}
                                    onValueChange={value => {
                                        this.setState({ print: value });
                                    }}
                                    style={pickerSelectStylesCloseSale}
                                    useNativeAndroidPickerStyle={true}
                                />
                            </View>

                            <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: '4%' }}>
                                <Button
                                    style={{ width: '58%', alignSelf: 'center', borderWidth: 3 }}
                                    icon="check-all" mode="outlined"
                                    color='#1e1e46'
                                    loading={this.state.loadingPrint}
                                    loadingProps={{ size: "large", color: '#16273f' }}
                                    onPress={() => {
                                        if (!this.state.loadingPrint) {
                                            this.salvarImpressora();
                                        }
                                    }} >
                                    Salvar
                                </Button>
                            </View>
                        </View>
                    </ActionSheet>

                    {/**BACKUP TABELAS */}
                    <ActionSheet ref={actionSheetRef_2} containerStyle={{ backgroundColor: 'white' }}>
                        <View style={{ minHeight: 400 }}>
                            <View style={styleGlobal.viewTopLimit}>
                                <IconButton
                                    icon="cloud-upload-outline"
                                    color={'#06686c'}
                                    // size={Dimensions.get("screen").width * 2 / 32}
                                    style={{ borderWidth: 0.3, alignSelf: 'center' }}
                                />
                                <Text style={[styleGlobal.titleDetail, { borderBottomWidth: 0, alignSelf: 'center' }]}>{'Backup'}</Text>
                            </View>

                            <ScrollView style={{ flex: 6, marginRight: 12, marginLeft: 12 }}><Text style={styleGlobal.titleSyn}>{this.state.status}</Text></ScrollView>


                            <View style={{ marginBottom: '3%' }}>
                                <Button
                                    style={{ width: '58%', alignSelf: 'center', borderWidth: 3 }}
                                    icon="check-all" mode="outlined"
                                    color='#1e1e46'
                                    loading={this.state.loadingBackup}
                                    loadingProps={{ size: "large", color: '#16273f' }}
                                    onPress={() => {
                                        if (!this.state.loadingBackup) {
                                            this.backup();
                                        }
                                    }} >
                                    Salvar
                                </Button>
                            </View>
                        </View>
                    </ActionSheet>

                    {/**RESTAURA TABELAS */}
                    <ActionSheet ref={actionSheetRef_3} containerStyle={{ backgroundColor: 'white' }}>
                        <View style={{ minHeight: 400 }}>
                            <View style={styleGlobal.viewTopLimit}>
                                <IconButton
                                    icon="cloud-download-outline"
                                    color={'#06686c'}
                                    // size={Dimensions.get("screen").width * 2 / 32}
                                    style={{ borderWidth: 0.3, alignSelf: 'center' }}
                                />
                                <Text style={[styleGlobal.titleDetail, { borderBottomWidth: 0, alignSelf: 'center' }]}>{'Restore'}</Text>
                            </View>


                            <View style={{ flex: 1 }}>
                                <Snackbar
                                    visible={this.state.visible}
                                    onDismiss={() => {
                                        // this.setState({ visible: false })
                                    }}
                                    action={{
                                        label: 'OK',
                                        onPress: () => {
                                            //  this.setState({ visible: false })
                                        },
                                    }}>
                                    Restauração concluída!
                                </Snackbar>

                                <ScrollView style={{ flex: 4, marginRight: 12, marginLeft: 12 }}><Text style={styleGlobal.titleSyn}>{this.state.status}</Text></ScrollView>

                                <View style={{ alignItems: 'flex-end', marginBottom: '3%' }}>
                                    {/*   <Button
                                            style={{ width: '68%', alignSelf: 'center' }}
                                            icon="check-all" mode="contained"
                                            color='#2b2b2b'
                                            loading={this.state.loadingPrint}
                                            loadingProps={{ size: "large", color: '#16273f' }}
                                            onPress={() => {
                                                //  this.restore();
                                            }} >
                                            Restaurar
                                        </Button> */}
                                    <Button
                                        style={{ width: '58%', alignSelf: 'center', borderWidth: 3 }}
                                        icon="check-all" mode="outlined"
                                        color='#1e1e46'
                                        loading={this.state.loadingRestore}
                                        loadingProps={{ size: "large", color: '#16273f' }}
                                        onPress={() => {
                                            if (!this.state.loadingRestore) {
                                                this.restore();
                                            }
                                        }} >
                                        Salvar
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </ActionSheet>
                </View >
            )
        }
    }
}

const mapStateToProps = (state) => ({
    usuario: state.userReducer.usuario,
    realm: state.registerReducer.realm,
    caixa: state.pdvReducer.caixa,
    print: state.configReducer.print,
    caixaAberto: state.pdvReducer.caixaAberto,
    infoSistema: state.registerReducer.infoSistema,
    unidade: state.userReducer.unidade,
    configComercial: state.configReducer.configComercial,
    loadingCloseSale: state.salesReducer.loadingCloseSale,
    sacola: state.salesReducer.sacola,
    pedido: state.salesReducer.pedido,
    total: state.salesReducer.total,
    subtotal: state.salesReducer.subtotal,
    desconto: state.salesReducer.desconto,
    totalItensSacola: state.salesReducer.totalItensSacola,
    subtotalSemPerdas: state.salesReducer.subtotalSemPerdas,
    totalDescontoPerdas: state.salesReducer.totalDescontoPerdas,
    isVendaDireta: state.salesReducer.isVendaDireta,
    recebimentos: state.salesReducer.recebimentos,
    totalRecebimentos: state.salesReducer.totalRecebimentos,
    cliente: state.salesReducer.cliente,
})

export default connect(mapStateToProps, {
    setPrint,
    setLoadingCloseSale,
    limpar,
    setClient,
    addFormaPagamento,
    delFormaPagamento,
    setLoadingStore,
    setLoadingAdd,
    addSacola,
    delItemSacola,
    setIsVendaDireta,
    calcularTotaisSacola,
    limparSacola,
    limparRecebimentos,
    calcularTotalRecebimentos,
    setDesconto
})(formConfig);