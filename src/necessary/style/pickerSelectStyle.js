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

const pickerSelectStylesCheckout = StyleSheet.create({
    inputIOS: {
        fontFamily: 'Montserrat-Regular',
       // fontSize: RFValue(12, 470),
        paddingHorizontal: 10,
        paddingVertical: 8,
        // borderWidth: 0.5,
        // elevation: 7, 
        borderColor: '#040739',
        borderRadius: 5,
        color: '#16273f',
        paddingRight: 30,
        backgroundColor: 'white',
        textTransform: 'capitalize',
        margin: 4
    },
    inputAndroid: {
        fontFamily: 'Montserrat-Regular',
       // fontSize: RFValue(12, 470),
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 0.5,
        // elevation: 7, 
        borderColor: '#040739',
        borderRadius: 5,
        color: '#16273f',
        paddingRight: 30,
        backgroundColor: 'white',
        textTransform: 'capitalize',
        margin: 4
    },
});


export default pickerSelectStylesCheckout;