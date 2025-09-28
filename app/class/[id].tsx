import { addStudent, getStudentsByClass } from "@/db/database";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { Button, Modal, Portal, Provider, TextInput } from "react-native-paper";

export default function ClassDetail() {
    const [studentName, setStudentName] = useState('');
  const { id, name } = useLocalSearchParams();
  const [students, setStudents] = useState<any[]>([]);
   const [visible, setVisible] = useState(false);

  useEffect(() => {
    (async () => {
      if (id) {
        const result = await getStudentsByClass(Number(id));
        setStudents(result);
      }
    })();
  }, [id]);

  const toggleOverlay = () => setVisible(!visible);

  async function handleAddStudent() {
    if (studentName.trim().length === 0) return;   
    Alert.alert("Successfully Added : " + studentName); 
      await addStudent(studentName, Number(id));
      const updated = await getStudentsByClass(Number(id));
      setStudents(updated);
      setStudentName('');
      setVisible(false);
  }
  

  return (
    <Provider>

    <View style={{ flex: 1, padding: 20 }}>
      <View
        style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 20 }}>Class ID: {id}</Text>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>{name}</Text>
      </View>
        <View>
            <Button mode="contained" onPress={toggleOverlay}>Add Student</Button>
        </View>
      {students.length === 0 ? (
        <Text style={{ textAlign: "center", fontSize: 16 }}>No students found</Text>
    ) : (
        <FlatList
        data={students}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
            <View
            style={{
                padding: 15,
                borderBottomWidth: 1,
                borderBottomColor: "#ccc",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
            }}
            >
              <Text style={{ fontSize: 18 }}>{item.name}</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
              <Button mode="contained" onPress={() => {}}>Present</Button>
              <Button  mode="contained"
                buttonColor="red"       // 🔴 background color
                textColor="white"   onPress={() => {}}>Absent</Button>
              </View>
            </View>
          )}
          />
      )}

        <Portal>
          <Modal
            visible={visible}
            onDismiss={() => setVisible(false)}
            contentContainerStyle={{
                backgroundColor: "white",
                padding: 20,
                marginHorizontal: 20,
                borderRadius: 8
            }}
            >
            <Text style={{ marginBottom: 10 }}>Enter Student Name</Text>
            <TextInput
              mode="outlined"
              value={studentName}
              onChangeText={setStudentName}
              placeholder="Student Full Name"
              style={{ marginBottom: 20 }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Button
                onPress={() => setVisible(false)}
                style={{ marginRight: 10 }}
                mode="contained-tonal"
                >
                Cancel
              </Button>
              <Button onPress={handleAddStudent} mode="contained">Add</Button>
            </View>
          </Modal>
        </Portal>
    </View>
                  </Provider>
  );
}
