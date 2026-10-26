import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { PaperThemeContext } from "../components/PaperThemeContext";

import HomeScreen from "../screens/HomeScreen";
import BibleScreen from "../screens/BibleScreen";
import DevotionalScreen from "../screens/DevotionalScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ReadingScreen from "../screens/ReadingScreen";
import AudioScreen from "../screens/AudioScreen";
import MonthDevotionalScreen from "../screens/MonthDevotionalScreen";
import DevotionalDetailScreen from "../screens/DevotionalDetailScreen";
import FAQScreen from "../screens/FAQScreen";
import ConnectWithUs from "../screens/ConnectWithUs";
import ExternalAuthScreen from "../screens/AuthScreen";
import HymnsScreen from "../screens/HymnsScreen";
import HymnDetailScreen from "../screens/HymnDetailScreen";
import SearchScreen from "../screens/SearchScreen";
import WordStudyScreen from "../screens/WordStudyScreen";
import StudyThemesScreen from "../screens/StudyThemesScreen";
import TimelineScreen from "../screens/TimelineScreen";
import CrossReferencesScreen from "../screens/CrossReferencesScreen";
import ProfileScreen from "../screens/ProfileScreen";
import UtilityScreen from "../screens/UtilityScreen";
import PaywallScreen from "../screens/PaywallScreen";
import DonateScreen from "../screens/DonateScreen";
import ManageGiftsScreen from "../screens/ManageGiftsScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ name, color }) {
  return <MaterialCommunityIcons name={name} size={24} color={color} />;
}

function MainTabs() {
  const { currentTheme } = useContext(PaperThemeContext);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: currentTheme.colors.primary,
        tabBarInactiveTintColor: currentTheme.colors.outline,
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          position: "absolute",
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: (props) => <TabIcon name="home-variant" {...props} /> }} />
      <Tab.Screen name="Bible" component={BibleScreen} options={{ tabBarIcon: (props) => <TabIcon name="book-open-page-variant" {...props} /> }} />
      <Tab.Screen name="Hymns" component={HymnsScreen} options={{ tabBarIcon: (props) => <TabIcon name="music-note-outline" {...props} /> }} />
      <Tab.Screen name="Study" component={SearchScreen} options={{ tabBarIcon: (props) => <TabIcon name="magnify" {...props} /> }} />
      <Tab.Screen name="Devotionals" component={DevotionalScreen} options={{ tabBarIcon: (props) => <TabIcon name="book-multiple" {...props} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: (props) => <TabIcon name="account-circle-outline" {...props} /> }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: "#FAFAF8" } }}>
      <Stack.Screen name="HomeRoot" component={HomeScreen} />
      <Stack.Screen name="Onboarding" component={HomeScreen} />
      <Stack.Screen name="Auth" component={ExternalAuthScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Reading" component={ReadingScreen} />
      <Stack.Screen name="MonthDevotional" component={MonthDevotionalScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="Audio" component={AudioScreen} />
      <Stack.Screen name="AudioPlayer" component={AudioScreen} />
      <Stack.Screen name="DevotionalDetail" component={DevotionalDetailScreen} />
      <Stack.Screen name="HymnDetail" component={HymnDetailScreen} />
      <Stack.Screen name="WordStudy" component={WordStudyScreen} />
      <Stack.Screen name="StudyThemes" component={StudyThemesScreen} />
      <Stack.Screen name="Timeline" component={TimelineScreen} />
      <Stack.Screen name="CrossReferences" component={CrossReferencesScreen} />
      <Stack.Screen name="Donate" component={DonateScreen} />
      <Stack.Screen name="ManageGifts" component={ManageGiftsScreen} />
      {[
        "Bookmarks",
        "Favorites",
        "Downloads",
        "Plans",
        "Prayer",
        "Prayer Journal",
        "Saved Notes",
        "Reading Stats",
        "Edit Profile",
        "Change Password",
        "Notifications",
        "Support",
        "Offline",
        "Sermons",
        "Assistant",
        "Devotionals",
        "ContinueReading",
      ].map((name) => (
        <Stack.Screen key={name} name={name} component={UtilityScreen} />
      ))}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Connect" component={ConnectWithUs} />
    </Stack.Navigator>
  );
}

export default RootNavigator;
