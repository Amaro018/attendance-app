import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Navbar() {
  return (
    <View style={styles.container}>
      <Link href="/" style={{ marginRight: 10 }}>
        <Text style={styles.title}>Attendance App</Text>
      </Link>
      <Text>Made with ❤️ by <Link href="https://github.com/Amaro018" style={{ color: "blue" }}>Jhomari Amaro</Link></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
