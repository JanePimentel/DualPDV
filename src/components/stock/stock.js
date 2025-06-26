import React, { createRef } from 'react';
import { ScrollView, FlatList, View, Platform, PermissionsAndroid, TouchableOpacity, Alert, Dimensions, StatusBar, Modal } from 'react-native';
import { connect } from 'react-redux';
import { Text, TextInput, Divider, Button, Menu, IconButton, FAB } from 'react-native-paper';
import styleMain from '../../necessary/style/styleMain';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { formatStringDateToDDMMAAAA } from '../../necessary/dateAndHour/dateHour';
import { Wave, Grid } from 'react-native-animated-spinkit';
import styleGlobal from '../../necessary/style/styleGlobal';
import { TB_Vendas, TB_ConfigPrint, TB_Estoque } from '../../database/DBTables';
import { MaskService } from 'react-native-masked-text';
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import {
    BluetoothManager,
} from 'react-native-bluetooth-escpos-printer';
import { setPrint } from '../../actions/configAction';
import DatePicker from 'react-native-datepicker';
import Icon from 'react-native-vector-icons/FontAwesome5'
import {
    ListItem,
} from 'react-native-elements'
import { printVenda, bluetoothEnable, enableBluetooth } from '../../necessary/Print';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import {
    SearchBar
} from 'react-native-elements'

const actionSheetRef = createRef();

class formReportStock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            estoque: [],
            estoqueFull:[],
            search:'',
            loadingStock: false,
            isVisible: true,
            vendas: [],
            filePath: '',
            data: '',
            loadingSearch: false,
            isModalVisible: false,
            venda: null,
            filePathDetail: ''
        }
        this.getProducts();
    }

    updateSearch = search => {
        this.setState({ search });
    };
    
    componentDidMount() {
        setTimeout(() => this.setState({ isVisible: !this.state.isVisible }), 2500);
    }


    async getProducts() {
        let estoque = [];

        this.setState({ loadingStock: true })
        let arrayFormatado = await this.props.realm.objects(TB_Estoque.name);
        for (let i = 0; i < arrayFormatado.length; i++) {
            let value = await JSON.parse(arrayFormatado[i].json);
            console.log(value)
            estoque.push(value)
        }
        this.setState({ estoque: estoque,estoqueFull:estoque, loadingStock: false })
    }

  
    search() {
        let res = [];
        this.state.estoqueFull.forEach(i => {
            if (String(i.nome).toLowerCase().includes(String(this.state.search).toLowerCase().trim())) {
                res.push(i);
            }
        })
        if (res.length <= 0) {
            this.setState({ estoque: this.state.estoque })
            Toast.show('Produto não encontrado na loja', {
                position: Toast.position.CENTER,
                containerStyle: {
                    backgroundColor: 'blue',
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
            this.setState({ estoque: res })
        }
    }

    cancelSearch() {
        this.setState({ estoque: this.state.estoqueFull })
    }


    render() {
        const { height: DEVICE_HEIGHT } = Dimensions.get('window');
        if (this.state.isVisible == true) {
            return (
                DEVICE_HEIGHT > 1100 ?
                    <SkeletonPlaceholder highlightColor='#002269' backgroundColor='#d7d6e5'>
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={80} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                    </SkeletonPlaceholder>
                    :
                    <SkeletonPlaceholder highlightColor='#002269' backgroundColor='#d7d6e5'>
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                    </SkeletonPlaceholder>
            )
        } else {
            return (
                <View style={styleMain.viewMain}>
                    <StatusBar
                        hidden={false}
                        backgroundColor='#1e1e46' />
                    <View style={{margin: 12, alignItems: 'center' }}>
                    <SearchBar
                        placeholder="Encontre o produto ..."
                        lightTheme={true}
                        round={false}
                        containerStyle={{ width:345, elevation: 3, backgroundColor: 'white', borderRadius: 5, color: '#06686c' }}
                        placeholderTextColor={'gray'}
                        style={{ fontFamily: 'Montserrat-Regular'}}
                        leftIconContainerStyle={{ borderRightWidth: 1, borderColor: 'gray' }}
                        inputContainerStyle={{ backgroundColor: 'white' }}
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

                    {

                        (this.state.estoque.length <= 0 ?
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <View>
                                    <Icon size={Dimensions.get("screen").width * 2 / 18} color='#1e1e46' name="sitemap" type={'font-awesome-5'} />
                                </View>
                                <Text style={styleGlobal.titleReportSale}>Não há produtos disponíveis!</Text>
                                <FAB
                                    style={{ backgroundColor: 'white' }}
                                    label='Atualizar página'
                                    small
                                    icon="cached"
                                    onPress={() => {
                                
                                    }}
                                />
                            </View>
                            :
                            <View style={{ flex: 5, marginTop: '3%' }}>
                                <FlatList
                                    scrollEnabled={true}
                                    data={this.state.estoque}
                                    renderItem={({ item, index }) => (
                                        <ListItem key={index}
                                            bottomDivider
                                            containerStyle={{ elevation: 3, borderRadius: 5,margin:4 }}
                                            onPress={() => {
                                                this.setState({ isModalVisible: true });
                                            }}
                                        >
                                            {/* <Avatar rounded icon={{ name: 'home', color:'#800000' }} /> */}
                                            <ListItem.Content>
                                                <ListItem.Title style={{ fontFamily: 'Montserrat-Bold' }}>{item.nome}</ListItem.Title>
                                                <ListItem.Subtitle>{
                                                    <View>
                                                        {/*   <Text>{`Venda nº ${(item.id ? item.id : 'Falta Sincronizar')}`}</Text> */}
                                                        <Text>{`${MaskService.toMask('money', parseFloat(item.precoVenda.precoVenda).toFixed(2), {
                                                            unit: 'R$',
                                                            separator: ',',
                                                            delimiter: '.'
                                                        })}`}</Text>
                                                          <Text>{`${(item.estoque != undefined && item.estoque != null && item.estoque.length > 0 && parseFloat(item.estoque[0].saldoLiquido).toFixed(0) > 0 ? parseFloat(item.estoque[0].saldoLiquido).toFixed(0) : 'Indisponível')}`}</Text>
                                                    </View>
                                                }</ListItem.Subtitle>
                                            </ListItem.Content>
                                        </ListItem>)
                                    }
                                    keyExtractor={(item, index) => index.toString()}
                                    refreshing={this.state.loadingStock}
                                    onRefresh={() => {
                                        this.getProducts
                                    }}
                                />
                            </View>
                        )
                    }
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
    cliente: state.salesReducer.cliente,
    print: state.configReducer.print,
})

export default connect(mapStateToProps, {
    setPrint,
})(formReportStock);