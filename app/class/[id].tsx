import Navbar from "@/components/navbar";
import {
  addStudent,
  getAttendanceByStudent,
  getAttendanceForClass,
  markAttendance,
  updateStudent
} from "@/db/database";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, ScrollView, Text, useColorScheme, View } from "react-native";
import { Button, IconButton, Modal, Portal, Provider, TextInput } from "react-native-paper";

export default function ClassDetail() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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

  // Modal for selecting attendance status
  const [isOpenStatusModal, setIsOpenStatusModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // History modal states
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyName, setHistoryName] = useState({ name: "", gender: "" });

  const [editVisible, setEditVisible] = useState(false);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);
  const [editStudent, setEditStudent] = useState({
    id: null,
    name: "",
    gender: "",
  });

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
      const result = await addStudent(studentName, Number(id), studentData.gender);
      if (result.success) {
        Alert.alert("Student Added Successfully");
        setStudentName("");
        setStudentData({ id: null, name: "", gender: "" }); // Reset form
        setVisible(false);
        refresh();
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      const e = error as Error;
      Alert.alert("Error", e.message || "An error occurred while saving the student.");
    }
  }

  function handleGenderChange(gender: string) {
    setStudentData({ ...studentData, gender });
  }

  function handleEditGenderChange(gender: string) {
    setEditStudent({ ...editStudent, gender });
  }

  async function handleMark(studentId: number, status: 'present' | 'absent' | 'excused' | 'cutting') {
    await markAttendance(studentId, dateToday, status);
    refresh();
  }

  async function showHistory(studentId: number, studentName: string, studentGender: string) {
    const records = await getAttendanceByStudent(studentId);
    setHistoryData(records);
    setHistoryName({ name: studentName, gender: studentGender });
    setHistoryVisible(true);
  }

  async function handleEditStudent() {
    if (!editStudentId || !editStudent.name.trim() || !editStudent.gender) {
      Alert.alert("Error", "Please enter name and select gender.");
      return;
    }
    try {
      const response = await updateStudent(editStudentId, editStudent.name, editStudent.gender);
      if (response.success) {
        Alert.alert("Student Updated Successfully");
        setEditVisible(false);
        setEditStudentId(null);
        setEditStudent({ id: null, name: "", gender: "" });
        refresh();
      }
      else {
        Alert.alert("Error", response.message);
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "An error occurred while saving the student.");
    }
  }

  function openEditModal(student: any) {
    setEditStudentId(student.id);
    setEditStudent({
      id: student.id,
      name: student.name,
      gender: student.gender
    });
    setEditVisible(true);
  }

  function openStatusModal(student: any) {
    setSelectedStudent(student);
    setIsOpenStatusModal(true);
  }

  function closeStatusModal() {
    setIsOpenStatusModal(false);
    setSelectedStudent(null);
  }

  return (
    <Provider>
      <Navbar />
      <View style={{ flex: 1, padding: 20, backgroundColor: isDark ? "#18191A" : "#fff" }}>
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 20, color: isDark ? "#fff" : "#222" }}>
            Today: {new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: '2-digit' }).format(new Date(dateToday))}
          </Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: isDark ? "#fff" : "#222" }}>{name}</Text>
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
              <Text style={{ fontSize: 18, color: isDark ? "#fff" : "#222" }}>No students found</Text>
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
              <Text style={{ fontSize: 12, color: isDark ? "#fff" : "#222" }}>{item.name}</Text>
              {item.status ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: item.status === "present" ? "green"
                        : item.status === "excused" ? "goldenrod"
                          : item.status === "cutting" ? "orangered"
                            : "red"
                    }}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                  <IconButton
                    icon="menu"
                    size={20}
                    mode="contained-tonal"
                    onPress={() => openStatusModal(item)}
                  />
                  <IconButton
                    icon="history"
                    size={20}
                    mode="contained-tonal"
                    onPress={() => showHistory(item.id, item.name, item.gender)}
                  />
                  <IconButton
                    icon="account-edit"
                    size={20}
                    mode="contained-tonal"
                    onPress={() => openEditModal(item)}
                  />
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 2 }}>
                  <IconButton
                    icon="menu"
                    size={20}
                    mode="contained"
                    containerColor="dodgerblue"
                    iconColor="white"
                    onPress={() => openStatusModal(item)}
                  />
                  <IconButton
                    icon="history"
                    size={20}
                    mode="contained-tonal"
                    onPress={() => showHistory(item.id, item.name, item.gender)}
                  />
                  <IconButton
                    icon="account-edit"
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
          {/* Student Add Modal */}
          <Modal visible={visible} onDismiss={() => setVisible(false)}
            contentContainerStyle={{ backgroundColor: isDark ? "#18191A" : "#fff", padding: 20, marginHorizontal: 20, borderRadius: 8 }}>
            <Text style={{ marginBottom: 10, color: isDark ? "#fff" : "#222" }}>Enter Student Name</Text>
            <TextInput
              mode="outlined"
              value={studentName}
              onChangeText={setStudentName}
              placeholder="Dela Cruz, Juan B."
              style={{ marginBottom: 20 }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              <Button
                style={{ flex: 1, marginRight: 8 }}
                mode={studentData.gender === "male" ? "contained" : "outlined"}
                onPress={() => handleGenderChange("male")}
              >
                <Text style={{ color: isDark ? "#fff" : "#222" }}>Male</Text>
              </Button>
              <Button
                style={{ flex: 1, marginLeft: 8 }}
                mode={studentData.gender === "female" ? "contained" : "outlined"}
                onPress={() => handleGenderChange("female")}
              >
                <Text style={{ color: isDark ? "#fff" : "#222" }}>Female</Text>
              </Button>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Button onPress={() => setVisible(false)} style={{ marginRight: 10 }}>Cancel</Button>
              <Button mode="contained" onPress={handleAddStudent}>Add</Button>
            </View>
          </Modal>

          {/* Status Modal */}
          <Modal
            visible={isOpenStatusModal}
            onDismiss={closeStatusModal}
            contentContainerStyle={{
              backgroundColor: isDark ? "#18191A" : "#fff",
              padding: 20,
              marginHorizontal: 20,
              borderRadius: 8,
              alignItems: "center"
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 10, color: isDark ? "#fff" : "#222" }}>
              Set Status for {selectedStudent?.name}
            </Text>
            {["present", "absent", "excused", "cutting"].map(status => (
              <Button
                key={status}
                mode="contained"
                style={{ marginVertical: 6, width: 140 }}
                buttonColor={
                  status === "present" ? "green"
                    : status === "absent" ? "red"
                      : status === "excused" ? "gold"
                        : "orangered"
                }
                onPress={async () => {
                  await handleMark(selectedStudent.id, status as "present" | "absent" | "excused" | "cutting");
                  closeStatusModal();
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
            <Button onPress={closeStatusModal} style={{ marginTop: 10 }}>
              Cancel
            </Button>
          </Modal>

          {/* History Modal */}
          <Modal
            visible={historyVisible}
            onDismiss={() => setHistoryVisible(false)}
            contentContainerStyle={{
              backgroundColor: isDark ? "#18191A" : "#fff",
              padding: 20,
              marginHorizontal: 20,
              borderRadius: 8,
              maxHeight: "80%"
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10, color: isDark ? "#fff" : "#222" }}>
              Attendance History
            </Text>
            <View>
              <Text style={{ color: isDark ? "#fff" : "#222", marginBottom: 10, fontSize: 20 }}>
                {historyName.name} ({historyName.gender === "male" ? "Male" : "Female"})
              </Text>
            </View>
            {historyData.length === 0 ? (
              <Text style={{ color: isDark ? "#fff" : "#222" }}>No attendance records found</Text>
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
                      borderBottomColor: isDark ? "#444" : "#ccc",
                    }}
                  >
                    <Text style={{ color: isDark ? "#fff" : "#222" }}>{new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "2-digit" }).format(new Date(rec.date))}</Text>
                    <Text
                      style={{
                        color: rec.status === "present" ? "green"
                          : rec.status === "excused" ? "goldenrod"
                            : rec.status === "cutting" ? "orangered"
                              : "red",
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

          {/* Edit Modal */}
          <Modal
            visible={editVisible}
            onDismiss={() => setEditVisible(false)}
            contentContainerStyle={{
              backgroundColor: isDark ? "#18191A" : "#fff",
              padding: 20,
              marginHorizontal: 20,
              borderRadius: 8
            }}
          >
            <Text style={{ marginBottom: 10, color: isDark ? "#fff" : "#222" }}>Edit Student Name</Text>
            <TextInput
              mode="outlined"
              value={editStudent.name}
              onChangeText={name => setEditStudent({ ...editStudent, name })}
              placeholder="Student Full Name"
              style={{ marginBottom: 20 }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              <Button
                style={{ flex: 1, marginRight: 8 }}
                mode={editStudent.gender === "male" ? "contained" : "outlined"}
                onPress={() => handleEditGenderChange("male")}
              >
                <Text style={{ color: isDark ? "#fff" : "#222" }}>Male</Text>
              </Button>
              <Button
                style={{ flex: 1, marginLeft: 8 }}
                mode={editStudent.gender === "female" ? "contained" : "outlined"}
                onPress={() => handleEditGenderChange("female")}
              >
                <Text style={{ color: isDark ? "#fff" : "#222" }}>Female</Text>
              </Button>
            </View>
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
