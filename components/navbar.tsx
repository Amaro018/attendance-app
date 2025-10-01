import { Link } from 'expo-router';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

export default function Navbar() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={[
      styles.container,
      isDark && { backgroundColor: "#18191A", shadowColor: "#fff" }
    ]}>
      <Link href="/" style={{ marginRight: 10 }}>
        <Text style={[
          styles.title,
          isDark && { color: "#fff" }
        ]}>
          Attendance App
        </Text>
      </Link>
      <Text style={{ color: isDark ? "#fff" : "#222" }}>
        Made with ❤️ by{" "}
        <Link
          href="https://github.com/Amaro018"
          style={{ color: isDark ? "#58a6ff" : "blue" }}
        >
          Jhomari Amaro
        </Link>
      </Text>
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
