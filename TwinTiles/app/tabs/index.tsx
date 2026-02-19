import {View, Text, StyleSheet} from 'react-native'

export default function Home(){
    return (
        <View>
            <Text>Home Screen</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
})