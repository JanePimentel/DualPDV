import React, { Component } from "react";
import style from "../../necessary/style/styleLogin";
import { View, StatusBar, Image } from 'react-native';

class formSplash extends Component {
    constructor(props) {
        super(props);

     setTimeout(() => {
            props.navigation.navigate('Splash')
        }, 2000);
    }
    render() {
        return (
            <View style={style.viewMainRegister}>
                <StatusBar hidden={true} />
                <Image style={style.logoSplashScreen} source={require("../../imgs/.png")} />
            </View>
        )
    }
}
export default formSplash;