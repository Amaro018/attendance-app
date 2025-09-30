import Navbar from "@/components/navbar";
import {
  addStudent,
  getAttendanceByStudent,
  getAttendanceForClass,
  markAttendance,
  updateStudentName
} from "@/db/database";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, ScrollView, Text, View } from "react-native";
import { Button, IconButton, Modal, Portal, Provider, TextInput } from "react-native-paper";




export default function ClassDetail() {
  const dateToday = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const { id, name } = useLocalSearchParams();
  const [students, setStudents] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [studentName, setStudentName] = useState("");

  const [studentData, setStudentData] = useState({
    id: null,
    name: "",
    gender: "",
  });


  // ✅ history modal states
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyName, setHistoryName] = useState("");

  const [editVisible, setEditVisible] = useState(false);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);
  const [editStudentName, setEditStudentName] = useState("");

  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"
  const [genderFilter, setGenderFilter] = useState(""); // "", "male", "female"


  const filteredStudents = students
    .filter((student) => !genderFilter || student.gender === genderFilter)
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );



  async function refresh() {
    if (id) {
      const result = await getAttendanceForClass(Number(id), dateToday);
      setStudents(result);
    }
  }

  useEffect(() => {
    refresh();
  }, [id]);

  async function handleAddStudent() {
    if (!studentName.trim() || !studentData.gender) {
      Alert.alert("Error", "Please enter name and select gender.");
      return;
    }

    try {
      await addStudent(studentName, Number(id), studentData.gender);
      Alert.alert("Student Added Successfuly");
      setStudentName("");
      setStudentData({ id: null, name: "", gender: "" }); // Reset form
      setVisible(false);
      refresh();
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "An error occurred while saving the student.");
    }
  }


  function handleGenderChange(gender: string) {
    setStudentData({ ...studentData, gender });
  }

  async function handleMark(studentId: number, status: 'present' | 'absent') {
    await markAttendance(studentId, dateToday, status);
    refresh();
  }

  // ✅ fetch and show history
  async function showHistory(studentId: number, studentName: string) {
    const records = await getAttendanceByStudent(studentId);
    setHistoryData(records);
    setHistoryName(studentName);
    setHistoryVisible(true);
  }

  async function handleEditStudent() {
    if (!editStudentId || !editStudentName.trim()) return;
    try {
      await updateStudentName(editStudentId, editStudentName.trim());
      Alert.alert("Student Updated Successfuly");
      setEditVisible(false);
      setEditStudentId(null);
      setEditStudentName("");
      refresh();
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "An error occurred while saving the student.");
    }
  }

  function openEditModal(student: any) {
    setEditStudentId(student.id);
    setEditStudentName(student.name);
    setEditVisible(true);
  }

  return (
    <Provider>
      <Navbar />
      <View style={{ flex: 1, padding: 20 }}>

        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 20 }}>
            Today: {new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: '2-digit' }).format(new Date(dateToday))}
          </Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>{name}</Text>
          <Button mode="contained" onPress={() => setVisible(true)}>Add Student</Button>

        </View>

        <View style={{ flexDirection: 'row', margin: 10 }}>
          <Button
            mode={genderFilter === "" ? "contained" : "outlined"}
            onPress={() => setGenderFilter("")}
            style={{ marginRight: 5 }}
          >
            All
          </Button>
          <Button
            mode={genderFilter === "male" ? "contained" : "outlined"}
            onPress={() => setGenderFilter("male")}
            style={{ marginRight: 5 }}
          >
            Male
          </Button>
          <Button
            mode={genderFilter === "female" ? "contained" : "outlined"}
            onPress={() => setGenderFilter("female")}
            style={{ marginRight: 15 }}
          >
            Female
          </Button>
          <Button
            mode="outlined"
            icon={sortOrder === "asc" ? "sort-alphabetical-ascending" : "sort-alphabetical-descending"}
            onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "A-Z" : "Z-A"}
          </Button>
        </View>


        <FlatList
          style={{ marginTop: 20 }}
          ListEmptyComponent={
            <View style={{ padding: 30, alignItems: "center" }}>
              <Text style={{ color: "gray", fontSize: 18 }}>No students found</Text>
            </View>
          }
          data={filteredStudents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{
              padding: 15,
              borderBottomWidth: 1,
              borderBottomColor: "#ccc",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <Text style={{ fontSize: 12 }}>{item.name}</Text>

              {item.status ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: item.status === "present" ? "green" : "red"
                    }}
                  >
                    {item.status.toUpperCase()}
                  </Text>

                  <IconButton
                    icon="pencil"          // 🔹 MaterialCommunity icon name (e.g. "pencil", "undo", "edit")
                    size={20}              // icon size
                    mode="contained-tonal" // optional background style
                    onPress={() =>
                      Alert.alert(
                        "Confirm Undo",
                        `Are you sure you want to change ${item.name}'s status?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Yes",
                            style: "destructive",
                            onPress: () =>
                              handleMark(
                                item.id,
                                item.status === "present" ? "absent" : "present"
                              ),
                          },
                        ]
                      )
                    }
                  />
                  <IconButton
                    icon="history"      // 🔹 or try "clock-outline", "calendar-clock"
                    size={20}
                    mode="contained-tonal" // optional background
                    onPress={() => showHistory(item.id, item.name)}
                  />
                  <IconButton
                    icon="account-edit"    // ✏️ student name edit
                    size={20}
                    mode="contained-tonal"
                    onPress={() => openEditModal(item)}
                  />
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 2 }}>
                  <IconButton
                    icon="check-circle"      // ✅ Present icon
                    size={20}
                    mode="contained"
                    containerColor="green"   // background circle
                    iconColor="white"        // icon color
                    onPress={() => handleMark(item.id, "present")}
                  />

                  <IconButton
                    icon="close-circle"      // ❌ Absent icon
                    size={20}
                    mode="contained"
                    containerColor="red"
                    iconColor="white"
                    onPress={() => handleMark(item.id, "absent")}
                  />
                  <IconButton
                    icon="history"      // 🔹 or try "clock-outline", "calendar-clock"
                    size={20}
                    mode="contained-tonal" // optional background
                    onPress={() => showHistory(item.id, item.name)}
                  />
                  <IconButton
                    icon="account-edit"    // ✏️ student name edit
                    size={20}
                    mode="contained-tonal"
                    onPress={() => openEditModal(item)}
                  />
                </View>
              )}
            </View>
          )}
        />

        <Portal>
          <Modal visible={visible} onDismiss={() => setVisible(false)}
            contentContainerStyle={{ backgroundColor: "white", padding: 20, marginHorizontal: 20, borderRadius: 8 }}>
            <Text style={{ marginBottom: 10 }}>Enter Student Name</Text>
            <TextInput
              mode="outlined"
              value={studentName}
              onChangeText={setStudentName}
              placeholder="Student Full Name"
              style={{ marginBottom: 20 }}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              <Button
                style={{
                  backgroundColor: studentData.gender === "male" ? "blue" : "pink",
                  flex: 1,
                  marginRight: 8,
                }}
                onPress={() => handleGenderChange("male")}
              >
                <Text style={{ color: "white" }}>Male</Text>
              </Button>
              <Button
                mode="contained"
                style={{
                  backgroundColor: studentData.gender === "female" ? "blue" : "pink",
                  flex: 1,
                  marginLeft: 8,
                }}
                onPress={() => handleGenderChange("female")}
              >
                <Text style={{ color: "white" }}>Female</Text>
              </Button>
            </View>


            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Button onPress={() => setVisible(false)} style={{ marginRight: 10 }}>Cancel</Button>
              <Button mode="contained" onPress={handleAddStudent}>Add</Button>
            </View>
          </Modal>


          {/* ✅ History Modal */}
          <Modal
            visible={historyVisible}
            onDismiss={() => setHistoryVisible(false)}
            contentContainerStyle={{
              backgroundColor: "white",
              padding: 20,
              marginHorizontal: 20,
              borderRadius: 8,
              maxHeight: "80%"
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
              Attendance History - {historyName}
            </Text>
            {historyData.length === 0 ? (
              <Text>No attendance records found</Text>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {historyData.map((rec, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: 6,
                      borderBottomWidth: 1,
                      borderBottomColor: "#eee"
                    }}
                  >
                    <Text>{new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "2-digit" }).format(new Date(rec.date))}</Text>
                    <Text
                      style={{
                        color: rec.status === "present" ? "green" : "red",
                        fontWeight: "bold"
                      }}
                    >
                      {rec.status.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={{ marginTop: 20, alignItems: "flex-end" }}>
              <Button mode="contained" onPress={() => setHistoryVisible(false)}>
                Close
              </Button>
            </View>
          </Modal>


          <Modal
            visible={editVisible}
            onDismiss={() => setEditVisible(false)}
            contentContainerStyle={{
              backgroundColor: "white",
              padding: 20,
              marginHorizontal: 20,
              borderRadius: 8
            }}
          >
            <Text style={{ marginBottom: 10 }}>Edit Student Name</Text>
            <TextInput
              mode="outlined"
              value={editStudentName}
              onChangeText={setEditStudentName}
              placeholder="Student Full Name"
              style={{ marginBottom: 20 }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Button onPress={() => setEditVisible(false)} style={{ marginRight: 10 }}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleEditStudent}>
                Save
              </Button>
            </View>
          </Modal>

        </Portal>
      </View>
    </Provider>
  );
}
