import Navbar from "@/components/navbar";
import { addClass as addClassDB, deleteClass, getClasses, initDB } from "@/db/database";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { Button, IconButton, Modal, Portal, Provider, Text, TextInput } from "react-native-paper";

export default function Index() {
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [className, setClassName] = useState("");
  const [visible, setVisible] = useState(false);

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

    await addClassDB(className);
    const updated = await getClasses();
    setClasses(updated);
    setClassName("");
    setVisible(false);
  }

  const toggleOverlay = () => setVisible(!visible);

  return (
    <Provider>

      <View style={{ flex: 1 }}>
        <Navbar />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", margin: 10 }}>
          <Text>
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
                backgroundColor: "#f0f0f0",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Link
                href={{ pathname: "/class/[id]", params: { id: item.id, name: item.name } }}
                style={{ flex: 1 }}
              >
                <Text>{item.name}</Text>
              </Link>

              <IconButton
                icon="delete"
                mode="contained"
                iconColor="red"
                onPress={() => {
                  Alert.alert("Delete Class", "Are you sure?", [
                    { text: "Cancel" },
                    {
                      text: "Delete",
                      onPress: async () => {
                        await deleteClass(item.id);
                        const updated = await getClasses();
                        setClasses(updated);
                        Alert.alert("Deleted");
                      },
                    },
                  ]);
                }}
              />
            </View>

          )}

        />


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
            <Text style={{ marginBottom: 10 }}>Enter Class Name</Text>
            <TextInput
              mode="outlined"
              value={className}
              onChangeText={setClassName}
              placeholder="Class Name"
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
              <Button onPress={handleAddClass} mode="contained">Add</Button>
            </View>
          </Modal>

        </Portal>

      </View>
    </Provider>
  );
}