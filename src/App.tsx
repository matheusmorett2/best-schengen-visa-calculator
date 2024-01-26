import React from "react";
import Header from "./components/Header"; // Adjust the path as necessary
import DateRangeInput from "./components/DateRange";

const App: React.FC = () => {
  return (
    <div>
      <Header />
      <div className="flex justify-center min-h-screen">
        <div className="w-full max-w-lg pt-4">
          <DateRangeInput />
        </div>
      </div>
    </div>
  );
};

export default App;
