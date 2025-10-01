import Navbar from "@/components/navbar";
import { addClass as addClassDB, deleteClass, getClasses, initDB, updateClass } from "@/db/database";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, ToastAndroid, useColorScheme, View } from "react-native";
import { Button, IconButton, Modal, Portal, Provider, Text, TextInput } from "react-native-paper";

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [className, setClassName] = useState("");
  const [visible, setVisible] = useState(false);


  const [editClassId, setEditClassId] = useState<number | null>(null);



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
        const response = await updateClass(editClassId, className); // Update if editing
        if (response.success) {
          ToastAndroid.showWithGravity(
            'Class Updated Successfully',
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
        } else {
          ToastAndroid.showWithGravity(
            response.message ?? "An error occurred while updating the class.",
            ToastAndroid.LONG,
            ToastAndroid.TOP,
          );
        }
      } else {
        const response = await addClassDB(className); // Add if creating.
        if (response.success) {
          ToastAndroid.showWithGravity(
            'Class Added Successfully',
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
        } else {
          ToastAndroid.showWithGravity(
            response.message ?? "An error occurred while saving the class.",
            ToastAndroid.LONG,
            ToastAndroid.TOP,
          )
          return; // Don't continue to refresh/reset if not added
        }
      }
      const updated = await getClasses();
      setClasses(updated);
      setClassName("");
      setEditClassId(null);
      setVisible(false);
    } catch (error) {
      ToastAndroid.showWithGravity(
        "An error occurred while saving the class.",
        ToastAndroid.LONG,
        ToastAndroid.TOP,
      )
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
                        ToastAndroid.showWithGravity(
                          'Class Deleted Successfully',
                          ToastAndroid.SHORT,
                          ToastAndroid.TOP
                        )
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
              backgroundColor: isDark ? "#18191A" : "#fff",
              padding: 20,
              marginHorizontal: 20,
              borderRadius: 8
            }}
          >
            <Text style={{ marginBottom: 10, color: isDark ? "#fff" : "#222" }}>
              {editClassId ? "Edit Class" : "Adding Class"}
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

        {/* <Button mode="contained" onPress={async () => {
          try {
            await clearAllData();
            Alert.alert("Data cleared successfully!");
            const updated = await getClasses();
            setClasses(updated);
          } catch (error) {
            console.error("Error clearing data:", error);
            Alert.alert("Error", "An error occurred while clearing data.");
          }
        }} style={{ margin: 50 }}>
          Clear Data
        </Button> */}

        {/* <Button mode="contained" style={{ margin: 50 }} onPress={async () => { await seedDatabase(); Alert.alert("Seeded!") }}>
          Seed Example Data
        </Button>  */}
      </View>
    </Provider>
  );
}