import React, { createRef } from 'react';
import { ScrollView, View, Image, Platform, BackHandler, Alert, Dimensions, StatusBar } from 'react-native';
import { Icon } from 'react-native-elements';
import { connect } from 'react-redux';
import GravarErro from '../necessary/errorServer';
import { Text, Appbar, Paragraph, Dialog, Button, IconButton, Modal, Portal } from 'react-native-paper';
import { showMessage, hideMessage } from "react-native-flash-message";
import styleMain from '../necessary/style/styleMain';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { formatDateToAAAAMMDD, getHoraAtual } from '../necessary/dateAndHour/dateHour';
import { TB_Usuarios } from '../database/DBTables';
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import Spinner from 'react-native-loading-spinner-overlay';
import { Plane, Circle, Wave } from 'react-native-animated-spinkit';
import styleGlobal from '../necessary/style/styleGlobal';
import {
    setLoadingTotal,
    setLoadingParcial,
} from '../actions/mainAction';
import { TB_Clientes, TB_Pedidos, TB_ContasAReceber, TB_Estoque, TB_ConfigComercial, TB_CentroCusto, TB_FormasPagamento, TB_PlanoFinanceiro, TB_Municipios, TB_Caixa, TB_Vendas } from '../database/DBTables';
import {
    headers
} from '../config/security';
import Axios from 'axios';
import Base64 from '../necessary/base64';
import { setConfigComercial } from '../actions/configAction';
import { setCaixa, setCaixaAberto, setLoading, } from '../actions/pdvAction';
import ActionSheet from "react-native-actions-sheet";
import style from '../necessary/style/styleLogin';
import { MaskService, TextInputMask } from 'react-native-masked-text';
import Toast from 'react-native-tiny-toast';


const { height: DEVICE_HEIGHT } = Dimensions.get('window');


const actionSheetRef = createRef();

class formMain extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            visible: true,
            open: false,
            saldoDinheiro: 0.0,
            saldoCheque: 0.0,
        }

        this.syncTotal();
        this.syncParcial();

        this._didFocusSubscription = props.navigation.addListener(
            'didFocus',
            payload =>
                BackHandler.addEventListener(
                    'hardwareBackPress',
                    this.onBackButtonPressAndroid,
                ),
        );
    }

    componentDidMount() {
        this._willBlurSubscription = this.props.navigation.addListener(
            'willBlur',
            payload =>
                BackHandler.removeEventListener(
                    'hardwareBackPress',
                    this.onBackButtonPressAndroid,
                ),
        );
        setTimeout(() => this.setState({ visible: !this.state.visible }), 2500);
        showMessage({
            message: "Atenção...", description: 'Realize a sincronização para manter o app atualizado.', type: 'info', icon: 'info', duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
        });
    }

    onBackButtonPressAndroid = () => {
        return true;
    };

    componentWillUnmount() {
        this._didFocusSubscription /* && this._didFocusSubscription.remove() */;
        this._willBlurSubscription /* && this._willBlurSubscription.remove() */;
    }


    async sair() {
        let users = await this.props.realm.objects(TB_Usuarios.name);
        await this.props.realm.write(() => {
            this.props.realm.delete(users);
        });
        this.props.navigation.navigate('login');
    }



    async verificaSeCaixaAberto() {
        this.props.setCaixaAberto(false);
        this.props.setCaixa(null);
        let sizeCaixa = this.props.realm.objects(TB_Caixa.name).length;
        let caixaTB = this.props.realm.objects(TB_Caixa.name);

        if (sizeCaixa > 0) {
            for (let i = 0; i < caixaTB.length; i++) {
                let c = await JSON.parse(caixaTB[i].json);
                if (String(c.aberto) === 'true') {
                    this.props.setCaixa(c);
                    this.props.setCaixaAberto(true);
                    break;
                }
            }
        }
    }


    async abrirCaixa() {
        let caixa = null;
        let response = null;

        try {
            this.props.setLoading(true);
            response = await Axios.get(`${this.props.infoSistema.hostServidor}financeiro/caixa/getCaixaByUsuario_DadosBasicos/${this.props.infoSistema.dbName}/${this.props.usuario.login}/${this.props.unidade.unidade}`, headers);

            if (response.status == 200 && response.data && response.data.id > 0) {
                caixa = JSON.parse(JSON.stringify(response.data));
                response = await Axios.get(`${this.props.infoSistema.hostServidor}financeiro/caixa/getCaixa/${this.props.infoSistema.dbName}/${caixa.idMovimentacaoCaixa}/${this.props.unidade.unidade}`, headers);

                if (response.status == 200 && response.data && response.data.id > 0) {
                    caixa = await JSON.parse(JSON.stringify(response.data));
                } else {
                    if (!caixa.lancamentos) {
                        caixa.lancamentos = [];
                    }
                }

                await this.props.realm.write(() => {
                    this.props.realm.create(
                        TB_Caixa.name, {
                        id: parseInt(caixa.idMovimentacaoCaixa),
                        json: JSON.stringify(caixa),
                        sincronizado: false,
                    }, true);
                });

                await this.verificaSeCaixaAberto();

                if (this.props.caixaAberto == true) {
                    this.props.setLoading(false);
                    Alert.alert('Atenção!', `Essa unidade já tem o caixa nº ${this.props.caixa.idMovimentacaoCaixa} em aberto.:\n\n Faça uma sincronização no botão "Sincronizar".`)
                    actionSheetRef.current?.hide();
                } else {
                    let cx = {
                        und: this.props.unidade.unidade,
                        usuarioAbertura: this.props.usuario.login,
                        dataAbertura: formatDateToAAAAMMDD(new Date()),
                        horaAbertura: getHoraAtual(),
                        saldoInicial: parseFloat(this.state.saldoDinheiro + this.state.saldoCheque).toFixed(2),
                        saldoInicialDinheiro: parseFloat(this.state.saldoDinheiro).toFixed(2),
                        saldoInicialCheque: parseFloat(this.state.saldoCheque).toFixed(2),
                        dataReferencia: formatDateToAAAAMMDD(new Date()),
                        aberto: true,
                        fechado: false,
                    }
                    const ppd = {
                        dbName: this.props.infoSistema.dbName,
                        objetoNovo: JSON.stringify(cx),
                        und: this.props.unidade.unidade,
                        usuario: this.props.usuario.login,
                        usuarioPC: Platform.OS,
                        nomePC: Platform.OS,
                        sistemaOperacionalPC: `${Platform.OS} ${Platform.Version}`,
                        nomeJanela: 'Abrir Caixa'
                    }

                    response = await Axios.post(`${this.props.infoSistema.hostServidor}financeiro/caixa/abrirCaixa`, JSON.stringify(ppd), headers);
                    if (response.status == 200 && response.data) {
                        let cxc = await JSON.parse(JSON.stringify(response.data));
                        this.props.realm.write(() => {
                            this.props.realm.create(TB_Caixa.name,
                                {
                                    id: parseInt(cxc.idMovimentacaoCaixa),
                                    json: JSON.stringify(cxc),
                                    sincronizado: false
                                })
                        })
                        this.props.setCaixa(cxc);
                        this.props.setCaixaAberto(true);
                        Toast.showSuccess(`Caixa aberto com sucesso`, {
                            position: Toast.position.CENTER,
                            containerStyle: {
                                backgroundColor: 'green',
                                borderRadius: 15,
                            },
                            textStyle: {
                                color: '#fff',
                            },
                            imgStyle: {},
                            mask: false,
                            maskStyle: {},
                            duration: 5000,
                            animation: true,
                        });
                        Alert.alert('Confirmação!', `Caixa aberto com sucesso!\n\nCód.: ${cxc.idMovimentacaoCaixa}`)
                    } else {
                        Alert.alert('Ops!', 'Falha ao abrir o caixa, entre em contato com nosso suporte e informe o cód.: ' + response.status + ' ao abrir o caixa.');
                    }
                }
            }
        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                actionSheetRef.current?.hide();
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
                this.props.setLoading(false);
            } else {
                actionSheetRef.current?.hide();
                showMessage({
                    message: "Falha!", description: 'Falha ao abrir caixa.', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
        }
        this.props.setLoading(false);
        actionSheetRef.current?.hide();
    }


    async syncParcial() {
        let caixa = null;
        let hostServer = null;
        let nomeJanela = '';
        let response = null;
        let atualizados = 0;
        let enviados = 0;
        let sincronizado = false;

        try {
            //this.props.setLoadingParcial(true);
            this.props.setLoadingTotal(true);
            let sizeCaixa = this.props.realm.objects(TB_Caixa.name).length;
            let caixaTB = this.props.realm.objects(TB_Caixa.name);
            if (sizeCaixa > 0) {
                for (let i = 0; i < caixaTB.length; i++) {
                    let c = await JSON.parse(caixaTB[i].json);
                    if (String(c.aberto) === 'true') {
                        console.log(c.aberto)
                        caixa = c;
                        this.props.setCaixa(c);
                        this.props.setCaixaAberto(true);
                        break;
                    }
                }
            }

            /**  ENVIA TRANSAÇÕES NAO ENVIADAS */
            if (caixa && caixa.lancamentos) {

                for (let indexCaixa = 0; indexCaixa < caixa.lancamentos.length; indexCaixa++) {
                    let v = await JSON.parse(JSON.stringify(caixa.lancamentos[indexCaixa]));
                    if (v && Number(v.id) === 0) {
                        if (v.opcaoUsada == 'RECEITAS_DESPESAS') {
                            hostServer = `${this.props.infoSistema.hostServidor}financeiro/caixa/lancarReceitasDespesas`;
                            nomeJanela = `Receitas/Despesas`;
                        } else if (v.opcaoUsada == 'PAGAR_CONTA') {
                            hostServer = `${this.props.infoSistema.hostServidor}financeiro/caixa/pagarContas`;
                            nomeJanela = `Pagar contas`;
                        } else if (v.opcaoUsada == 'RECEBER_CONTAS') {
                            hostServer = `${this.props.infoSistema.hostServidor}financeiro/caixa/receberContas`;
                            nomeJanela = `Receber contas`;
                        } else if (v.opcaoUsada == 'OPERACOES_COFRE') {
                            hostServer = `${this.props.infoSistema.hostServidor}financeiro/caixa/operacoesCofre`;
                            nomeJanela = `Operacoes no cofre`;
                        } else if (v.opcaoUsada == 'DEVOLUCAO_CHEQUES') {
                            hostServer = `${this.props.infoSistema.hostServidor}financeiro/caixa/devolverCheque`;
                            nomeJanela = `Devolução de cheques`;
                        } else if (v.opcaoUsada == 'OPERACOES_BANCARIAS') {
                            hostServer = `${this.props.infoSistema.hostServidor}financeiro/caixa/operacoesBancarias`;
                            nomeJanela = `Operações bancárias`;
                        } else if (v.opcaoUsada == 'MOVIMENTO_CHEQUE') {
                            hostServer = `${this.props.infoSistema.hostServidor}financeiro/caixa/movimentarCheque`;
                            nomeJanela = `Movimentação de cheques`;
                        } else if (v.opcaoUsada == 'ADIANTAMENTO_INTEGRADOS') {
                            hostServer = `${this.props.infoSistema.hostServidor}financeiro/caixa/adiantamentoIntegrado`;
                            nomeJanela = `Adiantamento a integrado`;
                        } else if (v.opcaoUsada == 'VENDAS') {
                            hostServer = `${this.props.infoSistema.hostServidor}financeiro/caixa/`;
                            nomeJanela = 'Vendas';
                        } else if (v.opcaoUsada == 'FECHAR_CAIXA') {
                            hostServer = `${this.props.infoSistema.hostServidor}financeiro/caixa/fecharCaixa`;
                            nomeJanela = `Fechar caixa`;
                        } else if (v.opcaoUsada == 'CREDITAR_VALOR_CLIENTE') {
                            hostServer = `${this.props.infoSistema.hostServidor}financeiro/caixa/`;
                            nomeJanela = `Lançar crédito a um cliente`;
                        } else if (v.opcaoUsada == 'TRANSFERIR_CREDITO_ENTRE_CLIENTES') {
                            hostServer = `${this.props.infoSistema.hostServidor}financeiro/caixa/`;
                            nomeJanela = `Transferir crédito entre cliente`;
                        } else if (v.opcaoUsada == 'IMPORTAR_BOLETOS') {
                            hostServer = `${this.props.infoSistema.hostServidor}financeiro/caixa/baixarBoletoBancario`;
                            nomeJanela = `Importar boletos bancários`;
                        }

                        const ppd = {
                            dbName: this.props.infoSistema.dbName,
                            objetoNovo: JSON.stringify(v),
                            und: this.props.unidade.unidade,
                            usuario: this.props.usuario.login,
                            usuarioPC: Platform.OS,
                            nomePC: Platform.OS,
                            sistemaOperacionalPC: `${Platform.OS} ${Platform.Version}`,
                            nomeJanela: nomeJanela,
                        };


                        /**Verifica se os dados foram enviados, caso sim atualiza do contrário envia */
                        if (v.token) {
                            response = await Axios.get(`${this.props.infoSistema.hostServidor}financeiro/caixa/getByToken/${this.props.infoSistema.dbName}/${v.token}/${v.opcaoUsada}`, headers)
                            if (response.status == 200 && response.data != null) {
                                v = response.data;
                            } else {
                                response = await Axios.post(hostServer, JSON.stringify(ppd), headers);
                                if (response.status == 200 && response.data != null) {
                                    v = response.data;
                                    atualizados++;
                                }
                            }
                        } else {
                            if (!String(hostServer).endsWith('caixa/')) {
                                response = await Axios.post(hostServer, JSON.stringify(ppd), headers);
                                if (response.status == 200 && response.data != null) {
                                    v = response.data;
                                    enviados++;
                                }
                            }
                        }
                    }
                }
            }

            /**VENDAS */
            /**VENDAS NÃO SINCRONIZADAS */

            let vendas = [];
            let vendaEnviada = false;
            let vendaAtualizada = false;
            let qtdVendas = 0;

            let sizeVendas = this.props.realm.objects(TB_Vendas.name).length;
            if (sizeVendas > 0) {
                let vendasTb = this.props.realm.objects(TB_Vendas.name);
                for (let index = 0; index < vendasTb.length; index++) {
                    let venda = await JSON.parse(vendasTb[index].json);
                    if (!venda.id) {
                        vendas.push({
                            idLocal: vendasTb[index].id,
                            venda: venda
                        })
                    }
                }

                for (let indexVenda = 0; indexVenda < vendas.length; indexVenda++) {
                    let v = await JSON.parse(JSON.stringify(vendas[indexVenda]));
                    const ppd = {
                        dbName: this.props.infoSistema.dbName,
                        objetoNovo: JSON.stringify(v.venda),
                        und: this.props.unidade.unidade,
                        usuario: this.props.usuario.login,
                        usuarioPC: Platform.OS,
                        nomePC: Platform.OS,
                        sistemaOperacionalPC: `${Platform.OS} ${Platform.Version}`,
                        nomeJanela: 'PDV - Vendas'
                    }


                    response = await Axios.get(`${this.props.infoSistema.hostServidor}comercial/liberacaoLancamentoVendas/getByToken/${this.props.infoSistema.dbName}/${v.venda.token}`, headers)
                    if (response.status == 200 && response.data && response.data.objetoNovo) {
                        vendaEnviada = true;
                    }
                    if (String(vendaEnviada) == 'false') {
                        response = await Axios.post(`${this.props.infoSistema.hostServidor}comercial/liberacaoLancamentoVendas/inserir`, ppd, headers)
                        if (response.status == '200' && response.data) {
                            vendaAtualizada = true;
                            qtdVendas++;
                        }
                    }


                    /** GRAVAR DADOS VENDA ATUALIZADA E TRANSACOES CAIXA */
                    if (response.status == 200 && response.data) {
                        let retVenda = response.data;
                        if (!Array.isArray(retVenda.recebimentos)) {
                            retVenda.recebimentos = [retVenda.recebimentos]
                        }
                        /**Update venda */
                        this.props.realm.write(() => {
                            this.props.realm.create(TB_Vendas.name, {
                                id: v.idLocal,
                                json: JSON.stringify(retVenda),
                            }, true)
                        })

                        /**Update transações */
                        for (let i = 0; i < retVenda.recebimentos.length; i++) {
                            let j = retVenda.recebimentos[i];
                            if (j.transacaoCaixa != null) {
                                this.props.caixa.lancamentos.push(j.transacaoCaixa);
                            }
                        }

                        this.props.realm.create(TB_Caixa.name, {
                            id: parseInt(this.props.caixa.idMovimentacaoCaixa),
                            json: JSON.stringify(this.props.caixa),
                            sincronizado: true
                        }, true)
                    }
                }
            }

            /**Atualizar a tabela de Caixas*/


            response = await Axios.get(`${this.props.infoSistema.hostServidor}financeiro/caixa/getCaixaByUsuario_DadosBasicos/${this.props.infoSistema.dbName}/${this.props.usuario.login}/${this.props.unidade.unidade}`, headers);
            if (response.status == 200 && response.data && response.data.id > 0) {
                if (!caixa) {
                    caixa = JSON.parse(JSON.stringify(response.data));
                    response = await Axios.get(`${this.props.infoSistema.hostServidor}financeiro/caixa/getCaixa/${this.props.infoSistema.dbName}/${caixa.idMovimentacaoCaixa}/${this.props.unidade.unidade}`, headers);
                    if (response.status == 200 && response.data && response.data.id > 0) {
                        caixa = await JSON.parse(JSON.stringify(response.data));
                    } else {
                        if (!caixa.lancamentos) {
                            caixa.lancamentos = [];
                        }
                    }
                } else {
                    caixa.fechado = response.data.fechado;
                    caixa.aberto = response.data.aberto;

                    /**Atualizar a lista de lançamentos do caixa*/
                    let naoEnviados = [];
                    if (caixa.lancamentos) {
                        for (let index = 0; index < caixa.lancamentos.length; index++) {
                            let t = caixa.lancamentos[index];
                            if (t && t.id <= 0) {
                                naoEnviados.push(JSON.parse(JSON.stringify(t)));
                            }
                        }
                    }

                    /**Puxa as transações do servidor*/
                    response = await Axios.get(`${this.props.infoSistema.hostServidor}financeiro/caixa/getCaixa/${this.props.infoSistema.dbName}/${caixa.idMovimentacaoCaixa}/${this.props.unidade.unidade}`, headers);
                    if (response.status == 200 && response.data && response.data.id > 0) {
                        caixa = await JSON.parse(JSON.stringify(response.data));
                        if (!caixa.lancamentos) {
                            caixa.lancamentos = [];
                        }
                    }

                    /**incrementa os nao enviados à lista*/
                    for (let indexOld = 0; indexOld < naoEnviados.length; indexOld++) {
                        let tOld = naoEnviados[indexOld];
                        let exist = false;
                        for (let index = 0; index < caixa.lancamentos.length; index++) {
                            let t = caixa.lancamentos[index];
                            if (tOld.token == t.token) {
                                exist = true
                                break;
                            }
                        }
                        if (exist === false) caixa.lancamentos.push(tOld);
                    }

                }
                await this.props.realm.write(() => {
                    this.props.realm.create(
                        TB_Caixa.name,
                        {
                            id: parseInt(caixa.idMovimentacaoCaixa),
                            json: JSON.stringify(caixa),
                            sincronizado: false,
                        },
                        true,
                    );
                });
            }

            /**Verifica caixa em aberto */
            this.verificaSeCaixaAberto();


            /**  CONTAS A RECEBER*/
            response = await Axios.get(
                `${this.props.infoSistema.hostServidor}financeiro/contasAReceber/getTitulosParaRecebimentoCaixa/${this.props.infoSistema.dbName}/0/${this.props.unidade.unidade}`, headers
            );
            if (response.status == 200 && response.data) {
                await this.props.realm.write(() => {
                    let sizeCont = this.props.realm.objects(TB_ContasAReceber.name).length;
                    let lContas = this.props.realm.objects(TB_ContasAReceber.name);
                    if (sizeCont > 0) {
                        this.props.realm.delete(lContas);
                    }
                    for (let i = 0; i < response.data.length; i++) {
                        let v = response.data[i];
                        this.props.realm.create(TB_ContasAReceber.name, {
                            id: parseInt(v.idConta),
                            parcela: parseInt(v.titulo),
                            json: JSON.stringify(v),
                        });
                    }
                });
            }

            /** PEDIDOS */
            response = await Axios.get(`${this.props.infoSistema.hostServidor}comercial/pedidosVendas/getAll/${this.props.infoSistema.dbName}/${new Base64().criptografar('all')}/${true}/${this.props.usuario.idVendedor}/${this.props.unidade.unidade}`, headers);
            if (response.status == 200 && response.data) {
                await this.props.realm.write(() => {
                    let sizePed = this.props.realm.objects(TB_Pedidos.name).length;
                    let lPed = this.props.realm.objects(TB_Pedidos.name);
                    if (sizePed > 0) {
                        this.props.realm.delete(lPed);
                    }

                    for (let i = 0; i < response.data.length; i++) {
                        let v = response.data[i];
                        this.props.realm.create(TB_Pedidos.name, {
                            id: parseInt(v.id),
                            json: JSON.stringify(v),
                        });
                    }
                })
            }

        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
                this.props.setLoadingTotal(false);
            } else {
                showMessage({
                    message: "Falha!", description: 'Falha na sincronização parcial dos dados.', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
            console.log(error)
        }
        console.log("SYNC FEITO")
        this.props.setLoadingTotal(false);
    }



    async syncTotal() {
        let response = null;
        try {
            this.props.setLoadingTotal(true);
            /**CLIENTE */
            response = await Axios.get(`${this.props.infoSistema.hostServidor}administracao/clientes/getAll/${this.props.infoSistema.dbName}/${new Base64().criptografar('all')}/${this.props.unidade.unidade}`, headers);
            if (response.status == 200 && response.data) {

                let lClientes = await this.props.realm.objects(TB_Clientes.name);
                let sizeLCli = await this.props.realm.objects(TB_Clientes.name).length;

                this.props.realm.write(() => {
                    if (sizeLCli > 0) {
                        this.props.realm.delete(lClientes);
                    }
                    for (let i = 0; i < response.data.length; i++) {
                        if (String(response.data[i].clienteInativo) === 'false') {
                            this.props.realm.create(TB_Clientes.name, {
                                id: parseInt(response.data[i].id),
                                json: JSON.stringify(response.data[i]),
                            })

                        }
                    }
                });
            }

            /**CONFIG COMERCIAL */

            response = await Axios.get(
                `${this.props.infoSistema.hostServidor}configuracoes/configComercial/get/${this.props.infoSistema.dbName}/${this.props.unidade.unidade}`, headers
            );
            if (response.status == 200 && response.data != null) {
                this.props.setConfigComercial(JSON.parse(JSON.stringify(response.data)));

                this.props.realm.write(() => {
                    this.props.realm.create(TB_ConfigComercial.name, {
                        und: parseInt(response.data.und),
                        json: JSON.stringify(response.data),
                    }, true)
                });
            }


            /**PRODUTOS */
            response = await Axios.get(
                `${this.props.infoSistema.hostServidor}estoque/produtos/getAll_ParaPedidosEVendas/${this.props.infoSistema.dbName}/${this.props.unidade.unidade}`, headers
            );

            if (response.status == 200 && response.data != null) {
                let lProdutos = await this.props.realm.objects(TB_Estoque.name);
                this.props.realm.write(() => {
                    this.props.realm.delete(lProdutos);
                    for (let i = 0; i < response.data.length; i++) {
                        this.props.realm.create(TB_Estoque.name, {
                            id: parseInt(response.data[i].id),
                            json: JSON.stringify(response.data[i])
                        })
                    }
                });
            }

            /**PLANOS FINANCEIROS */
            response = await Axios.get(
                `${this.props.infoSistema.hostServidor}contabilidade/planoFinanceiro/getAll/${this.props.infoSistema.dbName}/${this.props.unidade.unidade}`, headers
            );
            if (response.status == 200 && response.data != null) {
                let lPlano = await this.props.realm.objects(TB_PlanoFinanceiro.name);
                this.props.realm.write(() => {
                    this.props.realm.delete(lPlano);
                    for (let i = 0; i < response.data.length; i++) {
                        this.props.realm.create(TB_PlanoFinanceiro.name, {
                            id: parseInt(response.data[i].id),
                            json: JSON.stringify(response.data[i])
                        })
                    }
                });
            }


            /**CENTRO CUSTO*/
            response = await Axios.get(
                `${this.props.infoSistema.hostServidor}contabilidade/centroCustos/getAll/${this.props.infoSistema.dbName}/${this.props.unidade.unidade}`, headers
            );
            if (response.status == 200 && response.data != null) {
                let lCusto = await this.props.realm.objects(TB_CentroCusto.name);
                this.props.realm.write(() => {
                    this.props.realm.delete(lCusto);
                    for (let i = 0; i < response.data.length; i++) {
                        this.props.realm.create(TB_CentroCusto.name, {
                            id: parseInt(response.data[i].id),
                            json: JSON.stringify(response.data[i])
                        })
                    }
                });
            }

            /**FORMAS PG */
            response = await Axios.get(`${this.props.infoSistema.hostServidor}financeiro/formasPagamento/getAll_PDV/${this.props.infoSistema.dbName}/${true}`, headers);
            if (response.status == 200 && response.data != null) {
                let lPg = await this.props.realm.objects(TB_FormasPagamento.name);
                this.props.realm.write(() => {
                    this.props.realm.delete(lPg);
                    for (let i = 0; i < response.data.length; i++) {
                        this.props.realm.create(TB_FormasPagamento.name, {
                            id: parseInt(response.data[i].id),
                            json: JSON.stringify(response.data[i])
                        })

                    }
                });
            }


            /**MUNICIPIOS*/
            response = await Axios.get(`${this.props.infoSistema.hostServidor}fiscal/municipios/getAll/${this.props.infoSistema.dbName}`, headers);

            if (response.status == 200 && response.data != null) {

                let lMun = await this.props.realm.objects(TB_Municipios.name);
                this.props.realm.write(() => {
                    this.props.realm.delete(lMun);
                    for (let i = 0; i < response.data.length; i++) {
                        this.props.realm.create(TB_Municipios.name, {
                            id: parseInt(response.data[i].cMun),
                            json: JSON.stringify(response.data[i])
                        })
                    }
                });
            }
        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
                this.props.setLoadingTotal(false);
            } else {
                showMessage({
                    message: "Falha!", description: 'Falha na sincronização dos dados.', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
            console.log(error)
        }
        this.syncParcial();
        this.props.setLoadingTotal(false);
    }



    render() {
        //const _goBack = () => console.log('Went back');
        if (this.state.visible == true) {
            return (
                DEVICE_HEIGHT > 1100 ?
                    <SkeletonPlaceholder highlightColor='#1e1e46' backgroundColor='#d7d6e5'>
                        <SkeletonPlaceholder.Item marginTop={'5%'} width={'95%'} height={Dimensions.get("screen").width * 2 / 23} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" justifyContent='space-around' marginTop={'13%'}>
                            <SkeletonPlaceholder.Item width={100} height={100} borderRadius={50} />
                            <SkeletonPlaceholder.Item width={100} height={100} borderRadius={50} />
                        </SkeletonPlaceholder.Item>
                        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" justifyContent='space-around' marginTop={'13%'}>
                            <SkeletonPlaceholder.Item width={100} height={100} borderRadius={50} />
                            <SkeletonPlaceholder.Item width={100} height={100} borderRadius={50} />
                        </SkeletonPlaceholder.Item>
                        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" justifyContent='space-around' marginTop={'13%'}>
                            <SkeletonPlaceholder.Item width={100} height={100} borderRadius={50} />
                            <SkeletonPlaceholder.Item width={100} height={100} borderRadius={50} />
                        </SkeletonPlaceholder.Item>
                        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" justifyContent='space-around' marginTop={'13%'}>
                            <SkeletonPlaceholder.Item width={100} height={100} borderRadius={50} />
                            <SkeletonPlaceholder.Item width={100} height={100} borderRadius={50} />
                        </SkeletonPlaceholder.Item>
                        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" justifyContent='space-around' marginTop={'13%'}>
                            <SkeletonPlaceholder.Item width={100} height={100} borderRadius={50} />
                            <SkeletonPlaceholder.Item width={100} height={100} borderRadius={50} />
                        </SkeletonPlaceholder.Item>
                    </SkeletonPlaceholder>
                    :
                    <SkeletonPlaceholder highlightColor='#1e1e46' backgroundColor='#d7d6e5'>
                        <SkeletonPlaceholder.Item marginTop={'5%'} width={'95%'} height={Dimensions.get("screen").width * 2 / 13} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={'5%'} width={'95%'} height={Dimensions.get("screen").width * 2 / 87} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" justifyContent='space-around' marginTop={'13%'}>
                            <SkeletonPlaceholder.Item
                                marginTop={'5%'}
                                width={Dimensions.get("screen").width * 2 / 8}
                                height={Dimensions.get("screen").width * 2 / 8}
                                borderRadius={50}
                            />
                            <SkeletonPlaceholder.Item
                                marginTop={'5%'}
                                width={Dimensions.get("screen").width * 2 / 8}
                                height={Dimensions.get("screen").width * 2 / 8}
                                borderRadius={50}
                            />
                        </SkeletonPlaceholder.Item>

                        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" justifyContent='space-around' marginTop={23}>
                            <SkeletonPlaceholder.Item
                                marginTop={'5%'}
                                width={Dimensions.get("screen").width * 2 / 8}
                                height={Dimensions.get("screen").width * 2 / 8}
                                borderRadius={50}
                            />
                            <SkeletonPlaceholder.Item
                                marginTop={'5%'}
                                width={Dimensions.get("screen").width * 2 / 8}
                                height={Dimensions.get("screen").width * 2 / 8}
                                borderRadius={50}
                            />
                        </SkeletonPlaceholder.Item>
                        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" justifyContent='space-around' marginTop={23}>
                            <SkeletonPlaceholder.Item
                                marginTop={'5%'}
                                width={Dimensions.get("screen").width * 2 / 8}
                                height={Dimensions.get("screen").width * 2 / 8}
                                borderRadius={50}
                            />
                            <SkeletonPlaceholder.Item
                                marginTop={'5%'}
                                width={Dimensions.get("screen").width * 2 / 8}
                                height={Dimensions.get("screen").width * 2 / 8}
                                borderRadius={50}
                            />
                        </SkeletonPlaceholder.Item>
                        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" justifyContent='space-around' marginTop={23}>
                            <SkeletonPlaceholder.Item
                                marginTop={'5%'}
                                width={Dimensions.get("screen").width * 2 / 8}
                                height={Dimensions.get("screen").width * 2 / 8}
                                borderRadius={50}
                            />
                            <SkeletonPlaceholder.Item
                                marginTop={'5%'}
                                width={Dimensions.get("screen").width * 2 / 8}
                                height={Dimensions.get("screen").width * 2 / 8}
                                borderRadius={50}
                            />
                        </SkeletonPlaceholder.Item>
                        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" justifyContent='space-around' marginTop={23}>
                            <SkeletonPlaceholder.Item
                                marginTop={'5%'}
                                width={Dimensions.get("screen").width * 2 / 8}
                                height={Dimensions.get("screen").width * 2 / 8}
                                borderRadius={50}
                            />
                            <SkeletonPlaceholder.Item
                                marginTop={'5%'}
                                width={Dimensions.get("screen").width * 2 / 8}
                                height={Dimensions.get("screen").width * 2 / 8}
                                borderRadius={50}
                            />
                        </SkeletonPlaceholder.Item>
                    </SkeletonPlaceholder>
            )
        } else {
            return (
                <View style={styleMain.viewMain}>
                    <StatusBar
                        hidden={false}
                        backgroundColor='#1e1e46' />
                    <Appbar.Header style={{ backgroundColor: '#1e1e46', borderTopWidth: 1, borderTopColor: 'white' }}>
                        {/*<Appbar.BackAction onPress={_goBack}/>*/}
                        <Appbar.Content title={(this.props.caixa ? `PDV ${this.props.caixa.idMovimentacaoCaixa} aberto` : 'Caixa fechado')} subtitle={this.props.usuario.login} />
                        <Appbar.Action size={Dimensions.get("screen").width * 2 / 21} icon="account-arrow-right" onPress={() => {
                            this.sair();
                        }} />
                    </Appbar.Header>

                    <Spinner
                        visible={this.props.loadingCashRegister}
                        textContent={'Abrindo caixa...'}
                        textStyle={{ color: 'white', fontSize: RFPercentage(2.9), fontFamily: 'Roboto-Light' }}
                        customIndicator={<Wave size={Dimensions.get("screen").width * 2 / 9} color='#040739' />}
                    />

                    <Portal>
                        <Modal visible={this.props.loadingTotal} contentContainerStyle={styleGlobal.containerModal} dismissable={false}>
                            <Text style={styleGlobal.titleSyncMain}>Aguarde a sincronização do app...</Text>
                            <Circle size={Dimensions.get("screen").width * 2 / 10} color='#1e1e46' style={{ alignSelf: 'center' }} />
                        </Modal>
                    </Portal>

                    <ScrollView>
                        <View style={[styleMain.viewDetailHorizontal, { marginTop: 24 }]}>
                            <View>
                                <IconButton
                                    icon="cash-register"
                                    color={'#ffd700'}
                                    style={{ borderWidth: 0, elevation: 2, backgroundColor: 'white' }}
                                    size={Dimensions.get("screen").width * 2 / 12}
                                    onPress={() => {
                                        if (this.props.caixaAberto == false) {
                                            actionSheetRef.current?.setModalVisible();
                                        } else if (!(this.props.configComercial && this.props.configComercial.idTipoVendaPadraoPDV > 0)) {
                                            showMessage({
                                                message: "Falha!", description: 'Algumas configurações não foram carregadas, sincronize novamente.', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                                            });
                                        } else {
                                            this.props.navigation.navigate('sale');
                                        }
                                    }}
                                />
                                <Text style={{ textAlign: 'center' }}>Vender</Text>
                            </View>
                            <View>
                                <IconButton
                                    icon="account-cash-outline"
                                    color={'#ffd700'}
                                    style={{ borderWidth: 0, elevation: 2, backgroundColor: 'white' }}
                                    size={Dimensions.get("screen").width * 2 / 12}
                                    onPress={() => {
                                        if (this.props.caixaAberto == false) {
                                            actionSheetRef.current?.setModalVisible();
                                        } else if (!(this.props.configComercial && this.props.configComercial.idTipoVendaPadraoPDV > 0)) {
                                            showMessage({
                                                message: "Falha!", description: 'Algumas configurações não foram carregadas, sincronize novamente.', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                                            });
                                        } else {
                                            this.props.navigation.navigate('receiveBill');
                                        }
                                    }}
                                />
                                <Text style={{ textAlign: 'center' }}>Receber</Text>
                            </View>
                        </View>

                        <View style={[styleMain.viewDetailHorizontal, { marginTop: 24 }]}>
                            <View>
                                <IconButton
                                    icon="sitemap"
                                    color={'#ffd700'}
                                    style={{ borderWidth: 0, elevation: 2, backgroundColor: 'white' }}
                                    size={Dimensions.get("screen").width * 2 / 12}
                                    onPress={() => {
                                        if (this.props.caixaAberto == false) {
                                            actionSheetRef.current?.setModalVisible();
                                        } else if (!(this.props.configComercial && this.props.configComercial.idTipoVendaPadraoPDV > 0)) {
                                            showMessage({
                                                message: "Falha!", description: 'Algumas configurações não foram carregadas, sincronize novamente.', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                                            });
                                        } else {
                                            this.props.navigation.navigate('stockReport');
                                        }
                                    }}
                                />
                                <Text style={{ textAlign: 'center' }}>Estoque</Text>
                            </View>
                            <View>
                                <IconButton
                                    icon="account-group"
                                    color={'#ffd700'}
                                    style={{ borderWidth: 0, elevation: 2, backgroundColor: 'white' }}
                                    size={Dimensions.get("screen").width * 2 / 12}
                                    onPress={() => console.log('Pressed')}
                                />
                                <Text style={{ textAlign: 'center' }}>Clientes</Text>
                            </View>
                        </View>

                        <View style={[styleMain.viewDetailHorizontal, { marginTop: 24 }]}>
                            <View>
                                <IconButton
                                    icon="truck-outline"
                                    color={'#ffd700'}
                                    style={{ borderWidth: 0, elevation: 2, backgroundColor: 'white' }}
                                    size={Dimensions.get("screen").width * 2 / 12}
                                    onPress={() => console.log('Pressed')}
                                />
                                <Text style={{ textAlign: 'center' }}>Entregas</Text>
                            </View>
                            <View>
                                <View>
                                    <IconButton
                                        icon="file-chart-outline"
                                        color={'#ffd700'}
                                        style={{ borderWidth: 0, elevation: 2, backgroundColor: 'white' }}
                                        size={Dimensions.get("screen").width * 2 / 12}
                                        onPress={() => console.log('Pressed')}
                                    />
                                    <Text style={{ textAlign: 'center' }}>Tesouraria</Text>
                                </View>
                            </View>
                        </View>

                        <View style={[styleMain.viewDetailHorizontal, { marginTop: 24 }]}>
                            <View>
                                <IconButton
                                    icon="chart-timeline"
                                    color={'#ffd700'}
                                    style={{ borderWidth: 0, elevation: 2, backgroundColor: 'white' }}
                                    size={Dimensions.get("screen").width * 2 / 12}
                                    onPress={() => {
                                        if (this.props.caixaAberto == false) {
                                            actionSheetRef.current?.setModalVisible();
                                        } else if (!(this.props.configComercial && this.props.configComercial.idTipoVendaPadraoPDV > 0)) {
                                            showMessage({
                                                message: "Falha!", description: 'Algumas configurações não foram carregadas, sincronize novamente.', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                                            });
                                        } else {
                                            this.props.navigation.navigate('saleReport');
                                        }
                                    }}
                                />
                                <Text style={{ textAlign: 'center' }}>Relatório Venda</Text>
                            </View>
                            <View>
                                <IconButton
                                    icon="tools"
                                    color={'#ffd700'}
                                    style={{ borderWidth: 0, elevation: 2, backgroundColor: 'white' }}
                                    size={Dimensions.get("screen").width * 2 / 12}
                                    onPress={() => {
                                        this.props.navigation.navigate('config');
                                    }}
                                />
                                <Text style={{ textAlign: 'center' }}>Config</Text>
                            </View>
                        </View>

                        <View style={[styleMain.viewDetailHorizontal, { marginTop: 24 }]}>
                            <View>
                                <View>
                                    <IconButton
                                        icon="sync-circle"
                                        color={'#ffd700'}
                                        style={{ borderWidth: 0, elevation: 2, backgroundColor: 'white' }}
                                        size={Dimensions.get("screen").width * 2 / 12}
                                        onPress={() => {
                                            this.props.navigation.navigate('sync');
                                        }}
                                    />
                                    <Text style={{ textAlign: 'center' }}>Sync</Text>
                                </View>
                            </View>
                            <View>
                                <View>
                                    <IconButton
                                        icon="wallet"
                                        color={'#ffd700'}
                                        style={{ borderWidth: 0, elevation: 2, backgroundColor: 'white' }}
                                        size={Dimensions.get("screen").width * 2 / 12}
                                        onPress={() => {
                                            if (this.props.caixaAberto == false) {
                                                actionSheetRef.current?.setModalVisible();
                                            } else if (!(this.props.configComercial && this.props.configComercial.idTipoVendaPadraoPDV > 0)) {
                                                showMessage({
                                                    message: "Falha!", description: 'Algumas configurações não foram carregadas, sincronize novamente.', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                                                });
                                            } else {
                                                this.props.navigation.navigate('expense');
                                            }
                                        }}
                                    />
                                    <Text style={{ textAlign: 'center' }}>Despesas</Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styleMain.viewFooter}>
                        <Text style={styleMain.textFooterHeader}>{`Dual PDV`}
                        </Text>
                        <Text style={styleMain.textFooterDetails}>{'Central de suporte: ************'} </Text>
                        <Text style={styleMain.textFooterDetails}>{'dualPDV'}</Text>
                        <Text style={styleMain.textFooterDetails}>{'©2024 Dual PDV'}</Text>
                    </View>

                    {/** ABRIR CAIXA*/}
                    <ActionSheet ref={actionSheetRef} containerStyle={{ backgroundColor: 'white' }}>
                        <View >
                            <View style={styleGlobal.viewTopLimit}>
                                <Icon size={Dimensions.get("screen").width * 2 / 32} color='#1e1e46' name="cash-register" type={'material-community'} />
                                <Text style={[styleGlobal.titleDetail, { borderBottomWidth: 0, paddingRight: 15 }]}>{'Abrir Caixa'}</Text>
                            </View>

                            <View style={{ flexDirection: 'row' }}>
                                <View style={styleGlobal.viewInputLimite}>
                                    <TextInputMask
                                        includeRawValueInChangeText={true}
                                        type={'money'}
                                        options={{
                                            precision: 2,
                                            separator: ',',
                                            delimiter: '.',
                                            unit: 'R$',
                                            suffixUnit: ''
                                        }}
                                        keyboardType={"numeric"}
                                        style={styleGlobal.titleQtdCart}
                                        placeholder={'Saldo...'}
                                        value={this.state.saldoDinheiro}
                                        onChangeText={(value, rowValue) => {
                                            this.setState({ saldoDinheiro: rowValue })
                                        }}
                                    />
                                    <Text style={styleGlobal.subtitleLimit}>Saldo Dinheiro</Text>
                                </View>

                                <View style={styleGlobal.viewInputLimite}>
                                    <TextInputMask
                                        includeRawValueInChangeText={true}
                                        type={'money'}
                                        options={{
                                            precision: 2,
                                            separator: ',',
                                            delimiter: '.',
                                            unit: 'R$',
                                            suffixUnit: ''
                                        }}
                                        keyboardType={"numeric"}
                                        style={styleGlobal.titleQtdCart}
                                        placeholder={'Saldo...'}
                                        value={this.state.saldoCheque}
                                        onChangeText={(value, rowValue) => {
                                            this.setState({ saldoCheque: rowValue })
                                        }}
                                    />
                                    <Text style={styleGlobal.subtitleLimit}>Saldo Cheque</Text>
                                </View>
                            </View>

                            <View style={style.viewButtonRegister}>
                                <Button
                                    style={{ width: '68%', alignSelf: 'center' }}
                                    icon="check-all" mode="contained"
                                    color='#1e1e46'
                                    loading={this.props.loadingCashRegister}
                                    loadingProps={{ size: "large", color: '#16273f' }}
                                    onPress={() => {
                                        if (!this.props.loadingCashRegister) {
                                            this.abrirCaixa();
                                        }
                                    }} >
                                    Abrir
                                </Button>
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
    loadingCashRegister: state.pdvReducer.loadingCashRegister,
    caixaAberto: state.pdvReducer.caixaAberto,
    infoSistema: state.registerReducer.infoSistema,
    unidade: state.userReducer.unidade,
    loadingTotal: state.mainReducer.loadingTotal,
    loadingParcial: state.mainReducer.loadingParcial,
    configComercial: state.configReducer.configComercial,
})

export default connect(mapStateToProps, {
    setLoadingTotal,
    setLoadingParcial,
    setConfigComercial,
    setCaixaAberto,
    setCaixa,
    setLoading,
})(formMain);