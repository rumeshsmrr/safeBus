import Header from "@/app/Components/header";
import { images } from "@/constants/images";
import React from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const scrollViewBottomPadding = 24; // Define the padding value
const driver = {
  id: 1,
  name: "Madusha",
};
const childs = [
  {
    id: "1",
    name: "Shenuki Dilsara",
    image: images.childImage1,
    status: "Dropped",
    Notification: [
      {
        id: "1",
        message: "Dropped at School",
        time: "10:30 AM",
      },
      {
        id: "2",
        message: "On Bus",
        time: "9:00 AM",
      },
    ],
    // Hardcoded location for Shenuki (near Colombo based on given coordinates)
    location: {
      latitude: 6.8856,
      longitude: 79.8596,
    },
  },
];

const ChildHome = () => {
  const [notifyDriverModalVisible, setNotifyDriverModalVisible] =
    React.useState(false);

  const [notifyParentModalVisible, setNotifyParentModalVisible] =
    React.useState(false);

  const [message, setMessage] = React.useState("");

  const handeleNotifyDriver = () => {
    setNotifyDriverModalVisible(true);
  };

  const handleCloseModal = () => {
    setNotifyDriverModalVisible(false);
  };

  const handleNotifyParent = () => {
    setNotifyParentModalVisible(true);
  };

  const handleCloseParentModal = () => {
    setNotifyParentModalVisible(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-light-100 py-9">
      {/* Main scrollable content area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        <Header isCode={false} />
        <Text className="text-xl font-light mt-4"> Parent Name : John Doe</Text>
        {childs.map((item) => (
          <View
            key={item.id}
            className="w-full h-fit bg-white mt-4 rounded-xl shadow-md"
          >
            <View className="flex-row items-start p-4">
              <Image source={item.image} className="h-12 w-12 rounded-full" />
              <View className="flex-row ml-4 flex-1 justify-between items-start">
                <View className="flex-1">
                  <Text className="text-xl font-semibold text-darkbg capitalize">
                    {item.name}
                  </Text>
                  <Text className="text-grayText text-base">
                    Madusha School Bus Service
                  </Text>
                  <Text className="text-grayText text-base">
                    Driver Name: {driver.name}
                  </Text>
                </View>
                <Text
                  className={`text-gray-600 px-4 py-2 ${item.status === "On Bus" ? "bg-yellow-300" : item.status === "Dropped" ? "bg-green-300" : item.status === "AB" ? "bg-red-300" : ""} rounded-full`}
                >
                  {item.status}
                </Text>
              </View>
            </View>
            <View className="border-t border-gray-200 p-4">
              <Text className="text-lg font-semibold mb-2">
                Recent Notifications
              </Text>
              {item.Notification.map((notification) => (
                <View
                  key={notification.id}
                  className="flex-row items-center justify-between mb-2"
                >
                  <Text className="text-grayText text-base">
                    {notification.message}
                  </Text>
                  <Text className="text-grayText text-sm">
                    {notification.time}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
        <View className="mt-6 w-full items-center">
          <TouchableOpacity
            className="w-full h-[300px] rounded-xl bg-redsh gap-2 text-darkbg flex-1 justify-center items-center"
            onLongPress={() => console.log("Emergency Button Pressed")}
            activeOpacity={0.7}
          >
            <Text className="text-5xl font-light h-12">Emergency</Text>
            <Text className="text-lg font-light">Press and Hold</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row flex-wrap justify-between mt-6 w-full">
          <TouchableOpacity
            className="w-[48%] bg-yellowsh rounded-xl shadow-md px-4 py-6 mb-4 justify-center items-center flex-shrink-0"
            onPress={() => {
              handeleNotifyDriver();
            }}
          >
            <Text className="text-xl font-normal text-grayText text-center">
              Notify Driver
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-[48%] bg-greensh rounded-xl shadow-md px-4 py-6 mb-4 justify-center items-center flex-shrink-0"
            onPress={() => {
              handleNotifyParent();
            }}
          >
            <Text className="text-xl font-normal text-grayText text-center">
              Notify Parent
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* notify driver modal  */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notifyDriverModalVisible}
        onRequestClose={() => {
          handleCloseModal();
        }}
      >
        <View className="flex-1 justify-end items-center bg-black/80">
          <View className="bg-white rounded-t-lg w-full p-6 pb-12">
            <Text className="text-2xl font-semibold mb-4">Notify Driver</Text>

            {/* Contact Driver Button Section */}
            <View className="w-full border-b border-gray-200 pb-4 mb-4">
              <TouchableOpacity className="flex-row items-center h-[80px] justify-center bg-blue-500 rounded-lg px-4 py-3">
                <Text className="text-white text-xl font-medium m-auto text-center">
                  Contact Driver
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-darkbg text-lg font-medium">
              Sent Message
            </Text>
            <Text className="text-gray-600 text-lg mb-4 mt-4">
              Enter your message to notify the driver:
            </Text>

            <View className="mb-6">
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 text-base min-h-[80px]"
                placeholder="Type your message..."
                multiline
                numberOfLines={3}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />
            </View>

            <View className="flex-row justify-between space-x-3 gap-2">
              <TouchableOpacity
                className="bg-gray-300 rounded-lg min-w-[48%] px-10  py-4"
                onPress={() => {
                  setMessage("");
                  handleCloseModal();
                }}
              >
                <Text className="text-gray-800 font-medium text-xl text-center">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`rounded-lg px-10 min-w-[48%]  py-4 ${message.trim() ? "bg-greensh" : "bg-gray-300"}`}
                onPress={() => {
                  console.log("Notify Driver Confirmed:", message);
                  setMessage("");
                  handleCloseModal();
                }}
                disabled={!message.trim()}
              >
                <Text className="text-white font-medium text-xl m-auto text-center">
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={notifyParentModalVisible}
        onRequestClose={() => {
          handleCloseParentModal();
        }}
      >
        <View className="flex-1 justify-end items-center bg-black/80">
          <View className="bg-white rounded-t-lg w-full p-6 pb-12">
            <Text className="text-2xl font-semibold mb-4">Notify Parent</Text>

            {/* Contact Parent Button Section */}
            <View className="w-full border-b border-gray-200 pb-4 mb-4">
              <TouchableOpacity className="flex-row items-center h-[80px] justify-center bg-blue-500 rounded-lg px-4 py-3">
                <Text className="text-white text-xl font-medium m-auto text-center">
                  Contact Parent
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-darkbg text-lg font-medium">
              Sent Message
            </Text>
            <Text className="text-gray-600 text-lg mb-4 mt-4">
              Enter your message to notify the Parent:
            </Text>

            <View className="mb-6">
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 text-base min-h-[80px]"
                placeholder="Type your message..."
                multiline
                numberOfLines={3}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />
            </View>

            <View className="flex-row justify-between space-x-3 gap-2">
              <TouchableOpacity
                className="bg-gray-300 rounded-lg min-w-[48%] px-10  py-4"
                onPress={() => {
                  setMessage("");
                  handleCloseParentModal();
                }}
              >
                <Text className="text-gray-800 font-medium text-xl text-center">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`rounded-lg px-10 min-w-[48%]  py-4 ${message.trim() ? "bg-greensh" : "bg-gray-300"}`}
                onPress={() => {
                  console.log("Notify Parent Confirmed:", message);
                  setMessage("");
                  handleCloseParentModal();
                }}
                disabled={!message.trim()}
              >
                <Text className="text-white font-medium text-xl m-auto text-center">
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ChildHome;
