import { Link } from 'expo-router';
import { Text, View, useColorScheme } from 'react-native';
import { Button } from 'react-native-paper';

export default function Navbar() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 10, backgroundColor: isDark ? "#18191A" : "#fff", paddingTop: 50
    }}>
      <View style={{ flex: 1, flexDirection: "column", justifyContent: "center", gap: 10 }}>
        <Link href="/" style={{ marginRight: 10 }}>
          <Text style={{ color: isDark ? "#fff" : "#222", fontSize: 20, fontWeight: "bold" }}>
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
      <Link href="/">
        <Button icon="home" mode="outlined" >home</Button>
      </Link>
    </View >
  );
}
