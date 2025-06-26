import { StyleSheet, Dimensions, PixelRatio} from "react-native";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";

const widthPercentageToDP = widthPercent => {
    const screenWidth = Dimensions.get('window').width;
    return PixelRatio.roundToNearestPixel(screenWidth * parseFloat(widthPercent) / 100);
};

const heightPercentageToDP = heightPercent => {
    const screenHeight = Dimensions.get('window').height;
    return PixelRatio.roundToNearestPixel(screenHeight * parseFloat(heightPercent) / 100);
};

const pickerSelectStylesLogin = StyleSheet.create({
    inputIOS: {
        fontFamily: 'FiraSans-Regular',
       // fontSize: RFValue(12, 670),
        paddingHorizontal: 10,
        paddingVertical:13,
        borderRadius: 6,
        elevation:2,
        color:'black',
        paddingRight: 30,
        backgroundColor:'white',
        margin:4
    },
    inputAndroid: {
        fontFamily: 'FiraSans-Regular',
       // fontSize: RFValue(12, 670),
        paddingHorizontal: 10,
        paddingVertical:13,
        borderRadius: 6,
        elevation:2,
        color:'black',
        paddingRight: 30,
        backgroundColor:'white',
        margin:4
    },
});

export default pickerSelectStylesLogin;