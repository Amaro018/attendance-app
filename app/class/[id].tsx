import Navbar from "@/components/navbar";
import {
  addStudent,
  deleteStudent,
  getAttendanceByStudent,
  getAttendanceForClass,
  getClassAttendanceByMonth,
  markAllPresent,
  markAttendance,
  updateStudent
} from "@/db/database";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Platform, ScrollView, Text, ToastAndroid, useColorScheme, View } from "react-native";
import { Button, Chip, IconButton, Modal, Portal, Provider, TextInput } from "react-native-paper";
import * as XLSX from 'xlsx';

export default function ClassDetail() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { id, name } = useLocalSearchParams();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const [students, setStudents] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [bulkImportVisible, setBulkImportVisible] = useState(false);
  const [bulkText, setBulkText] = useState("");

  // Delete confirmation modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

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

  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"
  const [genderFilter, setGenderFilter] = useState(""); // "", "male", "female"

  const filteredStudents = students
    .filter((student) => !genderFilter || student.gender === genderFilter)
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

  const summary = {
    present: students.filter(s => s.status === "present").length,
    absent: students.filter(s => s.status === "absent").length,
    excused: students.filter(s => s.status === "excused").length,
    cutting: students.filter(s => s.status === "cutting").length,
    unmarked: students.filter(s => !s.status).length,
    total: students.length,
  };

  async function handleMarkAllPresent() {
    try {
      await markAllPresent(Number(id), selectedDate);
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity('All marked present', ToastAndroid.SHORT, ToastAndroid.TOP);
      }
      refresh();
    } catch (e) {
      console.error("Mark all error:", e);
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity('Failed to mark all present', ToastAndroid.LONG, ToastAndroid.CENTER);
      }
    }
  }

  function openDeleteModal(studentId: number, sName: string) {
    setDeleteTarget({ id: studentId, name: sName });
    setDeleteConfirmText("");
    setDeleteModalVisible(true);
  }

  async function confirmDeleteStudent() {
    if (!deleteTarget) return;
    if (deleteConfirmText.trim().toUpperCase() !== "CONFIRM") {
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity('Type CONFIRM to delete', ToastAndroid.SHORT, ToastAndroid.CENTER);
      } else {
        alert('Type CONFIRM to delete');
      }
      return;
    }
    try {
      await deleteStudent(deleteTarget.id);
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity('Student deleted', ToastAndroid.SHORT, ToastAndroid.TOP);
      }
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      setDeleteConfirmText("");
      refresh();
    } catch (e) {
      console.error("Delete error:", e);
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity('Failed to delete student', ToastAndroid.LONG, ToastAndroid.CENTER);
      } else {
        alert('Failed to delete student');
      }
    }
  }

  async function handleBulkImport() {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity('No names entered', ToastAndroid.SHORT, ToastAndroid.CENTER);
      } else {
        alert('No names entered');
      }
      return;
    }

    let added = 0;
    let skipped = 0;
    for (const line of lines) {
      // Format: "Name, Gender" or just "Name" (defaults to no gender prompt)
      const parts = line.split(',').map(p => p.trim());
      const sName = parts[0];
      const gender = parts[1]?.toLowerCase();
      if (!gender || !['male', 'female'].includes(gender)) {
        skipped++;
        continue;
      }
      const result = await addStudent(sName, Number(id), gender);
      if (result.success) added++;
      else skipped++;
    }

    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(`Added ${added}, skipped ${skipped}`, ToastAndroid.SHORT, ToastAndroid.TOP);
    } else {
      Alert.alert("Import Done", `Added ${added}, skipped ${skipped}`);
    }
    setBulkText("");
    setBulkImportVisible(false);
    refresh();
  }

  async function refresh() {
    if (id) {
      const result = await getAttendanceForClass(Number(id), selectedDate);
      setStudents(result);
    }
  }

  useEffect(() => {
    refresh();
  }, [id, selectedDate]);

  function changeDate(offset: number) {
    setSelectedDate(prev => {
      const d = new Date(prev + 'T00:00:00');
      d.setDate(d.getDate() + offset);
      return d.toISOString().split("T")[0];
    });
  }

  async function handleAddStudent() {
    if (!studentName.trim() || !studentData.gender) {
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity(
          'Please enter name and select gender.',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER
        )
      } else {
        alert('Please enter name and select gender.');
      }
      return;
    }

    try {
      const result = await addStudent(studentName, Number(id), studentData.gender);
      if (result.success) {
        if (Platform.OS === 'android') {
          ToastAndroid.showWithGravity(
            'Student Added Successfully',
            ToastAndroid.SHORT,
            ToastAndroid.TOP
          )
        }
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
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity(
          e.message,
          ToastAndroid.LONG,
          ToastAndroid.CENTER
        )
      } else {
        alert(e.message);
      }
    }
  }

  async function handleExport() {
    try {
      const data = await getClassAttendanceByMonth(Number(id), exportYear, exportMonth);

      if (data.length === 0) {
        if (Platform.OS === 'android') {
          ToastAndroid.showWithGravity("No data to export", ToastAndroid.SHORT, ToastAndroid.CENTER);
        } else {
          Alert.alert("No Data", "There is no attendance data to export for this month.");
        }
        return;
      }

      // Build pivot: one row per student, one column per date
      const studentMap: Record<string, { name: string; gender: string; dates: Record<string, string> }> = {};
      const allDates = new Set<string>();

      for (const row of data) {
        if (!studentMap[row.name]) {
          studentMap[row.name] = { name: row.name, gender: row.gender, dates: {} };
        }
        if (row.date) {
          allDates.add(row.date);
          studentMap[row.name].dates[row.date] = row.status;
        }
      }

      const sortedDates = Array.from(allDates).sort();
      const statuses = ['present', 'absent', 'excused', 'cutting'] as const;

      // Format date headers like "April 1, 2026"
      const dateHeaders = sortedDates.map(d =>
        new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d + 'T00:00:00'))
      );

      // Build rows
      const rows = Object.values(studentMap).map(student => {
        const row: Record<string, string | number> = {
          Name: student.name,
          Gender: student.gender,
        };

        for (let i = 0; i < sortedDates.length; i++) {
          row[dateHeaders[i]] = student.dates[sortedDates[i]] ? student.dates[sortedDates[i]].toUpperCase() : '';
        }

        // Summary columns
        const vals = Object.values(student.dates);
        for (const s of statuses) {
          row[`Total ${s.charAt(0).toUpperCase() + s.slice(1)}`] = vals.filter(v => v === s).length;
        }

        return row;
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      const monthName = new Date(exportYear, exportMonth - 1).toLocaleString('en-US', { month: 'long' });
      XLSX.utils.book_append_sheet(wb, ws, `${monthName} ${exportYear}`);

      const fileName = `attendance_${name || 'class'}_${monthName}_${exportYear}.xlsx`.replace(/[^a-zA-Z0-9._-]/g, '_');

      if (Platform.OS === "web") {
        XLSX.writeFile(wb, fileName);
        setExportModalVisible(false);
        return;
      }

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + fileName;

      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Attendance Data',
          UTI: 'com.microsoft.excel.xlsx'
        });
      } else {
        Alert.alert("Sharing Not Available", "Sharing is not available on this device.");
      }

      setExportModalVisible(false);
    } catch (error) {
      console.error("Export Error:", error);
      Alert.alert("Export Failed", "An error occurred while exporting the data.");
    }
  }

  function handleGenderChange(gender: string) {
    setStudentData({ ...studentData, gender });
  }

  function handleEditGenderChange(gender: string) {
    setEditStudent({ ...editStudent, gender });
  }

  async function handleMark(studentId: number, status: 'present' | 'absent' | 'excused' | 'cutting') {
    await markAttendance(studentId, selectedDate, status);
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(
        `${status}`,
        ToastAndroid.SHORT,
        ToastAndroid.TOP
      )
    }
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
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity(
          'Please enter name and select gender.',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER
        )
      } else {
        alert('Please enter name and select gender.');
      }
      return;
    }
    try {
      const response = await updateStudent(editStudentId, editStudent.name, editStudent.gender);
      if (response.success) {
        if (Platform.OS === 'android') {
          ToastAndroid.showWithGravity(
            'Student Updated Successfully',
            ToastAndroid.SHORT,
            ToastAndroid.TOP
          )
        }
        setEditVisible(false);
        setEditStudentId(null);
        setEditStudent({ id: null, name: "", gender: "" });
        refresh();
      }
      else {
        if (Platform.OS === 'android') {
          ToastAndroid.showWithGravity(
            response.message ?? "An error occurred while updating the student.",
            ToastAndroid.LONG,
            ToastAndroid.CENTER
          )
        } else {
          alert(response.message ?? "An error occurred while updating the student.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      const e = error as Error;
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity(
          e.message,
          ToastAndroid.LONG,
          ToastAndroid.CENTER
        )
      } else {
        alert(e.message);
      }
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
        {/* Date Navigation */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10, gap: 8 }}>
          <IconButton icon="chevron-left" onPress={() => changeDate(-1)} />
          <Text style={{ fontSize: 18, fontWeight: "bold", color: isDark ? "#fff" : "#222" }}>
            {new Intl.DateTimeFormat('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(selectedDate + 'T00:00:00'))}
          </Text>
          <IconButton icon="chevron-right" onPress={() => changeDate(1)} />
          {!isToday && (
            <Button compact mode="outlined" onPress={() => setSelectedDate(new Date().toISOString().split("T")[0])}>
              Today
            </Button>
          )}
        </View>

        {/* Class Name + Actions */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10, alignItems: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: isDark ? "#fff" : "#222" }}>{name}</Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Button mode="contained-tonal" icon="microsoft-excel" compact onPress={() => setExportModalVisible(true)}>Export</Button>
            <Button mode="contained-tonal" icon="account-multiple-plus" compact onPress={() => setBulkImportVisible(true)}>Bulk</Button>
            <Button mode="contained" compact onPress={() => setVisible(true)}>Add</Button>
          </View>
        </View>

        {/* Attendance Summary */}
        {summary.total > 0 && (
          <View style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 12,
            padding: 10,
            backgroundColor: isDark ? "#252525" : "#f5f5f5",
            borderRadius: 8
          }}>
            <Text style={{ color: "green", fontWeight: "bold", fontSize: 13 }}>P: {summary.present}</Text>
            <Text style={{ color: "red", fontWeight: "bold", fontSize: 13 }}>A: {summary.absent}</Text>
            <Text style={{ color: "goldenrod", fontWeight: "bold", fontSize: 13 }}>E: {summary.excused}</Text>
            <Text style={{ color: "orangered", fontWeight: "bold", fontSize: 13 }}>C: {summary.cutting}</Text>
            <Text style={{ color: isDark ? "#aaa" : "#666", fontWeight: "bold", fontSize: 13 }}>Unmarked: {summary.unmarked}</Text>
            <Text style={{ color: isDark ? "#fff" : "#222", fontWeight: "bold", fontSize: 13 }}>Total: {summary.total}</Text>
          </View>
        )}

        {/* Mark All Present */}
        {summary.unmarked > 0 && (
          <Button
            mode="contained-tonal"
            icon="check-all"
            onPress={handleMarkAllPresent}
            style={{ marginTop: 8 }}
          >
            Mark All Present
          </Button>
        )}

        {/* Filters */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <Chip selected={genderFilter === ""} onPress={() => setGenderFilter("")}>All</Chip>
          <Chip selected={genderFilter === "male"} onPress={() => setGenderFilter("male")}>Male</Chip>
          <Chip selected={genderFilter === "female"} onPress={() => setGenderFilter("female")}>Female</Chip>
          <Chip
            icon={sortOrder === "asc" ? "sort-alphabetical-ascending" : "sort-alphabetical-descending"}
            onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "A-Z" : "Z-A"}
          </Chip>
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
              padding: 12,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "#444" : "#ddd",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "500", color: isDark ? "#fff" : "#222" }}>{item.name}</Text>
                {item.status && (
                  <Text
                    style={{
                      fontSize: 12,
                      marginTop: 2,
                      color: item.status === "present" ? "green"
                        : item.status === "excused" ? "goldenrod"
                          : item.status === "cutting" ? "orangered"
                            : "red"
                    }}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 2 }}>
                <IconButton
                  icon="menu"
                  size={20}
                  mode={item.status ? "contained-tonal" : "contained"}
                  containerColor={!item.status ? "dodgerblue" : undefined}
                  iconColor={!item.status ? "white" : undefined}
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
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Button
                mode="contained"
                buttonColor="red"
                textColor="white"
                icon="delete"
                onPress={() => {
                  setEditVisible(false);
                  openDeleteModal(editStudentId!, editStudent.name);
                }}
              >
                Delete
              </Button>
              <View style={{ flexDirection: "row" }}>
                <Button onPress={() => setEditVisible(false)} style={{ marginRight: 10 }}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleEditStudent}>
                  Save
                </Button>
              </View>
            </View>
          </Modal>

          {/* Export Modal */}
          <Modal
            visible={exportModalVisible}
            onDismiss={() => setExportModalVisible(false)}
            contentContainerStyle={{
              backgroundColor: isDark ? "#18191A" : "#fff",
              padding: 20,
              marginHorizontal: 20,
              borderRadius: 8
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16, color: isDark ? "#fff" : "#222" }}>
              Export Attendance
            </Text>

            <Text style={{ marginBottom: 8, color: isDark ? "#fff" : "#222" }}>Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <Button
                    key={m}
                    mode={exportMonth === m ? "contained" : "outlined"}
                    compact
                    onPress={() => setExportMonth(m)}
                  >
                    {new Date(2000, m - 1).toLocaleString('en-US', { month: 'short' })}
                  </Button>
                ))}
              </View>
            </ScrollView>

            <Text style={{ marginBottom: 8, color: isDark ? "#fff" : "#222" }}>Year</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20, gap: 16 }}>
              <IconButton icon="chevron-left" onPress={() => setExportYear(y => y - 1)} />
              <Text style={{ fontSize: 18, fontWeight: "bold", color: isDark ? "#fff" : "#222" }}>{exportYear}</Text>
              <IconButton icon="chevron-right" onPress={() => setExportYear(y => y + 1)} />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
              <Button mode="contained-tonal" onPress={() => setExportModalVisible(false)}>
                Cancel
              </Button>
              <Button mode="contained" icon="microsoft-excel" onPress={handleExport}>
                Export
              </Button>
            </View>
          </Modal>

          {/* Bulk Import Modal */}
          <Modal
            visible={bulkImportVisible}
            onDismiss={() => setBulkImportVisible(false)}
            contentContainerStyle={{
              backgroundColor: isDark ? "#18191A" : "#fff",
              padding: 20,
              marginHorizontal: 20,
              borderRadius: 8,
              maxHeight: "80%"
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8, color: isDark ? "#fff" : "#222" }}>
              Bulk Import Students
            </Text>
            <Text style={{ marginBottom: 12, color: isDark ? "#aaa" : "#666", fontSize: 13 }}>
              One student per line. Format: Name, gender{"\n"}
              Example:{"\n"}Dela Cruz Juan B., male{"\n"}Santos Maria C., female
            </Text>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={8}
              value={bulkText}
              onChangeText={setBulkText}
              placeholder={"Dela Cruz Juan B., male\nSantos Maria C., female"}
              style={{ marginBottom: 16, minHeight: 150 }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
              <Button mode="contained-tonal" onPress={() => setBulkImportVisible(false)}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleBulkImport}>
                Import
              </Button>
            </View>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            visible={deleteModalVisible}
            onDismiss={() => {
              setDeleteModalVisible(false);
              setDeleteTarget(null);
              setDeleteConfirmText("");
            }}
            contentContainerStyle={{
              backgroundColor: isDark ? "#18191A" : "#fff",
              padding: 20,
              marginHorizontal: 20,
              borderRadius: 8
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "red", marginBottom: 10 }}>
              Delete Student
            </Text>
            <Text style={{ color: isDark ? "#fff" : "#222", marginBottom: 6 }}>
              Are you sure you want to delete "{deleteTarget?.name}"?
            </Text>
            <Text style={{ color: isDark ? "#aaa" : "#666", marginBottom: 16, fontSize: 13 }}>
              This will permanently delete the student and all their attendance records. Type CONFIRM to proceed.
            </Text>
            <TextInput
              mode="outlined"
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Type CONFIRM"
              autoCapitalize="characters"
              style={{ marginBottom: 16 }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
              <Button mode="contained-tonal" onPress={() => {
                setDeleteModalVisible(false);
                setDeleteTarget(null);
                setDeleteConfirmText("");
              }}>
                Cancel
              </Button>
              <Button
                mode="contained"
                buttonColor="red"
                textColor="white"
                disabled={deleteConfirmText.trim().toUpperCase() !== "CONFIRM"}
                onPress={confirmDeleteStudent}
              >
                Delete
              </Button>
            </View>
          </Modal>
        </Portal>
      </View>

    </Provider>
  );
}
