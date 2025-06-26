import React, { Component } from 'react';
import { View, ScrollView, StatusBar, Platform } from 'react-native';
import { connect } from 'react-redux';
import Axios from 'axios';
import { headers } from '../config/security';
import Base64 from '../necessary/base64';
import GravarErro from '../necessary/errorServer';
import { TB_Clientes, TB_Pedidos, TB_ContasAReceber, TB_Estoque, TB_ConfigComercial, TB_CentroCusto, TB_FormasPagamento, TB_PlanoFinanceiro, TB_Municipios, TB_Caixa, TB_Vendas } from '../database/DBTables';
import { Text, List, Button, TextInput, ActivityIndicator, Snackbar } from 'react-native-paper';
import styleGlobal from '../necessary/style/styleGlobal';
import { showMessage } from "react-native-flash-message";
import { setConfigComercial } from '../actions/configAction';
import { setCaixa, setCaixaAberto } from '../actions/pdvAction';
import { formatDateToAAAAMMDD, getHoraAtual } from '../necessary/dateAndHour/dateHour'

class formSincronizar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            status: '',
            syncTotal: false,
            syncParcial: false,
            isCaixaAberto: false
        }
    }

    async verificaSituacaoCaixa() {
        this.props.setCaixaAberto(false);
        let sizeCaixa = this.props.realm.objects(TB_Caixa.name).length;
        let caixaTB = this.props.realm.objects(TB_Caixa.name);

        if (sizeCaixa > 0) {
            for (let i = 0; i < caixaTB.length; i++) {
                let c = await JSON.parse(caixaTB[i].json);
                if (String(c.aberto) === 'true') {
                    this.setState({ isCaixaAberto: true });
                    this.props.setCaixa(c);
                    this.props.setCaixaAberto(true);
                    break;
                }
            }
        }
    }


    /**
* Ordem Sync
*
* 1. clientes (Apenas clientes ativos)
* 2. produtos (Apenas produtos ativos e com estoque)
* 3. contasareceber (Apenas contas pendentes)
* 4. planofinanceiro
* 5. centro de custos
* 7. contas bancárias (Apenas contas ativas)
* 8. formas de pagamento
* 9. caixas abertos do usuario
* 10. Gravar todos os municipios na tabela (apenas se não exitir)
* 11. Vendas
*/
    async parcial() {
        await this.setState({ status: '', syncParcial: true });

        let caixa = null;
        let hostServer = null;
        let nomeJanela = '';
        let response = null;
        let atualizados = 0;
        let enviados = 0;

        await this.setState({ status: `${this.state.status}\nIniciando sincronização parcial...` });

        /**CAIXA EM ABERTO */
        try {
            await this.setState({ status: `${this.state.status}\nVerificando caixas em aberto...` });

            let sizeCaixa = this.props.realm.objects(TB_Caixa.name).length;
            let caixaTB = this.props.realm.objects(TB_Caixa.name);
            if (sizeCaixa > 0) {
                for (let i = 0; i < caixaTB.length; i++) {
                    let c = await JSON.parse(caixaTB[i].json);
                    if (String(c.aberto) === 'true') {
                        caixa = c;
                        this.setState({ isCaixaAberto: true });
                        this.props.setCaixa(c);
                        this.props.setCaixaAberto(true);
                        break;
                    }
                }

            }
            await this.setState({ status: `${this.state.status}\n${this.state.isCaixaAberto == true ? `Caixa ${this.props.caixa.idMovimentacaoCaixa} em aberto` : 'Nenhum caixa em aberto'}` });

            /**  ENVIA TRANSAÇÕES NAO ENVIADAS */
            if (caixa && caixa.lancamentos) {
                await this.setState({ status: `${this.state.status}\nEnviando transações do caixa...` });
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
                                    await this.setState({ status: `${this.state.status}\n${atualizados > 0 ? ` transações de caixa atualizada(s)...` : ''}` });
                                }
                            }
                        } else {
                            if (!String(hostServer).endsWith('caixa/')) {
                                response = await Axios.post(hostServer, JSON.stringify(ppd), headers);
                                if (response.status == 200 && response.data != null) {
                                    v = response.data;
                                    enviados++;
                                    await this.setState({ status: `${this.state.status}\n${enviados > 0 ? ` transações de caixa enviada(s)...` : ''}` });
                                }
                            }
                        }
                    }
                }
            }

        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
            await this.setState({ status: `${this.state.status}\nFalha ao sincronizar caixas em aberto...` });
            console.log(error)
        }
        await this.setState({ status: `${this.state.status}\n${enviados > 0 | atualizados > 0 ? 'Sincronização de caixas finalizada' : 'Não há transações de caixa pendentes'}` });


        /**VENDAS */
        /**VENDAS NÃO SINCRONIZADAS */

        let vendas = [];
        let vendaEnviada = false;
        let vendaAtualizada = false;
        let qtdVendas = 0;

        await this.setState({ status: `${this.state.status}\nSincronizando vendas ...` });

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
                console.log(v.venda)
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


                try {
                    response = await Axios.get(`${this.props.infoSistema.hostServidor}comercial/liberacaoLancamentoVendas/getByToken/${this.props.infoSistema.dbName}/${v.venda.token}`, headers)
                    if (response.status == 200 && response.data && response.data.objetoNovo) {
                        vendaEnviada = true;
                    }
                    if (String(vendaEnviada) == 'false') {
                        response = await Axios.post(`${this.props.infoSistema.hostServidor}comercial/liberacaoLancamentoVendas/inserir`, ppd, headers)
                        console.log(response.status)
                        return
                        if (response.status == '200' && response.data) {
                            vendaAtualizada = true;
                            qtdVendas++;
                        }
                    }
                    if (qtdVendas > 0) {
                        await this.setState({ status: `${this.state.status}\n${qtdVendas} venda(s) sincronizadas(s)...` });
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

                    await this.setState({ status: `${this.state.status}\nGravando dados vendas e transações do caixa no aparelho...` });

                } catch (error) {
                    if (!!error.isAxiosError && !error.response) {
                        showMessage({
                            message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                        });
                    }
                    console.log(error)
                    await this.setState({ status: `${this.state.status}\nFalha ao sincronizar venda(s)...` });
                    let gravarErro = new GravarErro();
                    gravarErro.licenca = this.props.infoSistema.licenca
                    gravarErro.sistema = 'Dual PDV'
                    gravarErro.erro = error.message
                    gravarErro.logErro = JSON.stringify(error.config)
                    gravarErro.localErro = 'Finalizar Venda'
                    gravarErro.dataErro = formatDateToAAAAMMDD(new Date())
                    gravarErro.horaErro = getHoraAtual()
                    gravarErro.mobile = true
                    gravarErro.cliente = false
                    gravarErro.servidor = false
                    gravarErro.enviarLogErro()
                }
            }
        } else {
            await this.setState({ status: `${this.state.status}\nNão há vendas pendentes de sincronização...` });
        }

        await this.setState({ status: `${this.state.status}\nSincronização de vendas finalizada ...` });

        /**Atualizar a tabela de Caixas*/
        await this.setState({ status: `${this.state.status}\nSincronizando lançamentos de caixa...` });

        try {
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

                await this.setState({ status: `${this.state.status}\nLançamentos de caixa sincronizados...` });
            }
        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
            console.log(error)
            await this.setState({ status: `${this.state.status}\nFalha ao sincronizar lançamentos de caixa...` });
        }
        await this.setState({ status: `${this.state.status}\nSincronização de lançamentos de caixa finalizada...` });


        await this.verificaSituacaoCaixa();


        /**  CONTAS A RECEBER*/
        await this.setState({ status: `${this.state.status}\nSincronizando contas a receber ...` });
        try {
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
                await this.setState({ status: `${this.state.status}\nConta(s) a receber sincronizada(s)...` });
            }

        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
            console.log(error)
            await this.setState({ status: `${this.state.status}\nFalha ao sincronizar contas a receber...` });
        }
        await this.setState({ status: `${this.state.status}\nSincronização contas a receber finalizada...` });


        /** PEDIDOS */
        await this.setState({ status: `${this.state.status}\nSincronizando pedidos ...` });
        try {
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
                await this.setState({ status: `${this.state.status}\nPedidos sincronizados...` });
            }
        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
            console.log(error)
            await this.setState({ status: `${this.state.status}\nFalha ao sincronizar pedidos...` });
        }
        showMessage({
            message: "Conluído", description: 'Sincronização parcial finalizada!', type: "success", icon: "success", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
        });

        await this.setState({ status: `${this.state.status}\nSincronização de pedidos finalizada...` });

        await this.setState({ status: `${this.state.status}\nSincronização parcial finalizada!` });

        await this.setState({ syncParcial: false });
    }



    async total() {
        await this.setState({ status: '' });
        await this.setState({ status: `${this.state.status}\nIniciando sincronização total...`, syncTotal: true });


        let sizeCli = 0;
        let sizeConfig = 0;
        let sizeProd = 0;
        let sizePlano = 0;
        let sizeCusto = 0;
        let sizeMun = 0;
        let sizePagamentos = 0;

        /**CLIENTE */
        await this.setState({ status: `${this.state.status}\nSincronizando clientes...` });
        try {
            const response = await Axios.get(`${this.props.infoSistema.hostServidor}administracao/clientes/getAll/${this.props.infoSistema.dbName}/${new Base64().criptografar('all')}/${this.props.unidade.unidade}`, headers);
            if (response.status == 200 && response.data) {

                let lClientes = await this.props.realm.objects(TB_Clientes.name);
                let sizeLCli = await this.props.realm.objects(TB_Clientes.name).length;

                this.props.realm.write(() => {
                    this.props.realm.delete(lClientes);
                    for (let i = 0; i < response.data.length; i++) {
                        if (String(response.data[i].clienteInativo) === 'false') {
                            this.props.realm.create(TB_Clientes.name, {
                                id: parseInt(response.data[i].id),
                                json: JSON.stringify(response.data[i]),
                            })
                            sizeCli++;
                        }
                    }
                });
                this.setState({ status: `${this.state.status}\n${sizeCli > 0 ? `${sizeCli}  clientes(s) sincronizado(s)...` : 'Nenhum cliente sincronizado'}` });
            }
        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
            await this.setState({ status: `${this.state.status}\nFalha ao sincronizar clientes...` });
        }

        /**CONFIG COMERCIAL */
        await this.setState({ status: `${this.state.status}\nSincronizando configurações comerciais...` });
        try {
            const response = await Axios.get(
                `${this.props.infoSistema.hostServidor}configuracoes/configComercial/get/${this.props.infoSistema.dbName}/${this.props.unidade.unidade}`, headers
            );
            if (response.status == 200 && response.data != null) {

                sizeConfig++;
                this.props.setConfigComercial(JSON.parse(JSON.stringify(response.data)));

                // for (let i = 0; i < response.data.length; i++) {
                this.props.realm.write(() => {
                    this.props.realm.create(TB_ConfigComercial.name, {
                        und: parseInt(response.data.und),
                        json: JSON.stringify(response.data),
                    }, true)
                });
                // }
            }
            await this.setState({ status: `${this.state.status}\n${sizeConfig > 0 ? `${sizeConfig}  configuração comercial sincronizada...` : 'Nenhum config comercial sincronizado'}` });
        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
            await this.setState({ status: `${this.state.status}\nFalha ao sincronizar configurações comerciais...` });
        }


        /**PRODUTOS */
        await this.setState({ status: `${this.state.status}\nSincronizando produtos...` });
        try {
            const response = await Axios.get(
                `${this.props.infoSistema.hostServidor}estoque/produtos/getAll_ParaPedidosEVendas/${this.props.infoSistema.dbName}/${this.props.unidade.unidade}`, headers
            );

            if (response.status == 200 && response.data) {
                let lProdutos = await this.props.realm.objects(TB_Estoque.name);

                this.props.realm.write(() => {
                    this.props.realm.delete(lProdutos);
                    for (let i = 0; i < response.data.length; i++) {
                        this.props.realm.create(TB_Estoque.name, {
                            id: parseInt(response.data[i].id),
                            json: JSON.stringify(response.data[i])
                        })
                        sizeProd++;
                    }
                });
            }
            await this.setState({ status: `${this.state.status}\n${sizeProd > 0 ? `${sizeProd} produto(s) sincronizado(s)...` : 'Nenhum produto sincronizado'}` });
        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
            await this.setState({ status: `${this.state.status}\nFalha ao sincronizar produtos...` });
        }


        /**PLANOS FINANCEIROS */
        await this.setState({ status: `${this.state.status}\nSincronizando planos financeiros ...` });
        try {

            const response = await Axios.get(
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
                        sizePlano++;
                    }
                });
            }

            await this.setState({ status: `${this.state.status}\n${sizePlano > 0 ? `${sizePlano} plano(s) financeiro(s) sincronizado(s)...` : 'Nenhum plano financeiro sincronizado'}` });
        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
            await this.setState({ status: `${this.state.status}\nFalha ao sincronizar planos financeiros...` });
        }


        /**CENTRO CUSTO*/
        await this.setState({ status: `${this.state.status}\nSincronizando centros de custos ...` });
        try {
            const response = await Axios.get(
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
                        sizeCusto++;
                    }
                });
            }
            await this.setState({ status: `${this.state.status}\n${sizeCusto > 0 ? `${sizeCusto} centro(s) custo(s) sincronizado(s)...` : 'Nenhum centro de custo sincronizado'}` });
        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
            await this.setState({ status: `${this.state.status}\nFalha ao sincronizar os centros de custos...` });
        }

        /**FORMAS PG */
        await this.setState({ status: `${this.state.status}\nSincronizando formas de pagamento ...` });
        try {
            const response = await Axios.get(`${this.props.infoSistema.hostServidor}financeiro/formasPagamento/getAll_PDV/${this.props.infoSistema.dbName}/${true}`, headers);
            if (response.status == 200 && response.data != null) {
                let lPg = await this.props.realm.objects(TB_FormasPagamento.name);

                this.props.realm.write(() => {
                    this.props.realm.delete(lPg);
                    for (let i = 0; i < response.data.length; i++) {
                        this.props.realm.create(TB_FormasPagamento.name, {
                            id: parseInt(response.data[i].id),
                            json: JSON.stringify(response.data[i])
                        })
                        sizePagamentos++;
                    }
                });
            }
            await this.setState({ status: `${this.state.status}\n${sizePagamentos > 0 ? `${sizePagamentos} formas(s) pagamento(s) sincronizada(s)...` : 'Nenhuma forma de pagamento sincronizada'}` });
        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
            await this.setState({ status: `${this.state.status}\nFalha ao sincronizar formas de pagamento...` });
        }


        /**MUNICIPIOS*/
        await this.setState({ status: `${this.state.status}\nSincronizando municípios...` });
        try {
            const response = await Axios.get(`${this.props.infoSistema.hostServidor}fiscal/municipios/getAll/${this.props.infoSistema.dbName}`, headers);

            if (response.status == 200 && response.data != null) {

                let lMun = await this.props.realm.objects(TB_Municipios.name);

                this.props.realm.write(() => {
                    this.props.realm.delete(lMun);
                    for (let i = 0; i < response.data.length; i++) {
                        this.props.realm.create(TB_Municipios.name, {
                            id: parseInt(response.data[i].cMun),
                            json: JSON.stringify(response.data[i])
                        })
                        sizeMun++;
                    }
                });
            }
            await this.setState({ status: `${this.state.status}\n${sizeMun > 0 ? `${sizeMun} município(s) sincronizado(s)...` : 'Nenhum município sincronizado'}` });
        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
            await this.setState({ status: `${this.state.status}\nFalha ao sincronizar municípios...` });
        }
        showMessage({
            message: "Conluído", description: 'Sincronização total finalizada!', type: "success", icon: "success", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
        });
        await this.setState({ status: `${this.state.status}\nSincronização total finalizada!`, syncTotal: false });
    }


    render() {
        return (
            <View style={styleGlobal.viewMain}>
                <ScrollView style={{ flex: 6, marginRight: 12, marginLeft: 12 }}><Text style={styleGlobal.titleSyn}>{this.state.status}</Text></ScrollView>
                <View style={styleGlobal.viewSyn}>
                    <Button
                        style={{ borderWidth: 2, borderColor: 'black', alignSelf: 'center' }}
                        icon='cloud-upload' mode='outlined'
                        color='#2b2b2b'
                        loading={this.state.syncParcial}
                        loadingProps={{ size: "large", color: '#16273f' }}
                        onPress={() => {
                            if (!this.state.syncParcial) {
                                this.parcial();
                            }
                        }} >
                        Parcial
                    </Button>
                    <Button
                        style={{ borderWidth: 2, borderColor: 'black', alignSelf: 'center' }}
                        icon='cloud-download' mode='outlined'
                        color='#2b2b2b'
                        loading={this.state.syncTotal}
                        loadingProps={{ size: "large", color: '#16273f' }}
                        onPress={() => {
                            if (!this.state.syncTotal) {
                                this.total();
                            }
                        }} >
                        Total
                    </Button>
                </View>
            </View>
        )
    }


}

const mapStateToProps = (state) => {
    return ({
        usuario: state.userReducer.usuario,
        realm: state.registerReducer.realm,
        infoSistema: state.registerReducer.infoSistema,
        unidade: state.userReducer.unidade,
        caixa: state.pdvReducer.caixa
    })
}

export default connect(mapStateToProps, {
    setConfigComercial,
    setCaixaAberto,
    setCaixa,
})(formSincronizar);