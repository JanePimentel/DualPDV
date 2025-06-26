import React, { createRef } from 'react';
import { ScrollView, View, FlatList, Alert, Dimensions, StatusBar } from 'react-native';
import { Icon, ListItem, SearchBar } from 'react-native-elements';
import { connect } from 'react-redux';
import { Text, TextInput, HelperText, Menu, Button, IconButton, Modal, Portal } from 'react-native-paper';
import styleMain from '../../necessary/style/styleMain';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import Spinner from 'react-native-loading-spinner-overlay';
import { Plane, Circle, Flow, Chase, Swing, Grid, Wave } from 'react-native-animated-spinkit';
import styleGlobal from '../../necessary/style/styleGlobal';
import {
    setLoadingStore,
    setLoadingAdd,
    addSacola,
    setIsVendaDireta,
    delItemSacola,
    calcularTotaisSacola,
    limparSacola,
    limparRecebimentos,
    calcularTotalRecebimentos,
} from '../../actions/salesAction';
import { TB_Estoque } from '../../database/DBTables';
import { showMessage, hideMessage } from "react-native-flash-message";
import style from '../../necessary/style/styleLogin';
import { MaskService, TextInputMask } from 'react-native-masked-text';
import Toast from 'react-native-tiny-toast';
import LinearGradient from 'react-native-linear-gradient';

const actionSheetRef = createRef();

class formSale extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            vitrine: [],
            vitrineFull: [],
            vitrineSemPesquisa: [],
            isVisible: true,
            openCart: false,
            search: '',
            load: false,
        }
        this.getProducts();
    }

    componentDidMount() {
        setTimeout(() => this.setState({ isVisible: !this.state.isVisible }), 2500);
    }

    async getProducts() {
        this.props.setLoadingStore(true);

        let rowCount = await this.props.realm.objects(TB_Estoque.name).length;
        let rs = await this.props.realm.objects(TB_Estoque.name);

        let vitrine = [];
        if (rowCount > 0) {
            for (let i = 0; i < rs.length; i++) {
                let produto = await JSON.parse(rs[i].json);
                if (produto.estoque) {
                    vitrine.push({
                        saldo: parseFloat((produto.estoque ? (Array.isArray(produto.estoque) && produto.estoque.length > 0 ? produto.estoque[0].saldoLiquido : produto.estoque.saldoLiquido) : 0)).toFixed(2),
                        precoVenda: parseFloat(produto.precoVenda.precoVenda).toFixed(2),
                        produto: produto,
                        label: produto.nome,
                        qtd: 0,
                        desperdicio: 0,
                        descontoDesperdicio: 0.000,
                        pesoLiquido: 0.000,
                        pesoMedio: 0.000,
                        precoUnitario: parseFloat(produto.precoVenda.precoVenda).toFixed(2),
                        subtotal: 0.000,
                        total: 0.000,
                        isSacola: false,
                    });
                }
            }
            /** Se existir item na sacola,isSacola recebe true para o componente apontar que o item já existe no carrinho*/
            if (vitrine.length > 0 && this.props.sacola.length > 0) {
                for (let index = 0; index < vitrine.length; index++) {
                    for (let i = 0; i < this.props.sacola.length; i++) {
                        if (vitrine[index].produto.id == this.props.sacola[i].idProduto) {
                            vitrine[index].isSacola = true;
                        }
                    }
                }
            }
            this.setState({ vitrine: vitrine, vitrineSemPesquisa: vitrine, vitrineFull: vitrine });
            this.props.setLoadingStore(false);
        }
    }

    updateSearch = search => {
        this.setState({ search });
    };

    search() {
        let res = [];
        this.state.vitrineFull.forEach(i => {
            if (String(i.produto.nome).toLowerCase().includes(String(this.state.search).toLowerCase().trim())) {
                res.push(i);
            }
        })
        if (res.length <= 0) {
            this.setState({ vitrine: this.state.vitrine })
            Toast.show('Produto não encontrado na loja!', {
                position: Toast.position.CENTER,
                containerStyle: {
                    backgroundColor: '#1e1e46',
                    borderRadius: 10,
                },
                textStyle: {
                    color: '#fff',
                },
                imgStyle: {},
                mask: false,
                maskStyle: {},
                duration: 1000,
                animation: true,
            });

        } else {
            this.setState({ vitrine: res })
        }
    }

    cancelSearch() {
        for (let v of this.state.vitrineSemPesquisa) {
            for (let j of this.state.vitrine) {
                if (v.produto.id == j.produto.id) {
                    v.precoUnitario = j.precoUnitario,
                        v.qtd = j.qtd,
                        v.pesoLiquido = j.pesoLiquido,
                        v.subtotal = j.subtotal,
                        v.total = j.subtotal,
                        v.desperdicio = j.desperdicio
                }
            }
        }
        this.setState({ vitrine: this.state.vitrineSemPesquisa, vitrineFull: this.state.vitrineSemPesquisa })
    }

    render() {
        const { height: DEVICE_HEIGHT } = Dimensions.get('window');

        if (this.state.isVisible == true) {
            return (
                DEVICE_HEIGHT > 1100 ?
                    <SkeletonPlaceholder highlightColor='#002269' backgroundColor='#d7d6e5'>
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={160} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                    </SkeletonPlaceholder>
                    :
                    <SkeletonPlaceholder highlightColor='#002269' backgroundColor='#d7d6e5'>
                        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" marginTop='4%'>
                        </SkeletonPlaceholder.Item>
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                    </SkeletonPlaceholder>
            )
        } else if (this.state.vitrine.length <= 0) {
            return (
                <View style={styleMain.viewMain}>
                    <LinearGradient
                        style={styleMain.viewMain}
                        colors={['#1e1e46', '#fffafa']}
                        start={{ x: 0.9, y: 0.3 }}
                        end={{ x: 0.4, y: 0.9 }}
                    >
                        <StatusBar hidden={false}
                            backgroundColor='#003443' />
                        <View style={styleGlobal.viewSecondary}>
                            <View style={{ flex: 5 }}>
                                <View style={[styleGlobal.viewStep, { justifyContent: 'center' }]}>
                                    <Icon size={Dimensions.get("screen").width * 2 / 14} color='red' name="store-slash" type={'font-awesome-5'} />
                                    <View style={{ padding: 16 }}>
                                        <Text style={[styleGlobal.titleListItem, { textTransform: 'none', textAlign: 'center' }]}>{`Ops...\nNo momento não há produtos disponíveis!\nFaça a sincronização do app.`}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            )
        } else {
            return (
                <View style={styleMain.viewMain}>
                    <StatusBar
                        hidden={false}
                        backgroundColor='#1e1e46' />
                    <Spinner
                        visible={this.props.loadingAdd}
                        textContent={'Atualizando sacola...'}
                        textStyle={{ color: 'white', fontSize: RFPercentage(2.9), fontFamily: 'Roboto-Light' }}
                        customIndicator={<Flow size={Dimensions.get("screen").width * 2 / 11} color='#040739' />}
                    />
                    <View style={{ flex: 1 }}>
                        <SearchBar
                            placeholder="Encontre o produto ..."
                            lightTheme={true}
                            round={false}
                            containerStyle={{ backgroundColor: 'transparent', borderRadius: 5, color: '#06686c', }}
                            placeholderTextColor={'gray'}
                            style={{ fontFamily: 'Montserrat-Regular' }}
                            leftIconContainerStyle={{ borderRightWidth: 1, borderColor: 'gray' }}
                            inputContainerStyle={{ backgroundColor: 'transparent' }}
                            showLoading={false}
                            onChangeText={this.updateSearch}
                            onEndEditing={(value) => {
                                this.search();
                            }}
                            value={this.state.search}
                            onClear={(value) => {
                                this.cancelSearch();
                            }}
                        />
                    </View>

                    <View style={{ flex: 6, marginTop: 12 }}>
                        <FlatList
                            removeClippedSubviews={true}
                            data={this.state.vitrine}
                            renderItem={
                                ({ item, index }) => (
                                    <View style={styleGlobal.viewMain}>
                                        <View style={styleGlobal.viewFlatlist}>
                                            <View style={styleGlobal.viewHeader}>
                                                <Text style={styleGlobal.titleInformation}>{String(item.produto.nome).toUpperCase()}</Text>
                                                <View style={styleGlobal.viewPrice}>
                                                    <View>
                                                        <Text style={[styleGlobal.titlePriceItem]}>
                                                            {`Saldo: ${(Number(item.produto.estoque[0].saldoLiquido) / Number(item.produto.qtdVenda)) + Number(item.produto.estoque[0].previsao)}`}
                                                        </Text>
                                                    </View>
                                                    <View>
                                                        <Text style={[styleGlobal.titlePriceItem]}>
                                                            {((Number(item.produto.estoque[0].saldoLiquido) / Number(item.produto.qtdVenda)) + Number(item.produto.estoque[0].previsao) > 0 ? 'Preço: ' + MaskService.toMask('money', parseFloat((item.produto.precoVenda.promocao == 'true' ? item.produto.precoVenda.precoPromocao : item.produto.precoVenda.precoVenda)).toFixed(2), { unit: 'R$', delimiter: '.', separator: ',' }) + (item.produto.precoVenda.valorSeraPorPeso == 'true' ? ' p/KG' : '') : 'Produto Indisponível')}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {item.isSacola == true ?
                                                    <Icon size={Dimensions.get("screen").width * 2 / 27} color='green' name="cart-arrow-down" type="material-community" containerStyle={{ alignSelf: 'flex-end', margin: 4 }} />
                                                    :
                                                    <View />}
                                                <View>
                                                    <View style={styleGlobal.viewStore}>
                                                        <View>
                                                            <Text> {`Qtd`}</Text>
                                                            <TextInput
                                                                mode="flat"
                                                                style={styleGlobal.inputStore}
                                                                render={props =>
                                                                    <TextInputMask
                                                                        {...props}
                                                                        type={'money'}
                                                                        value={item.qtd}
                                                                        onChangeText={(masked, rowValue) => {
                                                                            item.qtd = rowValue;
                                                                        }}
                                                                        onEndEditing={() => {
                                                                            if ((String(this.state.vitrine[index].produto.undVenda.unidade).toLowerCase() === 'kg')) {
                                                                                item.pesoLiquido = item.qtd;
                                                                            }
                                                                        }}
                                                                        includeRawValueInChangeText={true}
                                                                        options={{
                                                                            precision: (item.produto.undVenda.unidade.toLowerCase() == 'kg' ? 3 : 0),
                                                                            separator: ',',
                                                                            delimiter: '.',
                                                                            unit: '',
                                                                        }}
                                                                    />
                                                                }
                                                            />

                                                            <Text> {`Peso (Kg)`}</Text>
                                                            <TextInput
                                                                mode="flat"
                                                                style={styleGlobal.inputStore}
                                                                disabled={String(item.produto.undVenda.unidade).toLowerCase() === 'kg' | String(item.produto.precoVenda.valorSeraPorPeso) === 'true' ? false : true}
                                                                render={props =>
                                                                    <TextInputMask
                                                                        {...props}
                                                                        type={'money'}
                                                                        value={item.pesoLiquido}
                                                                        onChangeText={(masked, rowValue) => {
                                                                            item.pesoLiquido = rowValue;
                                                                        }}
                                                                        onEndEditing={() => {
                                                                            if ((String(this.state.vitrine[index].produto.undVenda.unidade).toLowerCase() === 'kg')) {
                                                                                item.qtd = item.pesoLiquido;
                                                                            }
                                                                        }}
                                                                        includeRawValueInChangeText={true}
                                                                        options={{
                                                                            precision: 3,
                                                                            separator: ',',
                                                                            delimiter: '.',
                                                                            unit: '',
                                                                        }}
                                                                    />
                                                                }
                                                            />
                                                            {
                                                                String(item.produto.precoVenda.valorSeraPorPeso) === 'true' ? <HelperText type="error" visible={true}>O valor será por peso(kg)</HelperText>
                                                                    : <View />
                                                            }
                                                        </View>

                                                        <View>
                                                            <Text> {`Perdas`}</Text>
                                                            <TextInput
                                                                mode="flat"
                                                                style={styleGlobal.inputStore}
                                                                render={props =>
                                                                    <TextInputMask
                                                                        {...props}
                                                                        type={'money'}
                                                                        value={item.desperdicio}
                                                                        onChangeText={(masked, rowValue) => {
                                                                            if (item.qtd && rowValue <= item.qtd) {
                                                                                item.desperdicio = rowValue;
                                                                            } else {
                                                                                Alert.alert('Ops...', 'Perda maior que a quantidade de itens!')
                                                                                item.desperdicio = 0;
                                                                            }
                                                                        }}
                                                                        includeRawValueInChangeText={true}
                                                                        options={{
                                                                            precision: (item.produto.undVenda.unidade.toLowerCase() == 'kg' ? 3 : 0),
                                                                            separator: ',',
                                                                            delimiter: '.',
                                                                            unit: '',
                                                                        }}
                                                                    />
                                                                }
                                                            />
                                                            <Text> {`Preço($)`}</Text>
                                                            <TextInput
                                                                mode="flat"
                                                                style={styleGlobal.inputStore}
                                                                render={props =>
                                                                    <TextInputMask
                                                                        {...props}
                                                                        type={'money'}
                                                                        value={parseFloat(item.precoVenda).toFixed(2)}
                                                                        onChangeText={(masked, rowValue) => {
                                                                            item.precoVenda = rowValue;
                                                                            if (rowValue < item.precoUnitario) {
                                                                                item.desconto = parseFloat(100 - ((item.precoVenda * 100) / item.precoUnitario)).toFixed(2);
                                                                            } else {
                                                                                item.desconto = 0;
                                                                            }
                                                                        }}
                                                                        onEndEditing={(value) => {
                                                                            if (item.precoUnitario > item.precoVenda) {
                                                                                if (item.desconto > item.produto.precoVenda.descontoMax) {
                                                                                    item.precoVenda = item.precoUnitario;
                                                                                    item.desconto = 0;
                                                                                    Alert.alert('Atenção!', 'Desconto não permitido.');
                                                                                }
                                                                            }
                                                                        }}
                                                                        includeRawValueInChangeText={true}
                                                                        options={{
                                                                            precision: 2,
                                                                            separator: ',',
                                                                            delimiter: '.',
                                                                            unit: '',
                                                                        }}
                                                                    />
                                                                }
                                                            />
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </View >
                                )
                            }
                            refreshing={this.props.loadingStore}
                            onRefresh={() => {
                                this.getProducts();
                            }}
                            keyExtractor={(item => String(item.produto.id))}>
                        </FlatList>
                    </View>

                    <View style={[style.viewButtonRegister, { flex: 1 }]}>
                        <Button
                            style={{ width: '58%', alignSelf: 'center', borderWidth: 3 }}
                            icon="cart-arrow-right" mode="outlined"
                            color='#1e1e46'
                            loading={this.props.loadingAdd}
                            loadingProps={{ size: "large", color: '#1e1e46' }}
                            onPress={async () => {
                                this.props.setLoadingAdd(true);
                                this.cancelSearch();
                                for (let index = 0; index < this.state.vitrine.length; index++) {
                                    if (this.state.vitrine[index].pesoLiquido > 0 && this.state.vitrine[index].qtd == 0) {
                                        showMessage({
                                            message: "Atenção!", description: `Informe a quantidade do produto ${this.state.vitrine[index].produto.nome.toLowerCase()}.\n`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                                        });
                                    } else if (String(this.state.vitrine[index].produto.precoVenda.valorSeraPorPeso) === 'true' && this.state.vitrine[index].pesoLiquido <= 0.0 && this.state.vitrine[index].qtd > 0) {
                                        showMessage({
                                            message: "Atenção!", description: `Informe o peso do produto ${this.state.vitrine[index].produto.nome.toLowerCase()}.\nO valor do item será baseado no peso(kg).`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                                        });
                                    } else if (String(this.state.vitrine[index].produto.undVenda.unidade).toLowerCase() === 'kg' && this.state.vitrine[index].pesoLiquido > 0.0 && this.state.vitrine[index].qtd <= 0) {
                                        showMessage({
                                            message: "Atenção!", description: `Informe a qtd do produto ${this.state.vitrine[index].produto.nome.toLowerCase()}.\n`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                                        });
                                    } else if (String(this.state.vitrine[index].produto.undVenda.unidade).toLowerCase() === 'kg' && this.state.vitrine[index].qtd > 0 && this.state.vitrine[index].pesoLiquido <= 0.0) {
                                        showMessage({
                                            message: "Atenção!", description: `Informe a peso do produto ${this.state.vitrine[index].produto.nome.toLowerCase()}.\n`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                                        });
                                    } else if (this.state.vitrine[index].qtd > 0 | (this.state.vitrine[index].pesoLiquido > 0.0 && this.state.vitrine[index].qtd > 0 && String(this.state.vitrine[index].produto.precoVenda.valorSeraPorPeso) === 'true' | String(this.state.vitrine[index].produto.undVenda.unidade) === 'true')) {
                                        this.props.addSacola({
                                            item: (this.props.sacola.length + 1),
                                            produto: this.state.vitrine[index].produto,
                                            idProduto: this.state.vitrine[index].produto.id,
                                            precoVenda: this.state.vitrine[index].precoVenda,
                                            precoUnitario: this.state.vitrine[index].precoUnitario,
                                            qtd: this.state.vitrine[index].qtd,
                                            desperdicio: this.state.vitrine[index].desperdicio,
                                            descontoDesperdicio: this.state.vitrine[index].descontoDesperdicio,
                                            pesoLiquido: this.state.vitrine[index].pesoLiquido,
                                            subtotal: this.state.vitrine[index].subtotal,
                                            desconto: 0,
                                            total: this.state.vitrine[index].subtotal
                                        })
                                        this.setState({ openCart: true });
                                    }
                                }
                                await this.props.calcularTotaisSacola();
                                await this.props.setIsVendaDireta(true);
                                this.props.setLoadingAdd(false);
                            }} >
                            Finalizar
                        </Button>
                    </View>

                    <Portal>
                        <Modal visible={this.state.openCart} onDismiss={() => {
                            this.setState({ openCart: false })
                        }} contentContainerStyle={{ flex: 6 }}>
                            <View style={styleGlobal.viewContainerHistorico}>
                                <View style={{ flex: 6, margin: '4%' }}>
                                    <View style={styleGlobal.viewBox}>
                                        <View style={styleGlobal.viewBoxSubTotal}>
                                            <Text style={styleGlobal.titleSubtotal}>Total</Text>
                                            <Text style={styleGlobal.titleSubtotal}>{MaskService.toMask('money', parseFloat((this.props.total)).toFixed(2), { unit: 'R$ ', delimiter: '.', separator: ',', })}</Text>
                                            <Text style={styleGlobal.subtTitleACtionSheet}>{`SubTotal.:${MaskService.toMask('money', parseFloat(this.props.subtotalSemPerdas).toFixed(2), { unit: 'R$ ', delimiter: '.', separator: ',', })}`}</Text>
                                            <Text style={styleGlobal.subtTitleACtionSheet}>{`Desconto por perdas.:${MaskService.toMask('money', parseFloat((this.props.totalDescontoPerdas)).toFixed(2), { unit: 'R$ ', delimiter: '.', separator: ',', })}`}</Text>
                                            <Text style={styleGlobal.subtTitleACtionSheet}>{`Desconto no total.:${MaskService.toMask('money', parseFloat((this.props.desconto)).toFixed(2), { unit: 'R$ ', delimiter: '.', separator: ',', })}`}</Text>
                                        </View>
                                    </View>

                                    <View style={{ flex: 6 }}>
                                        {
                                            this.props.sacola.length > 0 ?
                                                <ScrollView>
                                                    {/*    <Text style={{ fontFamily: 'Montserrat-SemiBold', textTransform: 'capitalize' }} ><Text>uiooooo</Text></Text> */}
                                                    {
                                                        this.props.sacola.map((item, key) => (
                                                            < ListItem.Swipeable
                                                                key={key}
                                                                leftContent={
                                                                    <Text style={{ fontFamily: 'Montserrat-Bold' }}>{`R$ ${item.precoVenda}`}</Text>
                                                                }
                                                                rightContent={

                                                                    < IconButton
                                                                        icon="delete-circle"
                                                                        color={"red"}
                                                                        size={30}
                                                                        onPress={() => {
                                                                            this.props.delItemSacola(item);
                                                                            this.props.calcularTotaisSacola();
                                                                            this.setState({ load: true });
                                                                        }}
                                                                    />
                                                                }
                                                            >
                                                                <ListItem.Content>
                                                                    <ListItem.Title style={{ fontSize: RFValue(11, 490) }}>{item.produto.nome}</ListItem.Title>
                                                                </ListItem.Content>
                                                                <Text>
                                                                    {item.qtd}
                                                                </Text>
                                                                <Text>
                                                                    {
                                                                        item.pesoLiquido ? item.pesoLiquido : ''
                                                                    }
                                                                </Text>
                                                                <ListItem.Chevron color="red" size={23} />
                                                            </ListItem.Swipeable>
                                                        ))
                                                    }
                                                    {
                                                        this.props.sacola.length > 0 ?
                                                            <Menu.Item icon="delete-circle" onPress={async () => {
                                                                await this.props.limparSacola();
                                                                await this.props.calcularTotaisSacola();
                                                                this.setState({ load: true })
                                                            }} title="Limpar Sacola" style={{ alignSelf: 'center' }} />
                                                            : <View />
                                                    }
                                                </ScrollView>
                                                :
                                                <View style={{ flex: 6 }}>
                                                    <View style={styleGlobal.viewNenhum}>
                                                        <Icon size={62} color="#FF6347" name="shopping-basket" type={'font-awesome-5'} />
                                                        <Text style={styleGlobal.titleCesta}>Sua sacola está vazia!</Text>
                                                    </View>
                                                </View>
                                        }

                                    </View>
                                    {
                                        this.props.sacola.length > 0 ?
                                            <View style={[style.viewButtonRegister, { flex: 1 }]}>
                                                <Button
                                                    style={{ width: '58%', alignSelf: 'center', borderWidth: 3 }}
                                                    icon="cash-plus" mode="outlined"
                                                    color='#1e1e46'
                                                    loading={this.props.loadingAdd}
                                                    loadingProps={{ size: "large", color: '#16273f' }}
                                                    onPress={async () => {
                                                        this.props.recebimentos.length > 0 ? this.props.limparRecebimentos() : '';
                                                        this.props.calcularTotalRecebimentos();
                                                        this.props.calcularTotaisSacola();
                                                        this.setState({ openCart: false });
                                                        this.props.navigation.navigate('closeSale');
                                                    }} >
                                                    Receber
                                                </Button>
                                            </View>
                                            :
                                            <View />}
                                </View>
                            </View>
                        </Modal >
                    </Portal >
                </View >
            )
        }
    }
}

const mapStateToProps = (state) => ({
    usuario: state.userReducer.usuario,
    realm: state.registerReducer.realm,
    caixa: state.pdvReducer.caixa,
    caixaAberto: state.pdvReducer.caixaAberto,
    infoSistema: state.registerReducer.infoSistema,
    unidade: state.userReducer.unidade,
    configComercial: state.configReducer.configComercial,
    loadingStore: state.salesReducer.loadingStore,
    loadingAdd: state.salesReducer.loadingAdd,
    sacola: state.salesReducer.sacola,
    total: state.salesReducer.total,
    subtotal: state.salesReducer.subtotal,
    desconto: state.salesReducer.desconto,
    totalItensSacola: state.salesReducer.totalItensSacola,
    subtotalSemPerdas: state.salesReducer.subtotalSemPerdas,
    totalDescontoPerdas: state.salesReducer.totalDescontoPerdas,
    isVendaDireta: state.salesReducer.isVendaDireta,
    recebimentos: state.salesReducer.recebimentos,
})

export default connect(mapStateToProps, {
    setLoadingStore,
    setLoadingAdd,
    addSacola,
    delItemSacola,
    setIsVendaDireta,
    calcularTotaisSacola,
    limparSacola,
    limparRecebimentos,
    calcularTotalRecebimentos,
})(formSale);