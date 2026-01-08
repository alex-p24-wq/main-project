import React, { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import "../../css/FarmerDashboard.css";
import "../../css/theme-modern.css";

// Feature sections
import FarmerOverview from "./farmer/FarmerOverview";
import FarmerProfile from "./farmer/FarmerProfile";
import ProductManager from "./farmer/ProductManager";
import CardamomGrading from "./farmer/CardamomGrading";
import CardamomPriceTracker from "./farmer/CardamomPriceTracker";
import DiseasePredictor from "./farmer/DiseasePredictor";
import ConnectAgriCare from "./farmer/ConnectAgriCare";
import FeedbackForm from "./shared/FeedbackForm";

export default function FarmerDashboard({ user }) {
  const [activePage, setActivePage] = useState("overview");

  // Menu items for farmer dashboard
  const menuItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "products", label: "Add Product", icon: "🧺" },
    { id: "grading", label: "Cardamom Grading", icon: "⭐" },
    { id: "prices", label: "Market Prices", icon: "📈" },
    { id: "predictor", label: "Disease Predictor", icon: "🧪" },
    { id: "agricare", label: "Connect AgriCare", icon: "🤝" },
    { id: "feedback", label: "Feedback", icon: "💬" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  const renderPageContent = () => {
    switch (activePage) {
      case "overview":
        return <FarmerOverview user={user} />;
      case "products":
        return <ProductManager />;
      case "grading":
        return <CardamomGrading />;
      case "prices":
        return <CardamomPriceTracker />;
      case "predictor":
        return <DiseasePredictor />;
      case "agricare":
        return <ConnectAgriCare />;
      case "feedback":
        return <FeedbackForm title="Farmer Feedback" />;
      case "profile":
        return <FarmerProfile user={user} />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      user={user}
      menuItems={menuItems}
      pageTitle={`Farmer Dashboard - ${activePage.charAt(0).toUpperCase() + activePage.slice(1)}`}
      roleName="Farmer"
      onMenuItemClick={setActivePage}
    >
      {renderPageContent()}
    </DashboardLayout>
  );
}