import Navbar from "@/components/navbar";
import { addClass as addClassDB, deleteClass, getClasses, initDB, updateClass } from "@/db/database";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, useColorScheme, View } from "react-native";
import { Button, IconButton, Modal, Portal, Provider, Text, TextInput } from "react-native-paper";

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [className, setClassName] = useState("");
  const [visible, setVisible] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editClassId, setEditClassId] = useState<number | null>(null);
  const [editClassName, setEditClassName] = useState("");


  const today = new Date();
  useEffect(() => {
    (async () => {
      await initDB();
      const stored = await getClasses(); // SELECT * FROM classes
      setClasses(stored); // keep full objects {id, name}
    })();
  }, []);

  async function handleAddClass() {
    if (className.trim().length === 0) return;
    try {
      if (editClassId) {
        await updateClass(editClassId, className); // Update if editing
        Alert.alert("Class Updated Successfuly");
      } else {
        await addClassDB(className); // Add if creating
        Alert.alert("Class Added Successfuly");
      }
      const updated = await getClasses();
      setClasses(updated);
      setClassName("");
      setEditClassId(null); // Reset edit state
      setVisible(false);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "An error occurred while saving the class.");
    }
  }


  const toggleOverlay = () => setVisible(!visible);

  return (
    <Provider>
      <View style={{ flex: 1, backgroundColor: isDark ? "#18191A" : "#fff" }}>
        <Navbar />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", margin: 10, }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: isDark ? "#fff" : "#222" }}>
            {today.toDateString()}
          </Text>
          <Button onPress={toggleOverlay} mode="contained">Add Class</Button>
        </View>

        <FlatList
          data={classes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View
              style={{
                marginBottom: 10,
                padding: 20,
                borderRadius: 8,
                borderColor: "gray",
                borderWidth: 1,
                backgroundColor: isDark ? "#333" : "#fff",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Link
                href={{ pathname: "/class/[id]", params: { id: item.id, name: item.name } }}
                style={{ flex: 1 }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold", color: isDark ? "#fff" : "#222" }}>{item.name}</Text>
              </Link>

              <IconButton
                icon="delete"
                mode="contained"
                iconColor="red"
                onPress={() => {
                  Alert.alert("Delete Class", "Are you sure you want to delete this class? This action cannot be undone.", [
                    { text: "Cancel" },
                    {
                      text: "Delete",
                      onPress: async () => {
                        await deleteClass(item.id);
                        const updated = await getClasses();
                        setClasses(updated);
                        Alert.alert("Class Deleted Successfuly");
                      },
                    },
                  ]);
                }}
              />
              <IconButton
                icon="pencil"
                mode="contained-tonal"
                onPress={() => {
                  setEditClassId(item.id);
                  setClassName(item.name);
                  setVisible(true);
                }}
              />
            </View>
          )}
        />


        <Portal>
          <Modal
            visible={visible}
            onDismiss={() => {
              setVisible(false);
              setClassName(""); // Clear field on close
              setEditClassId(null); // Reset edit state on close
            }}
            contentContainerStyle={{
              backgroundColor: "white",
              padding: 20,
              marginHorizontal: 20,
              borderRadius: 8
            }}
          >
            <Text style={{ marginBottom: 10 }}>
              {editClassId ? "Edit Class Name" : "Enter Class Name"}
            </Text>
            <TextInput
              mode="outlined"
              value={className}
              onChangeText={setClassName}
              placeholder="Class Name"
              style={{ marginBottom: 20 }}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Button
                onPress={() => {
                  setVisible(false);
                  setClassName("");
                  setEditClassId(null);
                }}
                style={{ marginRight: 10 }}
                mode="contained-tonal"
              >
                Cancel
              </Button>
              <Button onPress={handleAddClass} mode="contained">
                {editClassId ? "Save" : "Add"}
              </Button>
            </View>
          </Modal>
        </Portal>

        {/* <Button mode="contained" onPress={async () => await clearAllData()} style={{ margin: 50 }}>
          clear data
        </Button>

        <Button mode="contained" style={{ margin: 50 }} onPress={async () => { await seedDatabase(); Alert.alert("Seeded!") }}>
          Seed Example Data
        </Button> */}
      </View>
    </Provider>
  );
}