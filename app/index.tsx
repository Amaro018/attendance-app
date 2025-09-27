import Navbar from "@/components/navbar";
import React, { useState } from "react";
import { View } from "react-native";
import { Button, Modal, Portal, Provider, Text, TextInput } from "react-native-paper";

export default function Index() {
  const [classes, setClasses] = useState<string[]>([]);
   const [className, setClassName] = useState("");

  async function addClass() {
      if (className.trim().length === 0) return;
       setClasses((prev) => [...prev, className]);
        setClassName("");
    setVisible(false);

  }

  const formData = {
    className: "",
  };

  const [visible, setVisible] = useState(false);
  const toggleOverlay = () => {
    setVisible(!visible);
  };
  return (
    <Provider>
      <View style={{ flex: 1 }}>
        <Navbar />

        {/* Add Class Button */}
        <View style={{ alignItems: "flex-end", margin: 10 }}>
          <Button onPress={toggleOverlay} mode="contained">Add Class</Button>
        </View>

        {/* Conditional rendering */}
        {classes.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>No class found</Text>
          </View>
        ) : (
          <View style={{ flex: 1, padding: 20 }}>
            {classes.map((c, i) => (
              <Text key={i}>{c}</Text>
            ))}
          </View>
        )}

           <Portal >
           <Modal
            visible={visible}
            onDismiss={() => setVisible(false)}
            contentContainerStyle={{
              backgroundColor: "white",
              padding: 20,
              marginHorizontal: 20,
              borderRadius: 8,
            }}
          >
            <Text style={{ marginBottom: 10 }}>Enter Class Name</Text>
            <TextInput
              mode="outlined"
              value={className}
              onChangeText={setClassName} // ✅ handle typing
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
              <Button onPress={addClass} mode="contained">
                Add
              </Button>
            </View>
          </Modal>
        </Portal>
      </View>
    </Provider>
  );
}
