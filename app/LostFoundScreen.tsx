import React, { useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Header2 from "./Components/header2";

const scrollViewBottomPadding = 24;

interface FoundItems {
  id: string;
  image: ImageSourcePropType;
  title: string;
  date: string;
  description: string;
  status: string;
}

const FoundItems = [
  {
    id: "1",
    image: require("../assets/images/lostItem1.jpeg"),
    title: "Plastic Water Bottle",
    date: "2023-10-01",
    description: "A blue plastic water bottle left on the bus.",
    status: "Found",
  },
  {
    id: "2",
    image: require("../assets/images/lostItem1.jpeg"),
    title: "Found Keys",
    date: "2023-10-02",
    description: "Set of keys with a blue keychain.",
    status: "Found",
  },
  {
    id: "3",
    image: require("../assets/images/lostItem1.jpeg"),
    title: "Lost Backpack",
    date: "2023-10-03",
    description: "Black backpack left on the train.",
    status: "Found",
  },
  {
    id: "4",
    image: require("../assets/images/lostItem1.jpeg"),
    title: "Umbrella",
    date: "2023-10-04",
    description: "Red umbrella found at the bus stop.",
    status: "Found",
  },
  // Add more items as needed
];

const yourLostItems: FoundItems[] = [
  {
    id: "5",
    image: require("../assets/images/lostItem1.jpeg"),
    title: "Lost Wallet",
    date: "2023-10-05",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel egestas dolor, nec dignissim metus. Donec augue elit, rhoncus ac sodales id, porttitor vitae est. Donec laoreet rutrum libero sed pharetra.",
    status: "Lost",
  },
  {
    id: "6",
    image: require("../assets/images/lostItem1.jpeg"),
    title: "Missing Jacket",
    date: "2023-10-06",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel egestas dolor, nec dignissim metus. Donec augue elit, rhoncus ac sodales id, porttitor vitae est. Donec laoreet rutrum libero sed pharetra.",
    status: "Lost",
  },
];

const LostFoundScreen = () => {
  const [selectedItem, setSelectedItem] = useState<FoundItems | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModeVisible, setEditModeVisible] = useState(false);

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Add new item states
  const [addModeVisible, setAddModeVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const handleItemPress = (item: FoundItems) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const handleEditModePress = (item: FoundItems) => {
    setSelectedItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditModeVisible(true);
  };

  const closeEditMode = () => {
    setEditModeVisible(false);
    setSelectedItem(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleSaveEdit = () => {
    // Here you would typically update your data source
    alert(
      `Updated item:\nTitle: ${editTitle}\nDescription: ${editDescription}`
    );
    closeEditMode();
  };

  const handleReportLost = () => {
    setAddModeVisible(true);
  };

  const closeAddMode = () => {
    setAddModeVisible(false);
    setNewTitle("");
    setNewDescription("");
  };

  const addLostItem = () => {
    if (newTitle.trim() === "" || newDescription.trim() === "") {
      alert("Please fill in all fields");
      return;
    }

    // Here you would typically add the item to your data source
    const newItem: FoundItems = {
      id: Date.now().toString(), // Simple ID generation
      image: require("../assets/images/lostItem1.jpeg"), // Default image
      title: newTitle,
      date: new Date().toISOString().split("T")[0], // Current date
      description: newDescription,
      status: "Lost",
    };

    // In a real app, you'd update your state/database here
    alert(
      `New lost item reported:\nTitle: ${newTitle}\nDescription: ${newDescription}`
    );
    closeAddMode();
  };

  return (
    <SafeAreaView className="flex-1 bg-light-100 py-9">
      <Header2 />
      {/* Main scrollable content area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        <Text className="text-2xl font-light mt-4">Lost & Found</Text>
        <Text className="text-xl font-light mt-4">Found Items</Text>
        <View className="flex-row flex-wrap gap-2 mt-4">
          {/* Map through the lost items and display them */}
          {FoundItems.map((item: FoundItems) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleItemPress(item)}
            >
              <Image
                source={item.image}
                className="w-24 h-24 rounded-lg"
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text className="text-xl font-light mt-6">Your Lost Items</Text>
        <View className="flex-row flex-wrap gap-2 mt-4">
          {/* Map through the user's lost items and display them */}
          {yourLostItems.map((item: FoundItems) => (
            <View
              key={item.id}
              className="flex-col gap-2 bg-white rounded-lg mb-4 p-4"
            >
              <View className="w-full flex-row justify-between items-start">
                <View className="flex-row items-start justify-start gap-2">
                  <Image
                    source={item.image}
                    className="w-12 h-12 rounded-lg"
                    resizeMode="cover"
                  />
                  <View className="flex-col justify-between gap-1">
                    <Text className="text-xl font-normal">{item.title}</Text>
                    <Text className="text-gray-500 text-md"> {item.date}</Text>
                  </View>
                </View>
                <Text
                  className={`bg-greensh text-white px-6 py-2 rounded-full`}
                >
                  {item.status}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm">{item.description}</Text>

              <View className="w-full flex-row justify-between ">
                <TouchableOpacity>
                  <Text className="py-2 px-6 bg-redsh rounded-lg text-white ">
                    Remove
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    handleEditModePress(item);
                  }}
                >
                  <Text className="py-2 px-6 bg-blue-600 min-w-[80px] text-center rounded-lg text-white ">
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        <TouchableOpacity
          className="bg-blue-600 py-3 rounded-lg mb-4"
          onPress={handleReportLost}
        >
          <Text className="text-white text-center font-semibold">
            Report Lost Item
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* View Details Modal Popup */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-2xl max-w-sm w-full shadow-lg">
            {selectedItem && (
              <>
                {/* Item Image */}
                <Image
                  source={selectedItem.image}
                  className="w-full h-80 rounded-t-lg mb-4"
                  resizeMode="cover"
                />
                <View className="flex-col items-start p-4">
                  {/* Item Title */}
                  <View className="flex-row items-center justify-between w-full">
                    <Text className="text-2xl font-semibold mb-2 text-center">
                      {selectedItem.title}
                    </Text>

                    {/* Item Status */}
                    <View className="bg-green-100 rounded-full px-3 py-1 mb-3 self-center">
                      <Text className="text-green-800 text-sm font-medium">
                        {selectedItem.status}
                      </Text>
                    </View>
                  </View>

                  {/* Item Date */}
                  <Text className="text-gray-600 text-sm mb-3 text-center">
                    Found on: {selectedItem.date}
                  </Text>

                  {/* Item Description */}
                  <Text className="text-gray-800 text-base mb-6 text-center leading-5">
                    {selectedItem.description}
                  </Text>
                </View>
                {/* Action Buttons */}
                <View className="flex-row gap-3 p-4">
                  <TouchableOpacity
                    className="flex-1 bg-blue-600 py-3 rounded-lg"
                    onPress={() => {
                      // Add contact logic here
                      alert("Contact functionality to be implemented");
                    }}
                  >
                    <Text className="text-white text-center font-semibold">
                      Contact
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="bg-blue-500 p-4 rounded-full shadow mt-6"
                    onPress={handleReportLost}
                  >
                    <Text className="text-base text-white text-center">
                      Report Lost
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Modal Popup */}
      {/* Add New Lost Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModeVisible}
        onRequestClose={closeAddMode}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-2xl max-w-sm w-full shadow-lg">
            {/* Header */}
            <View className="p-4 border-b border-gray-200">
              <Text className="text-2xl font-semibold text-center">
                Report Lost Item
              </Text>
            </View>

            {/* Placeholder Image */}
            {/* upload image from device or take a photo */}
            <View className="w-full h-48 mt-4 bg-gray-200 flex items-center justify-center">
              <Text className="text-gray-500 text-lg">📷</Text>
              <Text className="text-gray-500 text-sm mt-2">Add Photo</Text>
            </View>

            <View className="flex-col items-start p-4">
              {/* Add Title */}
              <Text className="text-lg font-medium mb-2">Item Title *</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                className="w-full border border-gray-300 rounded-lg p-3 mb-4"
                placeholder="e.g., Blue Backpack, iPhone, Keys..."
              />

              {/* Add Description */}
              <Text className="text-lg font-medium mb-2">Description *</Text>
              <TextInput
                value={newDescription}
                onChangeText={setNewDescription}
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-24"
                placeholder="Describe your lost item (color, size, brand, where you lost it, etc.)"
                multiline
                textAlignVertical="top"
              />

              {/* Current Date */}
              <Text className="text-gray-600 text-sm mb-4">
                Date: {new Date().toISOString().split("T")[0]}
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 p-4">
              <TouchableOpacity
                className="flex-1 bg-blue-600 py-3 rounded-lg"
                onPress={addLostItem}
              >
                <Text className="text-white text-center font-semibold">
                  Report Lost
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-gray-500 py-3 rounded-lg"
                onPress={closeAddMode}
              >
                <Text className="text-white text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LostFoundScreen;
